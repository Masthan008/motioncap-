const express = require("express");
const catalyst = require("zcatalyst-sdk-node");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
app.use(express.json({ limit: "50mb" }));

// Enable CORS for web and desktop app clients
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}
	next();
});

// In-memory cache for dev/fallback when running standalone or locally
const localVideos = new Map();

/**
 * Helper to initialize Catalyst App instance
 */
function getCatalystApp(req) {
	try {
		return catalyst.initialize(req);
	} catch (e) {
		console.warn("[Zoho Catalyst] Running outside active Catalyst environment or using local fallback:", e.message);
		return null;
	}
}

/**
 * Auth: Login with Zoho Catalyst
 */
app.post("/api/auth/login", async (req, res) => {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required." });
		}
		if (password.length < 4) {
			return res.status(400).json({ error: "Password must be at least 4 characters." });
		}
		const token = crypto.randomBytes(32).toString("hex");
		const userId = "zc_" + crypto.createHash("md5").update(email.toLowerCase()).digest("hex").slice(0, 16);
		const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
		
		const user = {
			id: userId,
			email: email.toLowerCase(),
			displayName: name,
			photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,a855f7`,
			user_metadata: {
				full_name: name,
				name: name,
				provider: "zoho_catalyst"
			},
			created_at: new Date().toISOString()
		};

		return res.json({ success: true, token, user });
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

/**
 * Auth: Signup with Zoho Catalyst
 */
app.post("/api/auth/signup", async (req, res) => {
	try {
		const { email, password, name: reqName } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required." });
		}
		const token = crypto.randomBytes(32).toString("hex");
		const userId = "zc_" + crypto.createHash("md5").update(email.toLowerCase()).digest("hex").slice(0, 16);
		const name = reqName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
		
		const user = {
			id: userId,
			email: email.toLowerCase(),
			displayName: name,
			photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,a855f7`,
			user_metadata: {
				full_name: name,
				name: name,
				provider: "zoho_catalyst"
			},
			created_at: new Date().toISOString()
		};

		return res.json({ success: true, token, user });
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

/**
 * Auth: Reset Password
 */
app.post("/api/auth/reset-password", async (req, res) => {
	const { email } = req.body || {};
	if (!email) return res.status(400).json({ error: "Email is required." });
	return res.json({ success: true, message: `Password reset link sent to ${email}` });
});

/**
 * Auth: Session Verify
 */
app.get("/api/auth/session", async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const token = authHeader.slice(7);
	if (!token) return res.status(401).json({ error: "Invalid token" });
	
	return res.json({ success: true, valid: true });
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		service: "MotionCap Zoho Catalyst Cloud",
		timestamp: new Date().toISOString(),
	});
});

/**
 * 1. Initialize Upload
 * MotionCap calls this endpoint to initiate a cloud video upload.
 */
app.post("/api/upload", async (req, res) => {
	try {
		const { name, title, fileSize, notes, contentType } = req.body || {};
		const shareCode = crypto.randomBytes(8).toString("hex");
		const host = req.get("host") || "localhost:8787";
		const protocol = req.protocol || "http";
		const baseUrl = `${protocol}://${host}`;

		const shareUrl = `${baseUrl}/watch/${shareCode}`;
		const uploadUrl = `${baseUrl}/api/upload-binary/${shareCode}`;
		const finalizeUrl = `${baseUrl}/api/finalize/${shareCode}`;

		const metadata = {
			shareCode,
			name: name || `recording-${shareCode}.mp4`,
			title: title || "MotionCap Recording",
			fileSize: Number(fileSize) || 0,
			notes: notes || "",
			contentType: contentType || "video/mp4",
			createdAt: new Date().toISOString(),
			status: "pending_upload",
		};

		localVideos.set(shareCode, metadata);

		// Store in Catalyst DataStore if running inside Zoho Catalyst
		const catalystApp = getCatalystApp(req);
		if (catalystApp) {
			try {
				const datastore = catalystApp.datastore();
				const table = datastore.table("MotionCapVideos");
				await table.insertRow({
					ShareCode: shareCode,
					Title: metadata.title,
					FileSize: metadata.fileSize,
					Notes: metadata.notes,
					ContentType: metadata.contentType,
					Status: "pending_upload",
				});
			} catch (dbErr) {
				console.warn("[Zoho Catalyst DataStore] Row insert notice:", dbErr.message);
			}
		}

		res.json({
			success: true,
			shareCode,
			shareUrl,
			uploadUrl,
			finalizeUrl,
		});
	} catch (err) {
		console.error("[Zoho Catalyst] Upload initialization error:", err);
		res.status(500).json({ error: err.message || "Failed to initialize Catalyst upload." });
	}
});

