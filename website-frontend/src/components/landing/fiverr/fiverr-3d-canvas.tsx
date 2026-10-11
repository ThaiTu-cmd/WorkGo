"use client";

import * as React from "react";

export default function Fiverr3dCanvas({ density = 300 }: { density?: number }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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

    const vsSource = `
      attribute vec3 aPosition;
      uniform mat4 uProjection;
      uniform mat4 uModelView;
      void main() {
        gl_Position = uProjection * uModelView * vec4(aPosition, 1.0);
        gl_PointSize = max(1.0, 4.0 * (1.0 / -gl_Position.z));
      }
    `;

    const fsSource = `
      precision mediump float;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) {
          discard;
        }
        gl_FragColor = vec4(0.608, 0.863, 1.0, 0.75);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
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
    const uProjection = gl.getUniformLocation(program, "uProjection");
    const uModelView = gl.getUniformLocation(program, "uModelView");

    // Generate random 3D points
    const pointCount = Math.min(Math.max(density, 100), 400);
    const positions = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 8; // Depth
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let px = 0;
    let py = 0;
    let rotY = 0;
    let rotX = 0;

    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5);
      py = ((e.clientY - r.top) / r.height - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 400;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(mount);

    // Perspective projection helper
    function getPerspectiveMatrix(fovRad: number, aspect: number, near: number, far: number) {
      const f = 1.0 / Math.tan(fovRad / 2);
      const rangeInv = 1.0 / (near - far);
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
      ];
    }

    const tick = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      rotY += 0.0009 + px * 0.002;
      rotX += (py * 0.25 - rotX) * 0.03;

      const w = canvas.width || 1;
      const h = canvas.height || 1;
      const aspect = w / h;
      const proj = getPerspectiveMatrix((55 * Math.PI) / 180, aspect, 0.1, 100);

      // Model view matrix with rotation around X and Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const modelView = [
        cosY, sinX * sinY, -cosX * sinY, 0,
        0, cosX, sinX, 0,
        sinY, -sinX * cosY, cosX * cosY, 0,
        0, 0, 0, 1,
      ];

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniformMatrix4fv(uProjection, false, proj);
      gl.uniformMatrix4fv(uModelView, false, modelView);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, pointCount);

      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, [density]);

  return <div ref={mountRef} className="h-full w-full pointer-events-none" />;
}
