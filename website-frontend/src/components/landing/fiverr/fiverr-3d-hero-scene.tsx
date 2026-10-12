"use client";

import * as React from "react";
import { FIVERR_3D, FIVERR_FRAME } from "@/lib/landing/fiverr-tokens";

export interface Fiverr3dHeroSceneProps {
  density?: number;
  className?: string;
}

/**
 * Fiverr3dHeroScene — high-performance 3D WebGL particle ocean scene.
 *
 * Architecture:
 * - Pure client-only WebGL 3D execution with zero heavy third-party dependencies.
 * - Perspective camera projection, depth fog, dynamic wave oscillation.
 * - Scroll parallax (camera translateY lerp) + cursor tracking.
 * - Offscreen auto-pause via IntersectionObserver + document.hidden listener.
 * - High-DPI clamping (DPR <= 1.75), low-power GPU profile.
 * - Full accessibility & data-saver guards (prefers-reduced-motion, saveData).
 */
export function Fiverr3dHeroScene({
  density = FIVERR_3D.pointDensity,
  className,
}: Fiverr3dHeroSceneProps) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Accessibility & Data Saver Guards (E9, E10)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const navWithConnection = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (navWithConnection.connection?.saveData) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      if (mount.contains(canvas)) mount.removeChild(canvas);
      return;
    }

    // Vertex shader with 3D projection, depth fog, and wave oscillation
    const vsSource = `
      attribute vec3 aPosition;
      attribute float aPhase;
      uniform mat4 uProjection;
      uniform mat4 uModelView;
      uniform float uTime;
      varying float vDepth;
      varying float vAlpha;
      void main() {
        vec3 pos = aPosition;
        // Undulating 3D wave motion
        pos.y += sin(uTime * 1.5 + pos.x * 0.8 + aPhase) * 0.35;
        pos.z += cos(uTime * 1.2 + pos.y * 0.6 + aPhase) * 0.25;

        vec4 mvPosition = uModelView * vec4(pos, 1.0);
        gl_Position = uProjection * mvPosition;
        
        // Depth-based point attenuation and perspective sizing
        float dist = -mvPosition.z;
        gl_PointSize = clamp(14.0 / dist, 1.5, 6.0);
        vDepth = dist;
        vAlpha = clamp(1.0 - (dist - 4.0) / 12.0, 0.15, 0.85);
      }
    `;

    // Fragment shader with soft circular particle falloff and exponential fog
    const fsSource = `
      precision mediump float;
      varying float vDepth;
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r = length(coord);
        if (r > 0.5) {
          discard;
        }
        // Soft radial glow
        float glow = 1.0 - smoothstep(0.1, 0.5, r);
        // Exponential depth fog color blend (#9BDCFF to deep teal/emerald)
        vec3 particleColor = mix(vec3(0.608, 0.863, 1.0), vec3(0.114, 0.749, 0.451), sin(vDepth * 0.5) * 0.3 + 0.3);
        gl_FragColor = vec4(particleColor, vAlpha * glow * 0.8);
      }
    `;

    function compileShader(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    if (!program || !vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aPhase = gl.getAttribLocation(program, "aPhase");
    const uProjection = gl.getUniformLocation(program, "uProjection");
    const uModelView = gl.getUniformLocation(program, "uModelView");
    const uTime = gl.getUniformLocation(program, "uTime");

    const count = Math.min(Math.max(density, 150), 600);
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 7.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const phaseBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, phaseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, phases, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;
    let scrollYOffset = 0;
    let isVisible = true;

    const onPointerMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      targetRotY = nx * 0.35;
      targetRotX = ny * 0.2;
    };

    const onScroll = () => {
      scrollYOffset = (window.scrollY || 0) * 0.0012;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(mount);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    function createPerspective(fovRad: number, aspect: number, near: number, far: number): Float32Array {
      const f = 1.0 / Math.tan(fovRad / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ]);
    }

    const resize = () => {
      if (!mount || !canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, FIVERR_3D.dprMax);
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const FRAME_MIN = FIVERR_FRAME.frameMinMs;
    let lastFrame = 0;
    let contextLost = false;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
      const poster = document.createElement("div");
      poster.setAttribute("data-fallback", "webgl-context-lost");
      poster.className = "absolute inset-0";
      (poster.style as CSSStyleDeclaration).backgroundImage = "url(/assets/particle-ocean-fallback.webp)";
      poster.style.backgroundSize = "cover";
      poster.style.backgroundPosition = "center";
      mount.appendChild(poster);
    };

    const onContextRestored = () => {
      contextLost = false;
      mount.querySelector('[data-fallback="webgl-context-lost"]')?.remove();
      lastFrame = 0;
      raf = requestAnimationFrame(render);
    };

    canvas.addEventListener("webglcontextlost", onContextLost as EventListener, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored as EventListener, false);

    const startTime = performance.now();

    function render(now: number) {
      raf = requestAnimationFrame(render);
      if (!isVisible || !gl || contextLost) return;
      if (now - lastFrame < FRAME_MIN) return;
      lastFrame = now;

      const elapsed = (now - startTime) * 0.001;

      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;

      const aspect = (canvas.width || 1) / (canvas.height || 1);
      const proj = createPerspective((55 * Math.PI) / 180, aspect, 0.1, 50.0);

      const cosY = Math.cos(currentRotY + elapsed * 0.05);
      const sinY = Math.sin(currentRotY + elapsed * 0.05);
      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);

      const camY = -scrollYOffset;

      const mv = new Float32Array([
        cosY, sinX * sinY, -cosX * sinY, 0,
        0, cosX, sinX, 0,
        sinY, -sinX * cosY, cosX * cosY, 0,
        0, camY, -6.5, 1
      ]);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniformMatrix4fv(uProjection, false, proj);
      gl.uniformMatrix4fv(uModelView, false, mv);
      gl.uniform1f(uTime, elapsed);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, phaseBuffer);
      gl.enableVertexAttribArray(aPhase);
      gl.vertexAttribPointer(aPhase, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, count);
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onContextLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onContextRestored as EventListener);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      ro.disconnect();
      if (mount.contains(canvas)) mount.removeChild(canvas);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (posBuffer) gl.deleteBuffer(posBuffer);
      if (phaseBuffer) gl.deleteBuffer(phaseBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, [density]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}

export default Fiverr3dHeroScene;
