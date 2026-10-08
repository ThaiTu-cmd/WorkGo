import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request
import websockets

SCRATCH_DIR = r"C:\Users\Tran Huu Trung\.gemini\antigravity-cli\brain\5bc7fe77-5dec-4f27-8355-dcc08bd2d5b1\scratch"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE_DIR = os.path.join(SCRATCH_DIR, "chrome_profile")
os.makedirs(PROFILE_DIR, exist_ok=True)

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.ws = None
        self.msg_id = 0
        self.console_errors = []

    async def connect(self):
        print(f"Connecting to CDP websocket at {self.ws_url}...", flush=True)
        self.ws = await websockets.connect(self.ws_url, max_size=50 * 1024 * 1024)
        asyncio.create_task(self._listen())
        await self.send("Runtime.enable")
        await self.send("Page.enable")
        await self.send("Log.enable")
        print("Connected and enabled domains.", flush=True)

    async def _listen(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                if msg.get("method") == "Runtime.consoleAPICalled":
                    call_type = msg["params"].get("type")
                    if call_type in ("error", "warning"):
                        args = [str(a.get("value", a.get("description", ""))) for a in msg["params"].get("args", [])]
                        self.console_errors.append(f"[{call_type.upper()}] " + " ".join(args))
                elif msg.get("method") == "Runtime.exceptionThrown":
                    desc = msg["params"]["exceptionDetails"].get("text", "")
                    self.console_errors.append(f"[EXCEPTION] {desc}")
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    async def send(self, method, params=None):
        self.msg_id += 1
        curr_id = self.msg_id
        payload = {"id": curr_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        while True:
            raw = await self.ws.recv()
            resp = json.loads(raw)
            if resp.get("id") == curr_id:
                if "error" in resp:
                    raise Exception(f"CDP error in {method}: {resp['error']}")
                return resp.get("result", {})

    async def eval_js(self, expression):
        res = await self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        val = res.get("result", {}).get("value")
        return val

    async def navigate(self, url):
        print(f"Navigating to {url}...", flush=True)
        await self.send("Page.navigate", {"url": url})
        await asyncio.sleep(2.5)

    async def set_viewport(self, width, height, mobile=False):
        await self.send("Emulation.setDeviceMetricsOverride", {
            "width": width,
            "height": height,
            "deviceScaleFactor": 1,
            "mobile": mobile
        })
        await asyncio.sleep(0.5)

    async def set_reduced_motion(self, enabled=True):
        await self.send("Emulation.setEmulatedMedia", {
            "features": [{"name": "prefers-reduced-motion", "value": "reduce" if enabled else "no-preference"}]
        })
        await asyncio.sleep(0.8)

    async def screenshot(self, file_path):
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        data = base64.b64decode(res["data"])
        with open(file_path, "wb") as f:
            f.write(data)

    async def close(self):
        if self.ws:
            await self.ws.close()

async def run_verification():
    print("Starting Chrome headless...", flush=True)
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={PROFILE_DIR}",
        "--disable-gpu",
        "--no-first-run",
        "--autoplay-policy=no-user-gesture-required",
        "about:blank"
    ])
    await asyncio.sleep(3.0)

    try:
        # Get target websocket URL
        req = urllib.request.Request("http://127.0.0.1:9222/json/new", method="PUT")
        with urllib.request.urlopen(req, timeout=5) as r:
            target = json.loads(r.read().decode())
            ws_url = target["webSocketDebuggerUrl"]

        client = CDPClient(ws_url)
        await client.connect()

        pages_to_test = [
            ("Landing Page", "http://localhost:3000/vi", "landing"),
            ("Login Page", "http://localhost:3000/vi/login", "login"),
            ("Register Page", "http://localhost:3000/vi/register", "register"),
        ]

        results = {}

        for title, url, slug in pages_to_test:
            print(f"\n=================== TESTING {title.upper()} ({url}) ===================", flush=True)
            client.console_errors.clear()

            # 1. Desktop Test
            await client.set_reduced_motion(False)
            await client.set_viewport(1440, 900, mobile=False)
            await client.navigate(url)

            # Inspect video element
            video_info = await client.eval_js("""
                (() => {
                    const video = document.querySelector('video');
                    if (!video) return { exists: false };
                    const sources = Array.from(video.querySelectorAll('source')).map(s => ({
                        src: s.getAttribute('src'),
                        type: s.getAttribute('type')
                    }));
                    const fallbackImg = video.querySelector('img');
                    return {
                        exists: true,
                        autoPlay: video.autoplay,
                        muted: video.muted,
                        loop: video.loop,
                        playsInline: video.playsInline,
                        className: video.className,
                        readyState: video.readyState,
                        paused: video.paused,
                        currentTime: video.currentTime,
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        sources: sources,
                        hasFallbackImg: !!fallbackImg,
                        fallbackSrc: fallbackImg ? fallbackImg.getAttribute('src') : null,
                        parentPointerEvents: window.getComputedStyle(video.parentElement).pointerEvents
                    };
                })()
            """)

            # Check interaction non-blocking
            interaction_info = await client.eval_js("""
                (() => {
                    const video = document.querySelector('video');
                    if (!video) return { clickThruOk: false };
                    const rect = video.getBoundingClientRect();
                    const elAtCenter = document.elementFromPoint(rect.width / 2, rect.height / 2);
                    return {
                        elementOnTop: elAtCenter ? elAtCenter.tagName + (elAtCenter.className ? '.' + elAtCenter.className.slice(0, 30) : '') : null,
                        videoIsClickTarget: elAtCenter === video
                    };
                })()
            """)

            # Capture desktop screenshot (Dark mode)
            desktop_shot = os.path.join(SCRATCH_DIR, f"{slug}_desktop.png")
            await client.screenshot(desktop_shot)
            print(f"  [x] Desktop screenshot saved: {desktop_shot}", flush=True)

            # 1b. Light Theme Test
            await client.eval_js("document.documentElement.setAttribute('data-theme', 'light'); window.dispatchEvent(new CustomEvent('workgo-theme-change', { detail: { theme: 'light' } }));")
            await asyncio.sleep(0.5)
            light_shot = os.path.join(SCRATCH_DIR, f"{slug}_light.png")
            await client.screenshot(light_shot)
            print(f"  [x] Light theme screenshot saved: {light_shot}", flush=True)

            # Revert to dark theme
            await client.eval_js("document.documentElement.setAttribute('data-theme', 'dark'); window.dispatchEvent(new CustomEvent('workgo-theme-change', { detail: { theme: 'dark' } }));")
            await asyncio.sleep(0.3)

            # 2. Mobile Responsive Test (iPhone / standard mobile viewport 390x844)
            await client.set_viewport(390, 844, mobile=True)
            await asyncio.sleep(0.5)
            mobile_shot = os.path.join(SCRATCH_DIR, f"{slug}_mobile.png")
            await client.screenshot(mobile_shot)
            print(f"  [x] Mobile screenshot saved: {mobile_shot}", flush=True)

            # 3. Accessibility / Reduced Motion Test
            await client.set_reduced_motion(True)
            await asyncio.sleep(1.0)
            reduced_motion_info = await client.eval_js("""
                (() => {
                    const video = document.querySelector('video');
                    const img = document.querySelector('img[src*="particle-ocean-fallback"]');
                    return {
                        videoPresent: !!video,
                        fallbackImgPresent: !!img,
                        fallbackSrc: img ? img.getAttribute('src') : null
                    };
                })()
            """)
            reduced_shot = os.path.join(SCRATCH_DIR, f"{slug}_reduced_motion.png")
            await client.screenshot(reduced_shot)
            print(f"  [x] Reduced motion screenshot saved: {reduced_shot}", flush=True)

            results[slug] = {
                "title": title,
                "video": video_info,
                "interaction": interaction_info,
                "reducedMotion": reduced_motion_info,
                "errors": list(client.console_errors)
            }

            print(f"  Video present: {video_info.get('exists')}", flush=True)
            print(f"  AutoPlay: {video_info.get('autoPlay')}, Muted: {video_info.get('muted')}, Loop: {video_info.get('loop')}, PlaysInline: {video_info.get('playsInline')}", flush=True)
            print(f"  Video dimensions: {video_info.get('videoWidth')}x{video_info.get('videoHeight')}", flush=True)
            print(f"  Video sources: {video_info.get('sources')}", flush=True)
            print(f"  Pointer events non-blocking (video not click target): {not interaction_info.get('videoIsClickTarget')}", flush=True)
            print(f"  Reduced motion static fallback active: {reduced_motion_info.get('fallbackImgPresent') and not reduced_motion_info.get('videoPresent')}", flush=True)
            print(f"  Console errors: {len(client.console_errors)}", flush=True)

        await client.close()
        print("\n================ VERIFICATION COMPLETE ================", flush=True)
        with open(os.path.join(SCRATCH_DIR, "browser_verification_results.json"), "w") as f:
            json.dump(results, f, indent=2)

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()

if __name__ == "__main__":
    asyncio.run(run_verification())
