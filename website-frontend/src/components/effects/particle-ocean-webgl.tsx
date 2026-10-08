"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PARTICLE_OCEAN_CONFIG,
  ParticleOceanConfig,
  resolveParticleCount,
} from "./particle-ocean-webgl.config";

export interface ParticleOceanWebGLProps extends Partial<ParticleOceanConfig> {
  className?: string;
  fixed?: boolean; // default true: fixed inset-0 -z; false: absolute inside hero
  dprCap?: number; // default 2 desktop / 1.5 mobile
  reduceMotion?: "auto" | "still" | "slow"; // default 'auto' (according to matchMedia)
  onReady?: () => void;
  onWebGLFail?: (reason: string) => void;
}

/**
 * Shared GLSL wave function (Single Source of Truth)
 * Ashima Arts Simplex 3D Noise + 4 Directional Sines
 */
const WAVE_GLSL = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float waveHeight(vec2 p) {
  float t = uTime;
  float h = 0.0;
  h += sin(dot(p, vec2(1.0, 0.28)) * 0.105 + t * 0.35) * 1.15;
  h += sin(dot(p, vec2(-0.62, 1.0)) * 0.203 + t * 0.50) * 0.55;
  h += sin(dot(p, vec2(0.84, -0.66)) * 0.370 + t * 0.72) * 0.28;
  h += sin(dot(p, vec2(-0.24, -1.0)) * 0.698 + t * 1.05) * 0.12;
  h += snoise(vec3(p.x * 0.02, p.z * 0.02, t * 0.06)) * 0.9;
  return h * uAmplitude;
}
`;

const POINTS_VERTEX_SHADER = /* glsl */ `
attribute vec2 aRandom; // (sizeMult, phase)
uniform float uTime, uAmplitude, uScale, uPixelRatio, uParticleSize, uFocusDistance, uBokehStrength;
uniform vec3 uColorNear, uColorDeep, uColorFar, uFogColor;
varying vec3 vColor;
varying float vAlpha, vBokeh, vFog;

${WAVE_GLSL}

void main() {
  vec2 sp = position.xz * (uScale / 0.055);
  float h = waveHeight(sp);
  float e = 0.6;
  float hx = waveHeight(sp + vec2(e, 0.0));
  float hz = waveHeight(sp + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));
  vec3 displaced = vec3(position.x, h, position.z - 45.0);

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  float dist = -mv.z;
  gl_Position = projectionMatrix * mv;

  vec3 lightDir = normalize(vec3(0.35, 0.8, 0.25));
  float diff = clamp(dot(n, lightDir), 0.0, 1.0);
  float crest = smoothstep(-1.2, 2.2, h);
  float twinkle = 0.85 + 0.15 * sin(uTime * 0.8 + aRandom.y);
  float brightness = clamp(0.35 + crest * 0.9 + diff * 0.55, 0.0, 1.6) * twinkle;

  float tFar = smoothstep(8.0, 95.0, dist);
  vec3 base = mix(mix(uColorDeep, uColorNear, crest), uColorFar, tFar);
  base = mix(base, vec3(1.0), crest * 0.35 * (1.0 - tFar));
  vColor = base * (0.75 + brightness * 0.6);

  float focus = uFocusDistance;
  vBokeh = (1.0 - smoothstep(focus * 0.5, focus * 1.4, dist)) * uBokehStrength;
  float ps = uParticleSize * aRandom.x * (0.7 + brightness * 0.5);
  ps *= (1.0 + vBokeh * 3.2);
  gl_PointSize = clamp(ps * uPixelRatio * (180.0 / dist), 1.0, 64.0 * uPixelRatio);

  vAlpha = mix(0.95, 0.28, vBokeh);
  vAlpha *= 1.0 - smoothstep(95.0, 140.0, dist);
  vFog = smoothstep(45.0, 120.0, dist);
  vColor = mix(vColor, uFogColor, vFog * 0.85);
}
`;

const POINTS_FRAGMENT_SHADER = /* glsl */ `
varying vec3 vColor;
varying float vAlpha, vBokeh, vFog;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv) * 2.0;
  float oct = 0.0;
  {
    vec2 q = abs(uv * 2.0);
    float s = 0.9239; // cos(pi/8) approx regular octagon distance
    oct = max(dot(q, vec2(s, 0.3827)), max(q.x, q.y));
  }
  float crispMask = 1.0 - smoothstep(0.55, 1.0, r);
  float glowMask  = 1.0 - smoothstep(0.0, 1.0, r);
  float bokehMask = 1.0 - smoothstep(0.45, 0.95, oct);
  bokehMask *= 1.0 - smoothstep(0.7, 1.0, r);
  float mask = mix(crispMask + glowMask * 0.35, bokehMask * 0.85 + glowMask * 0.25, clamp(vBokeh, 0.0, 1.0));
  if (mask < 0.01) discard;
  vec3 col = vColor + vec3(0.08) * glowMask * (1.0 - vBokeh);
  // anti-banding dither
  float d = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col + d, vAlpha * mask);
}
`;

const WATER_VERTEX_SHADER = /* glsl */ `
uniform float uTime, uAmplitude, uScale;
uniform vec3 uColorNear, uColorDeep, uColorFar, uFogColor;
varying float vH, vDist;
varying vec3 vNormal, vViewDir;