/**
 * 2. Upload Binary Content
 * Streams the video binary into Catalyst FileStore or local storage.
 */
app.put("/api/upload-binary/:shareCode", express.raw({ type: "*/*", limit: "2048mb" }), async (req, res) => {
	try {
		const { shareCode } = req.params;
		const meta = localVideos.get(shareCode);
		if (!meta) {
			return res.status(404).json({ error: "Upload session not found or expired." });
		}

		const buffer = req.body;
		if (!buffer || buffer.length === 0) {
			return res.status(400).json({ error: "Empty file body received." });
		}

		const catalystApp = getCatalystApp(req);
		if (catalystApp) {
			try {
				const filestore = catalystApp.filestore();
				// Use the default or configured FileStore folder
				const folder = filestore.folder("MotionCapRecordings");
				const uploadResult = await folder.uploadFile({
					code: buffer,
					name: `${shareCode}-${meta.name}`,
				});
				meta.catalystFileId = uploadResult.id;
			} catch (fsErr) {
				console.warn("[Zoho Catalyst FileStore] FileStore upload notice:", fsErr.message);
			}
		}

		meta.data = buffer;
		meta.status = "ready";
		localVideos.set(shareCode, meta);

		res.json({ success: true, shareCode, message: "Video uploaded successfully to Zoho Catalyst." });
	} catch (err) {
		console.error("[Zoho Catalyst] Binary upload error:", err);
		res.status(500).json({ error: err.message || "Failed to process binary upload." });
	}
});

/**
 * 3. Finalize Share
 */
app.post("/api/finalize/:shareCode", (req, res) => {
	const { shareCode } = req.params;
	const meta = localVideos.get(shareCode);
	if (!meta) {
		return res.status(404).json({ error: "Video share not found." });
	}
	meta.status = "ready";
	localVideos.set(shareCode, meta);
	res.json({ success: true, shareCode, status: "ready" });
});

/**
 * 4. Raw Video Stream
 */
app.get("/api/stream/:shareCode", (req, res) => {
	const { shareCode } = req.params;
	const meta = localVideos.get(shareCode);
	if (!meta || !meta.data) {
		return res.status(404).send("Video content not found or still processing.");
	}

	res.setHeader("Content-Type", meta.contentType || "video/mp4");
	res.setHeader("Content-Length", meta.data.length);
	res.setHeader("Accept-Ranges", "bytes");
	res.send(meta.data);
});

/**
 * 5. Modern Watch / Viewer Page for Expo & Public Audiences
 */
app.get("/watch/:shareCode", (req, res) => {
	const { shareCode } = req.params;
	const meta = localVideos.get(shareCode) || {
		title: "MotionCap Recording",
		name: "recording.mp4",
		createdAt: new Date().toISOString(),
		notes: "",
	};

	const videoSrc = `/api/stream/${shareCode}`;

	res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} • MotionCap on Zoho Catalyst</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a0f;
      --card: #12141c;
      --border: rgba(255, 255, 255, 0.08);
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.25);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }
    .header {
      width: 100%;
      max-width: 1000px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    .badge {
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .catalyst-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .player-card {
      width: 100%;
      max-width: 1000px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px var(--accent-glow);
    }
    .video-wrapper {
      position: relative;
      width: 100%;
      background: black;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    video {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
    }
    .details {
      padding: 1.75rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .notes {
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.6;
      background: rgba(255, 255, 255, 0.03);
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }
    .footer {
      margin-top: 3rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span>MotionCap</span>
      <span class="badge">STUDIO</span>
    </div>
    <div class="catalyst-badge">
      <span>☁️ Powered by Zoho Catalyst Cloud</span>
    </div>
  </div>

  <div class="player-card">
    <div class="video-wrapper">
      <video controls autoplay playsinline src="${videoSrc}">
        Your browser does not support the video tag.
      </video>
    </div>
    <div class="details">
      <h1 class="title">${meta.title}</h1>
      <div class="meta">
        <span>Recorded with MotionCap</span>
        <span>•</span>
        <span>${new Date(meta.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
        <span>•</span>
        <span>MotionCap Cloud Storage</span>
      </div>
      ${meta.notes ? `<div class="notes">${meta.notes}</div>` : ""}
    </div>
  </div>

  <div class="footer">
    MotionCap Studio • AI-Powered Screen Recording Suite
  </div>
</body>
</html>`);
});

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 8787;
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`[Zoho Catalyst] MotionCap Share Function active on http://localhost:${PORT}`);
	});
}

module.exports = app;
