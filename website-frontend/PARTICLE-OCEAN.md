# 🌊 Particle Ocean — High-Tech WebGL Animated Background

A lightweight, bright-tone, cinematic 3D animated ocean background engineered with Three.js and custom GLSL shaders. Designed specifically for high-conversion SaaS & AI landing pages where text readability, optical depth of field, and silky performance are paramount.

---

## 1. Quick Setup & Integration

### A. Standalone HTML Demo (`index.html`)

The standalone demo is completely self-contained in `public/particle-ocean/index.html`. It loads Three.js via an import map and does not require any build steps or bundlers.

**To run locally:**
```bash
# Using npx serve (recommended)
npx serve public/particle-ocean -l 3000

# Or using Python 3 built-in HTTP server
python -m http.server 3000 --directory public/particle-ocean
```
Then navigate to `http://localhost:3000` in your web browser.

---

### B. Next.js / React Component Drop-In

The component is exported as `ParticleOceanWebGL` (and aliased as `ParticleOcean`) from `@/components/effects/particle-ocean-webgl`.

```tsx
import { ParticleOceanWebGL } from "@/components/effects/particle-ocean-webgl";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#FFFFFF]">
      {/* Background WebGL Particle Ocean (non-blocking pointer events) */}
      <ParticleOceanWebGL fixed={false} />

      {/* Hero content positioned over the glowing top haze */}
      <div className="relative z-10 max-w-4xl mx-auto pt-[16vh] text-center px-6">
        <h1 className="text-[#0B1B3F] text-5xl md:text-6xl font-bold tracking-tight">
          Next-Generation Autonomous Talent Platform
        </h1>
        <p className="mt-6 text-[#33415E] text-lg md:text-xl">
          Harness the power of AI-orchestrated workflows with instant settlement and verified credibility.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="px-8 py-3.5 rounded-full bg-[#2F6BFF] hover:bg-[#1747C9] text-white font-semibold">
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
```

> **Note on naming:** The legacy 2D canvas effect for login/register remains in `particle-ocean.tsx`. For the WebGL 3D engine, always import explicitly from `@/components/effects/particle-ocean-webgl`.

---

## 2. Configurable Parameters (14 Parameters)

You can pass any subset of these parameters as React props to `<ParticleOceanWebGL ... />`, or modify the `CONFIG` object at the top of `public/particle-ocean/index.html`.

| Parameter | Type / Unit | Default | Effect on Screen | Recommended Range |
|---|---|---|---|---|
| `particleCount` | `{ cols, rows }` or `number` | `{ cols: 400, rows: 250 }` | Grid particle density. Automatically scaled down on mobile/low-end devices. | `10,000` – `120,000` |
| `waveSpeed` | `number` | `0.35` | Speed multiplier for wave swells. Lower values produce a calm, hypnotic rolling sea. | `0.1` – `0.8` |
| `waveAmplitude` | `number` | `1.0` | Vertical scale (Y displacement) of ocean wave peaks. | `0.5` – `1.8` |
| `waveScale` | `number` | `0.055` | Spatial frequency of waves. Smaller numbers yield longer, broader swells. | `0.03` – `0.09` |
| `particleSize` | `number` | `1.6` | Base particle size multiplier before perspective attenuation. | `1.0` – `2.5` |
| `bokehStrength` | `number` | `1.0` | Foreground bokeh blur factor. Magnifies near-camera particles into soft octagonal bokeh discs. | `0.5` – `1.5` |
| `focusDistance` | `number` (world units) | `26.0` | Focal plane distance. Particles around this distance remain crisp and sharp. | `15.0` – `40.0` |
| `colorNear` | `string` (hex) | `#2F6BFF` | Royal blue tint on wave crests and slopes near the camera. | `#1E40AF` – `#3B82F6` |
| `colorDeep` | `string` (hex) | `#1747C9` | Deep cobalt tone in wave troughs and underlying water body. | `#0F2B7A` – `#1E3A8A` |
| `colorFar` | `string` (hex) | `#BFD8FF` | Pale sky blue fade toward the distance. | `#93C5FD` – `#DBEAFE` |
| `fogColor` | `string` (hex) | `#FFFFFF` | Atmospheric horizon fog color. Seamlessly merges distant waves into pure white. | `#F8FAFC` – `#FFFFFF` |
| `bloomStrength` | `number` | `0` (OFF) | Post-processing UnrealBloom strength. Keep at `0` for best performance; `0.25` – `0.4` on discrete GPUs. | `0` – `0.5` |
| `cameraHeight` | `number` (world units) | `6.0` | Camera vertical elevation. Lower height places the horizon lower for dramatic perspective. | `4.5` – `8.0` |
| `mouseParallax` | `boolean` | `true` | Subtle mouse movement parallax eased with lerp damping. Automatically disabled on touch screens. | `true` / `false` |
| `pauseOffscreen` | `boolean` | `true` | Uses `IntersectionObserver` & `visibilitychange` to freeze RAF rendering when offscreen or tab hidden. | `true` / `false` |

---

## 3. Architecture & Performance Engineering

1. **Zero per-frame JS particle iterations:**
   - Particle motion is 100% computed inside the GPU vertex shader via `uTime`.
   - The CPU animation tick only updates uniform scalars (`uTime`, `uPixelRatio`) and calculates camera lerp coordinates.

2. **Batched Draw Calls:**
   - 1 single draw call for the entire ~100k particle field (`THREE.Points` with `BufferGeometry`).
   - 1 single draw call for the underlying translucent water surface mesh (`THREE.Mesh`).
   - Total scene cost: **2 draw calls**.

3. **Dynamic Hardware Throttling & DPR Capping:**
   - Capped at `DPR <= 2.0` on high-DPI desktop screens and `DPR <= 1.5` on mobile.
   - Particle grid resolution automatically adapts via `resolveParticleCount()`:
     - Mobile: capped at `220 × 140` (~30k particles).
     - Low-end hardware (`hardwareConcurrency <= 4` or `deviceMemory <= 4`): capped at `160 × 100` (~16k particles).
     - Portrait orientation: reduces column count by 25% while maintaining wave rows.

4. **Resource Management & Zero-Leak Guarantee:**
   - Full 8-step disposal on unmount: cancels active RAF, disconnects `IntersectionObserver` and `ResizeObserver`, unbinds event listeners, disposes geometries, materials, post-processing composers, and calls `renderer.forceContextLoss()`.
   - Freezes rendering completely when the tab is hidden (`document.visibilitychange`) or the canvas is scrolled out of view.

5. **Accessibility (`prefers-reduced-motion`):**
   - Renders a single still frame (`uTime = 0`) when user preferences indicate reduced motion, eliminating unnecessary motion sickness.

---

## 4. Troubleshooting & FAQ

- **Black or blank screen?**
  - Check browser WebGL support. If WebGL is blocked or disabled, the built-in fallback CSS gradient automatically displays beneath the content.
- **Color banding on high-brightness monitors?**
  - The fragment shaders include high-frequency anti-banding dithering (`±1/255`), combined with `ACESFilmicToneMapping` and transparent clear color to prevent 8-bit banding artifacts.
- **Buttons / CTA links not clickable?**
  - Ensure the canvas container has `pointer-events: none` and a background z-index (e.g. `-z-[1]` or `z-0` behind content with `z-10`). The provided `<ParticleOceanHero />` handles this automatically.
- **Heavy frame rate drops?**
  - Ensure `bloomStrength` is `0` (default). Bloom passes require multi-stage fullscreen blurs.
  - Check that device pixel ratio is clamped (the component clamps DPR automatically).
