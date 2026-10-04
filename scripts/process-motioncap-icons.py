import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

LOGO_PATH = r"C:\Users\masth\.gemini\antigravity-ide\brain\f8fc11c1-c064-4c90-b959-800a7ea5c003\motioncap_logo_1791121724498.jpg"
FAVICON_PATH = r"C:\Users\masth\.gemini\antigravity-ide\brain\f8fc11c1-c064-4c90-b959-800a7ea5c003\motioncap_favicon_1791121754131.jpg"

print(f"Loading logo: {LOGO_PATH}")
logo_img = Image.open(LOGO_PATH).convert("RGBA")

print(f"Loading favicon: {FAVICON_PATH}")
fav_img = Image.open(FAVICON_PATH).convert("RGBA")

# Target directories
public_app_icons = os.path.join(PROJECT_ROOT, "public", "app-icons")
public_dir = os.path.join(PROJECT_ROOT, "public")
icons_win = os.path.join(PROJECT_ROOT, "icons", "icons", "win")
icons_png = os.path.join(PROJECT_ROOT, "icons", "icons", "png")
branding_assets = os.path.join(PROJECT_ROOT, "branding", "source-assets")

for d in [public_app_icons, public_dir, icons_win, icons_png, branding_assets]:
    os.makedirs(d, exist_ok=True)

# Sizes needed
sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

# 1. Generate public/app-icons/motioncap-*.png and motioncapmac-*.png
for size in [16, 32, 64, 128, 256, 512, 1024]:
    resized = logo_img.resize((size, size), Image.Resampling.LANCZOS)
    out_file = os.path.join(public_app_icons, f"motioncap-{size}.png")
    resized.save(out_file, "PNG", optimize=True)
    out_mac = os.path.join(public_app_icons, f"motioncapmac-{size}.png")
    resized.save(out_mac, "PNG", optimize=True)
    print(f"Saved: {out_file}")

# 2. Generate icons/icons/png/WxH.png
for size in sizes:
    resized = logo_img.resize((size, size), Image.Resampling.LANCZOS)
    out_file = os.path.join(icons_png, f"{size}x{size}.png")
    resized.save(out_file, "PNG", optimize=True)
    print(f"Saved: {out_file}")

# 3. Generate branding/source-assets/*-mac.png
for size in [16, 32, 64, 128, 256, 512, 1024]:
    resized = logo_img.resize((size, size), Image.Resampling.LANCZOS)
    out_file = os.path.join(branding_assets, f"{size}-mac.png")
    resized.save(out_file, "PNG", optimize=True)
    print(f"Saved: {out_file}")

logo_img.resize((1024, 1024), Image.Resampling.LANCZOS).save(
    os.path.join(branding_assets, "motioncapmac.png"), "PNG", optimize=True
)

# 4. Generate Windows ICO: icons/icons/win/icon.ico (with multi-sizes: 16, 24, 32, 48, 64, 128, 256)
ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
win_ico_path = os.path.join(icons_win, "icon.ico")
logo_img.save(win_ico_path, format="ICO", sizes=ico_sizes)
print(f"Saved Windows App Icon: {win_ico_path}")

# 5. Generate Favicons: public/favicon.ico and public/favicon.png
fav_ico_sizes = [(16, 16), (32, 32), (48, 48)]
fav_ico_path = os.path.join(public_dir, "favicon.ico")
fav_img.save(fav_ico_path, format="ICO", sizes=fav_ico_sizes)
print(f"Saved Favicon ICO: {fav_ico_path}")

fav_32 = fav_img.resize((32, 32), Image.Resampling.LANCZOS)
fav_png_path = os.path.join(public_dir, "favicon.png")
fav_32.save(fav_png_path, "PNG", optimize=True)
print(f"Saved Favicon PNG: {fav_png_path}")

logo_512 = logo_img.resize((512, 512), Image.Resampling.LANCZOS)
logo_png_path = os.path.join(public_dir, "logo.png")
logo_512.save(logo_png_path, "PNG", optimize=True)
print(f"Saved Public Logo PNG: {logo_png_path}")

print("All MotionCap icon assets successfully processed and saved!")