${WAVE_GLSL}

void main() {
  vec2 sp = position.xz * (uScale / 0.055);
  float h = waveHeight(sp);
  float e = 0.6;
  float hx = waveHeight(sp + vec2(e, 0.0));
  float hz = waveHeight(sp + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));
  vec3 displaced = vec3(position.x, h - 0.05, position.z - 45.0);

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vDist = -mv.z;
  vH = h;
  vNormal = normalMatrix * n;
  vViewDir = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const WATER_FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColorNear, uColorDeep, uColorFar, uFogColor;
varying float vH, vDist;
varying vec3 vNormal, vViewDir;

void main() {
  vec3 deep = uColorDeep;
  vec3 near = uColorNear;
  vec3 far = uColorFar;
  vec3 col = mix(mix(deep, near, smoothstep(-1.5, 1.5, vH)), far, smoothstep(10.0, 100.0, vDist));
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.5);
  col += vec3(1.0) * fres * 0.55;
  col += vec3(1.0) * smoothstep(1.2, 2.4, vH) * 0.18;
  col = mix(col, uFogColor, smoothstep(45.0, 120.0, vDist) * 0.9);
  float alpha = mix(0.55, 0.15, smoothstep(5.0, 110.0, vDist));
  float d = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col + d, alpha);
}
`;

export function ParticleOceanWebGL({
  className,
  fixed = true,
  dprCap,
  reduceMotion = "auto",
  onReady,
  onWebGLFail,
  particleCount = DEFAULT_PARTICLE_OCEAN_CONFIG.particleCount,
  waveSpeed = DEFAULT_PARTICLE_OCEAN_CONFIG.waveSpeed,
  waveAmplitude = DEFAULT_PARTICLE_OCEAN_CONFIG.waveAmplitude,
  waveScale = DEFAULT_PARTICLE_OCEAN_CONFIG.waveScale,
  particleSize = DEFAULT_PARTICLE_OCEAN_CONFIG.particleSize,
  bokehStrength = DEFAULT_PARTICLE_OCEAN_CONFIG.bokehStrength,
  focusDistance = DEFAULT_PARTICLE_OCEAN_CONFIG.focusDistance,
  colorNear = DEFAULT_PARTICLE_OCEAN_CONFIG.colorNear,
  colorDeep = DEFAULT_PARTICLE_OCEAN_CONFIG.colorDeep,
  colorFar = DEFAULT_PARTICLE_OCEAN_CONFIG.colorFar,
  fogColor = DEFAULT_PARTICLE_OCEAN_CONFIG.fogColor,
  bloomStrength = DEFAULT_PARTICLE_OCEAN_CONFIG.bloomStrength,
  cameraHeight = DEFAULT_PARTICLE_OCEAN_CONFIG.cameraHeight,
  mouseParallax = DEFAULT_PARTICLE_OCEAN_CONFIG.mouseParallax,
  pauseOffscreen = DEFAULT_PARTICLE_OCEAN_CONFIG.pauseOffscreen,
}: ParticleOceanWebGLProps): React.JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const fallback = fallbackRef.current;
    if (!canvas || !container) return;

    const showFallback = (reason: string) => {
      if (fallback) fallback.style.display = "block";
      if (canvas) canvas.style.display = "none";
      onWebGLFail?.(reason);
    };

    // 1. Context check & Fallback
    let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      glContext =
        (canvas.getContext("webgl2", {
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }) as WebGL2RenderingContext | null) ||
        (canvas.getContext("webgl", {
          antialias: true,
          alpha: true,
        }) as WebGLRenderingContext | null);
    } catch {
      glContext = null;
    }

    if (!glContext) {
      showFallback("WebGL context unavailable");
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      showFallback("webglcontextlost");
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    // 2. Hardware and Screen Analysis
    const isMobileDevice =
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    const nav = navigator as unknown as {
      hardwareConcurrency?: number;
      deviceMemory?: number;
    };
    const isLowEndDevice =
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 4);
    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;
    const isPortrait = initialHeight > initialWidth;

    const effectiveDprCap =
      dprCap !== undefined ? dprCap : isMobileDevice ? 1.5 : 2;
    const currentDpr = Math.min(
      window.devicePixelRatio || 1,
      isMobileDevice ? 1.5 : 2,
      effectiveDprCap,
    );

    // 3. Renderer & Scene Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: glContext,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      showFallback(String(err));
      return;
    }

    renderer.setPixelRatio(currentDpr);
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // 4. Camera Setup
    const cameraFov = isPortrait ? 58 : 50;
    const camera = new THREE.PerspectiveCamera(
      cameraFov,
      initialWidth / Math.max(1, initialHeight),
      0.1,
      500,
    );
    const baseCamY = isPortrait ? 6.8 : cameraHeight;
    const baseCamZ = 16;
    const targetLookY = isPortrait ? 0.6 : 1.2;
    const targetLookZ = isPortrait ? -28 : -30;
    camera.position.set(0, baseCamY, baseCamZ);
    camera.lookAt(0, targetLookY, targetLookZ);

    // 5. Geometry & Shaders
    const gridRes = resolveParticleCount(particleCount, {
      isMobile: isMobileDevice,
      isLowEnd: isLowEndDevice,
      isPortrait,
    });
    const totalPoints = gridRes.cols * gridRes.rows;
    const pointsPositions = new Float32Array(totalPoints * 3);
    const pointsRandoms = new Float32Array(totalPoints * 2);

    const gridW = 220;
    const gridD = 160;
    let ptr3 = 0;
    let ptr2 = 0;
    for (let r = 0; r < gridRes.rows; r++) {
      const zNorm = r / Math.max(1, gridRes.rows - 1);
      const zPos = -gridD / 2 + zNorm * gridD;
      for (let c = 0; c < gridRes.cols; c++) {
        const xNorm = c / Math.max(1, gridRes.cols - 1);
        const xPos = -gridW / 2 + xNorm * gridW;

        pointsPositions[ptr3] = xPos;
        pointsPositions[ptr3 + 1] = 0;
        pointsPositions[ptr3 + 2] = zPos;
        ptr3 += 3;

        pointsRandoms[ptr2] = 0.6 + Math.random() * 0.8; // aRandom.x: size multiplier 0.6..1.4
        pointsRandoms[ptr2 + 1] = Math.random() * Math.PI * 2; // aRandom.y: phase offset
        ptr2 += 2;
      }
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(pointsPositions, 3),
    );
    pointsGeo.setAttribute(
      "aRandom",
      new THREE.BufferAttribute(pointsRandoms, 2),
    );

    const pointsUniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: waveAmplitude },
      uScale: { value: waveScale },
      uPixelRatio: { value: currentDpr },
      uParticleSize: { value: particleSize },
      uFocusDistance: { value: focusDistance },
      uBokehStrength: { value: bokehStrength },
      uColorNear: { value: new THREE.Color(colorNear) },
      uColorDeep: { value: new THREE.Color(colorDeep) },
      uColorFar: { value: new THREE.Color(colorFar) },
      uFogColor: { value: new THREE.Color(fogColor) },
    };

    const pointsMat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX_SHADER,
      fragmentShader: POINTS_FRAGMENT_SHADER,
      uniforms: pointsUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });

    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    pointsMesh.renderOrder = 1;
    scene.add(pointsMesh);

    // Water Body Mesh
    const waterGeo = new THREE.PlaneGeometry(220, 160, 110, 80);
    waterGeo.rotateX(-Math.PI / 2);

    const waterUniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: waveAmplitude },
      uScale: { value: waveScale },
      uColorNear: { value: new THREE.Color(colorNear) },
      uColorDeep: { value: new THREE.Color(colorDeep) },
      uColorFar: { value: new THREE.Color(colorFar) },
      uFogColor: { value: new THREE.Color(fogColor) },
    };

    const waterMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      uniforms: waterUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.renderOrder = 0;
    scene.add(waterMesh);

    // 6. Optional Bloom Pass
    let composer: EffectComposer | null = null;
    if (bloomStrength > 0) {
      try {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(
            Math.floor(initialWidth / 2),
            Math.floor(initialHeight / 2),
          ),
          bloomStrength,
          0.4,
          0.85,
        );
        composer.addPass(bloomPass);
      } catch (e) {
        console.warn(
          "[ParticleOcean] Failed to initialize UnrealBloomPass, fallback to direct rendering:",
          e,
        );
        composer = null;
      }
    }

    // 7. Motion & Interaction State
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let motionReduced = prefersReducedMotion.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      motionReduced = e.matches;
      checkRunningState();
    };
    prefersReducedMotion.addEventListener("change", onMotionChange);

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseParallax || isCoarsePointer) return;
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      targetMouseX = mx * 2.2;
      targetMouseY = my * 0.9;
    };
    if (mouseParallax && !isCoarsePointer) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    // 8. Lifecycle & Resize Listeners
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let animId: number | null = null;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const resizeRenderer = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const portr = h > w;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        isMobileDevice ? 1.5 : 2,
        effectiveDprCap,
      );

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      pointsUniforms.uPixelRatio.value = dpr;

      camera.fov = portr ? 58 : 50;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();

      if (composer) {
        composer.setSize(w, h);
      }
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeRenderer, 150);
    };
    window.addEventListener("resize", debouncedResize);

    const resizeObserver = new ResizeObserver(() => {
      debouncedResize();
    });
    resizeObserver.observe(container);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      checkRunningState();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let intersectionObserver: IntersectionObserver | null = null;
    if (pauseOffscreen) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isIntersecting = entry.isIntersecting;
          }
          checkRunningState();
        },
        { threshold: 0 },
      );
      intersectionObserver.observe(container);
    }

    // 9. Single Draw Call Tick Loop (0 per-particle JS calculation)
    let isFirstFrame = true;
    const renderScene = () => {
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      if (isFirstFrame) {
        isFirstFrame = false;
        onReady?.();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const isStill =
        reduceMotion === "still" ||
        (reduceMotion === "auto" && motionReduced);
      const isSlow =
        reduceMotion === "slow" ||
        (reduceMotion === "auto" && motionReduced);

      const speedFactor = isStill ? 0 : isSlow ? 0.15 : 1.0;
      accumulatedTime += dt * waveSpeed * speedFactor;

      // Update uniforms only - zero per-frame JS loop over particles
      pointsUniforms.uTime.value = accumulatedTime;
      waterUniforms.uTime.value = accumulatedTime;

      // Subtle camera drift and lerped mouse parallax
      const driftX = Math.sin(accumulatedTime * 0.1) * 1.1;
      const driftY = Math.sin(accumulatedTime * 0.13) * 0.35;

      curMouseX += (targetMouseX - curMouseX) * 0.04;
      curMouseY += (targetMouseY - curMouseY) * 0.04;

      camera.position.x = driftX + curMouseX;
      camera.position.y = baseCamY + driftY + curMouseY;
      camera.lookAt(0, targetLookY, targetLookZ);

      renderScene();

      if (!isStill) {
        animId = requestAnimationFrame(tick);
      }
    };

    const checkRunningState = () => {
      const shouldRun =
        isVisible &&
        (!pauseOffscreen || isIntersecting);

      const isStill =
        reduceMotion === "still" ||
        (reduceMotion === "auto" && motionReduced);

      if (!shouldRun) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else if (isStill) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        renderScene();
      } else {
        if (animId === null) {
          lastTime = performance.now();
          animId = requestAnimationFrame(tick);
        }
      }
    };

    // Initial run
    checkRunningState();

    // 10. Strict 8-step Cleanup Contract
    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (resizeTimer) clearTimeout(resizeTimer);

      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      resizeObserver.disconnect();

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", debouncedResize);
      if (mouseParallax && !isCoarsePointer) {
        window.removeEventListener("mousemove", onMouseMove);
      }
      prefersReducedMotion.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);

      pointsGeo.dispose();
      waterGeo.dispose();
      pointsMat.dispose();
      waterMat.dispose();

      if (composer) {
        try {
          composer.dispose();
        } catch {}
      }

      renderer.dispose();
      renderer.forceContextLoss?.();
    };
  }, [
    particleCount,
    waveSpeed,
    waveAmplitude,
    waveScale,
    particleSize,
    bokehStrength,
    focusDistance,
    colorNear,
    colorDeep,
    colorFar,
    fogColor,
    bloomStrength,
    cameraHeight,
    mouseParallax,
    pauseOffscreen,
    dprCap,
    reduceMotion,
    onReady,
    onWebGLFail,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "particle-ocean-root",
        fixed ? "fixed inset-0 -z-[1]" : "absolute inset-0",
        "pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      <div
        ref={fallbackRef}
        className="particle-ocean-fallback"
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} />
      <div className="particle-ocean-glow" />
    </div>
  );
}

export const ParticleOcean = ParticleOceanWebGL;
export default ParticleOceanWebGL;
