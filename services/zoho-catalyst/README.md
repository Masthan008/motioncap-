# MotionCap Zoho Catalyst Cloud Integration

This directory contains the serverless backend configuration and Advanced I/O function for **MotionCap**.

With this integration, MotionCap recordings can be uploaded directly to **Zoho Catalyst FileStore**, indexed in **Zoho Catalyst DataStore**, and instantly shared via a high-speed cloud CDN with an interactive web player and mobile QR code.

---

## 🚀 Laptop / Environment Setup Guide

Follow these steps on your development laptop to set up and deploy Zoho Catalyst:

### 1. Prerequisites
- **Node.js**: Version 18 or higher (`node -v`)
- **NPM**: Version 9 or higher (`npm -v`)
- **Zoho Account**: [Sign up for Zoho Catalyst](https://catalyst.zoho.com/) (Free tier available)

---

### 2. Install Zoho Catalyst CLI
Open PowerShell or Terminal and install the official Zoho Catalyst CLI globally:

```bash
npm install -g zcatalyst-cli
```

Verify installation:
```bash
catalyst --version
```

---

### 3. Log In to Zoho Catalyst
Authenticate the CLI with your Zoho account:

```bash
catalyst login
```
*A browser window will open asking you to authorize the Catalyst CLI.*

---

### 4. Initialize Project
Navigate to this directory on your laptop:

```bash
cd services/zoho-catalyst
catalyst init
```
*Select your Zoho Catalyst project (or create a new one named `MotionCap-Cloud`).*
*Select `Functions` and associate `motioncap_share`.*

---

### 5. Create Cloud Resources in Catalyst Console
1. **FileStore**:
   - Go to **Catalyst Web Console > FileStore**.
   - Create a Folder named: `MotionCapRecordings`.
2. **DataStore**:
   - Go to **Catalyst Web Console > DataStore**.
   - Create a Table named: `MotionCapVideos`.
   - Add columns:
     - `ShareCode` (VarChar)
     - `Title` (VarChar)
     - `FileSize` (BigInt)
     - `Notes` (VarChar)
     - `ContentType` (VarChar)
     - `Status` (VarChar)

---

### 6. Test Locally on Your Laptop
Start the local Catalyst emulator:

```bash
cd services/zoho-catalyst/functions/motioncap_share
npm install
catalyst serve
```

Your function will run at `http://localhost:8787`. You can test the health endpoint:
```bash
curl http://localhost:8787/health
```

---

### 7. Deploy to Production
Deploy the serverless backend to the Zoho Catalyst Cloud:

```bash
cd services/zoho-catalyst
catalyst deploy
```

Once deployed, Catalyst will output your production endpoint:
```
https://motioncap-xxxxxx.catalystserverless.in/server/motioncap_share/api/upload
```

---

## 🏆 Cloud Sharing & Presentation Showcase

Using MotionCap Cloud Sharing:
1. Record a high-resolution tutorial or presentation in MotionCap.
2. Edit with smooth cursor spring physics and smart zooms.
3. Click **Share via Cloud**.
4. The dialog will generate the **Live URL** and a **QR Code**.
5. Audiences and viewers can point their smartphone camera at the screen to scan the QR code and view the video streaming directly from MotionCap Cloud!
