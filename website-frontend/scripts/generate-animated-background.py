import os
import sys
import time
import math
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import scipy.ndimage as ndi
import subprocess

# Prevent OpenBLAS thread contention
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_img_path = os.path.join(root_dir, "public", "particle-ocean", "clippipe-4x.jpeg")
    out_dir = os.path.join(root_dir, "public", "assets")
    os.makedirs(out_dir, exist_ok=True)

    print(f"Reading master image from {input_img_path}...")
    img = Image.open(input_img_path)
    orig_w, orig_h = img.size

    # Standard 16:9 full HD crop (1920x1080)
    target_w, target_h = 1920, 1080
    crop_h = int(orig_w * 9 / 16) # 1800
    top = int((orig_h - crop_h) * 0.45)
    bottom = top + crop_h

    img_16_9 = img.crop((0, top, orig_w, bottom)).resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Enhance brightness, clarity, vibrance, and sharpness to remove any murkiness/blur
    enh_bright = ImageEnhance.Brightness(img_16_9).enhance(1.05)
    enh_contrast = ImageEnhance.Contrast(enh_bright).enhance(1.10)
    enh_color = ImageEnhance.Color(enh_contrast).enhance(1.15)
    # Unsharp mask for pin-sharp particle dots and crisp wave crests
    sharp_master = enh_color.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))

    base_arr = np.array(sharp_master, dtype=np.float32)
    H, W, C = base_arr.shape

    # Save static fallback images
    fallback_webp = os.path.join(out_dir, "particle-ocean-fallback.webp")
    fallback_jpg = os.path.join(out_dir, "particle-ocean-fallback.jpg")
    sharp_master.save(fallback_webp, "WEBP", quality=92, method=6)
    sharp_master.save(fallback_jpg, "JPEG", quality=95, optimize=True)
    print(f"Saved razor-sharp fallback image to {fallback_webp} ({os.path.getsize(fallback_webp) / 1024:.1f} KB)")
    print(f"Saved razor-sharp fallback image to {fallback_jpg} ({os.path.getsize(fallback_jpg) / 1024:.1f} KB)")

    # Precompute grids & envelopes
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    y_norm = Y / H

    envelope_waves = np.exp(-((y_norm - 0.52) ** 2) / (2 * 0.18 ** 2)).astype(np.float32)
    envelope_bokeh = np.exp(-((y_norm - 0.88) ** 2) / (2 * 0.15 ** 2)).astype(np.float32)
    top_mask = np.clip((y_norm - 0.15) / 0.15, 0.0, 1.0)
    envelope_waves *= top_mask

    amp_x = (8.5 * envelope_waves + 2.5 * envelope_bokeh).astype(np.float32)
    amp_y = (5.0 * envelope_waves + 1.8 * envelope_bokeh).astype(np.float32)

    # Highlight mask for particle sparkles
    brightness = 0.299 * base_arr[:, :, 0] + 0.587 * base_arr[:, :, 1] + 0.114 * base_arr[:, :, 2]
    high_mask = np.clip((brightness - 200.0) / 50.0, 0.0, 1.0).astype(np.float32)

    total_frames = 150 # 5 seconds at 30 fps (clean, responsive, lightweight)
    fps = 30

    out_mp4 = os.path.join(out_dir, "particle-ocean.mp4")
    out_webm = os.path.join(out_dir, "particle-ocean.webm")

    # Start ffmpeg process for MP4 (high clarity, crf 19, faststart)
    cmd_mp4 = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        out_mp4
    ]

    print(f"\nRendering {total_frames} ultra-sharp frames directly into MP4 pipeline...")
    t0 = time.time()
    proc_mp4 = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE)

    warped = np.zeros_like(base_arr)

    for i in range(total_frames):
        t = i / total_frames
        tau = 2.0 * math.pi * t

        dx = (
            amp_x * np.sin(2 * np.pi * 1.5 * X / W - tau) +
            amp_x * 0.35 * np.cos(2 * np.pi * 2.8 * X / W + tau + 0.8) +
            amp_x * 0.20 * np.sin(2 * np.pi * 4.2 * X / W - tau * 2.0)
        )

        dy = (
            amp_y * np.cos(2 * np.pi * 1.5 * X / W - tau) +
            amp_y * 0.35 * np.sin(2 * np.pi * 2.8 * X / W - tau * 2.0 + 0.4) +
            amp_y * 0.20 * np.cos(2 * np.pi * 3.8 * X / W - tau)
        )

        map_y = np.clip(Y + dy, 0, H - 1)
        map_x = np.clip(X + dx, 0, W - 1)

        for c in range(3):
            warped[:, :, c] = ndi.map_coordinates(base_arr[:, :, c], [map_y, map_x], order=1, mode="reflect")

        # Sparkle modulation for radiant highlights
        twinkle = 1.0 + 0.06 * np.sin(4.0 * tau + X * 0.05 + Y * 0.05) * high_mask
        frame_u8 = np.clip(warped * twinkle[:, :, None], 0, 255).astype(np.uint8)

        proc_mp4.stdin.write(frame_u8.tobytes())

        if (i + 1) % 25 == 0 or i == total_frames - 1:
            print(f"  Rendered frame {i + 1}/{total_frames} ({time.time() - t0:.1f}s)")

    proc_mp4.stdin.close()
    proc_mp4.wait()
    print(f"MP4 completed in {time.time() - t0:.1f}s: {os.path.getsize(out_mp4) / (1024 * 1024):.2f} MB")

    # Transcode MP4 to WebM using VP9 with high bitrate for razor-sharp clarity
    print("Transcoding WebM from MP4 (VP9 high clarity)...")
    t1 = time.time()
    cmd_webm = [
        "ffmpeg", "-y",
        "-i", out_mp4,
        "-c:v", "libvpx-vp9",
        "-b:v", "2200k",
        "-crf", "22",
        "-quality", "good",
        "-speed", "2",
        "-an",
        out_webm
    ]
    subprocess.run(cmd_webm, check=True)
    print(f"WebM completed in {time.time() - t1:.1f}s: {os.path.getsize(out_webm) / (1024 * 1024):.2f} MB")

    print("\n================ ASSETS GENERATION COMPLETE ================")
    print(f"WebM: {out_webm} ({os.path.getsize(out_webm)/(1024*1024):.2f} MB)")
    print(f"MP4:  {out_mp4} ({os.path.getsize(out_mp4)/(1024*1024):.2f} MB)")
    print(f"WebP: {fallback_webp} ({os.path.getsize(fallback_webp)/1024:.1f} KB)")
    print(f"JPG:  {fallback_jpg} ({os.path.getsize(fallback_jpg)/1024:.1f} KB)")
    print("============================================================\n")

if __name__ == "__main__":
    main()
