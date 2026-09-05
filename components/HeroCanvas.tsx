"use client";

/* The hero gradient. Raw WebGL, no library - runtime dependencies stay at 3.
 *
 * WHAT THIS COMPONENT IS ALLOWED TO BE: decoration that can fail. The headline,
 * the standfirst and both CTAs are server-rendered above it and never wait on
 * it, and the band underneath carries a static CSS gradient in the same palette
 * that is in the first response. F1 cost us the whole site once by putting
 * content behind something only JavaScript could resolve; a canvas is a much
 * better candidate for that mistake than a splash screen was, so the canvas
 * element is not rendered at all until we have decided it should be.
 *
 * WHEN WE DECIDE NOT TO DRAW - in every case the static gradient stays and
 * nothing else happens:
 *   prefers-reduced-motion   §11.5. A permanently moving background is not the
 *                            one orchestrated motion this product allows.
 *   no WebGL                 old or locked-down browsers, and headless renders.
 *   webglcontextlost         the GPU took the context back.
 *
 * There is no save-data or effectiveType gate any more. Those existed only to
 * stop a megabyte of video downloading on 2G. This ships no bytes over the
 * wire - the cost is GPU time, which the reduced-motion and IntersectionObserver
 * checks already govern.
 */

import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/* Domain-warped value-noise fbm.
 *
 * The warp is the whole trick: fbm sampled at coordinates that are themselves
 * displaced by another fbm reads as liquid, where the same noise sampled
 * straight reads as drifting stripes.
 *
 * NO VISIBLE LOOP: each octave advances on its own factor - 0.031, 0.047,
 * 0.019, 0.011 - which share no common multiple worth waiting for, so the
 * combined field never returns to a previous state. */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uCssW;   // canvas width in CSS px, so the ramp can key off the text column

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, float t) {
  float v = 0.0;
  vec2 q = p;
  v += 0.5000 * vnoise(q + vec2( t * 0.031, -t * 0.019));  q *= 2.03;
  v += 0.2500 * vnoise(q + vec2(-t * 0.047,  t * 0.011));  q *= 2.01;
  v += 0.1250 * vnoise(q + vec2( t * 0.019,  t * 0.047));  q *= 2.07;
  v += 0.0625 * vnoise(q + vec2(-t * 0.011, -t * 0.031));
  return v / 0.9375;
}

vec2 warp(vec2 p, float t) {
  float a = fbm(p, t);
  float b = fbm(p + vec2(5.2, 1.3), t);
  return p + 1.7 * vec2(a, b);
}

void main() {
  vec2 uvn = gl_FragCoord.xy / uRes;      // 0..1, y = 0 at the BOTTOM in GL
  vec2 uv = uvn;
  uv.x *= uRes.x / uRes.y;

  /* SPEED. The per-octave factors below are ratios, not a rate: on their own
     they moved the field so little that 80 seconds apart measured 2.5/255 mean
     difference, which is the grain alone - the colour masses were effectively
     frozen. Scaling time preserves every ratio, so the no-repeat property is
     untouched, and gives drift you can actually see. */
  float T = uTime * 2.6;

  vec2 w = warp(uv * 1.45, T);

  // Three fields at different scales, so the colour masses drift apart from
  // one another instead of moving as one sheet.
  float m1 = fbm(w * 1.05, T);
  float m2 = fbm(w * 2.20 + 3.7, T * 0.83);
  float m3 = fbm(w * 0.65 - 2.1, T * 1.21);

  /* fbm of value noise piles up around 0.5 - the raw swing here is about
     +/-0.135, which is why a -0.18 baseline offset clamped the whole text side
     to a constant. Expanding the middle of the distribution to the full range
     first means the baseline can be set without flattening the variation. */
  float n1 = smoothstep(0.34, 0.66, m1);
  float n2 = smoothstep(0.34, 0.66, m2);
  float n3 = smoothstep(0.34, 0.66, m3);

  vec3 TEAL  = vec3(0.000, 0.475, 0.420);
  vec3 GREEN = vec3(0.298, 0.686, 0.314);
  vec3 SOFT  = vec3(0.647, 0.839, 0.655);
  vec3 PALE  = vec3(0.878, 0.969, 0.980);

  /* WHERE THE FIELD IS ALLOWED TO BE BRIGHT.
     Every piece of hero text sits in the upper left: the nav across the top,
     then the headline, standfirst and buttons down the left half. Composing the
     field so cyan-pale blooms bottom-right and teal holds the top-left is what
     lets the fade above stay light enough to see the gradient through - a flat
     bright field needed ~0.76 of overlay everywhere text sits, which hid the
     motion the canvas exists to show.

     This is composition, not a second scrim: it is the shader choosing where
     its light colours live, and it is what makes "light and bright in the lower
     and right portions" true rather than aspirational. */
  /* The ramp is in CSS PIXELS, not in fractions of the viewport. Keyed to a
     fraction, the bright zone started at the same PROPORTION of every width -
     so at 1024px it began at x=594 and sat directly under the standfirst,
     which measured 6.61:1 against a 7:1 bar. The text column is a fixed width
     (.shell caps at 1152 and prose-measure narrower still), so the zone that
     is safe to brighten begins at a fixed distance from the left. Below about
     1100px there is no such zone, the ramp contributes nothing, and the field
     stays teal the whole way across - which is correct, because at those
     widths the text does span the whole width. */
  float xpx = uvn.x * uCssW;
  float openness = clamp(smoothstep(1040.0, 1520.0, xpx) * 0.95 + (1.0 - uvn.y) * 0.20, 0.0, 1.0);

  /* The noise breaks the ramp up so it reads as drifting masses rather than a
     linear corner-to-corner gradient. The -0.18 offset lowers the BASELINE on
     the text side without damping the noise: the masses still swing their full
     range there, they just swing between teal and green instead of climbing
     into green-soft. Damping the amplitude instead would have bought the same
     contrast and killed the motion, which is the thing the canvas is for. */
  float drive = clamp(openness * 1.15 + n1 * 0.34 + n2 * 0.16 - 0.04, 0.0, 1.4);

  vec3 col = TEAL;
  col = mix(col, GREEN, smoothstep(0.10, 0.52, drive));
  col = mix(col, SOFT,  smoothstep(0.42, 0.88, drive));
  col = mix(col, PALE,  smoothstep(0.74, 1.16, drive));
  // A little teal pulled back through the light end, so the bright side still
  // has depth instead of flattening into a pale wash.
  col = mix(col, TEAL,  smoothstep(0.55, 0.95, n3) * 0.22);

  // Grain last, so it sits on the colour rather than being blurred by the mix.
  float g = hash(gl_FragCoord.xy + fract(uTime) * vec2(37.0, 17.0));
  col += (g - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [draw, setDraw] = useState(false);

  // Decide before mounting the canvas, so a browser that should not draw never
  // creates a context at all.
  useEffect(() => {
    const decide = () => {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    };
    setDraw(decide());
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setDraw(decide());
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!draw || !canvas) return;

    const gl = (canvas.getContext("webgl", { antialias: false, depth: false, alpha: false }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) { setDraw(false); return; }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !prog) { setDraw(false); return; }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setDraw(false); return; }
    gl.useProgram(prog);

    // One triangle that covers the clip volume - cheaper than two, and avoids
    // the seam a quad can show along its diagonal.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uCssW = gl.getUniformLocation(prog, "uCssW");
    const uTime = gl.getUniformLocation(prog, "uTime");

    // §11.9 is a performance budget as much as a byte budget. 1.5 is the point
    // where the grain still reads on a phone without quadrupling fill cost.
    const DPR_CAP = 1.5;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uCssW, canvas.clientWidth);
    };

    let raf = 0;
    let running = true;
    const start = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      resize();
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Stop drawing the moment the hero leaves the viewport - the gradient is
    // the top of a long page and is off screen for most of a visit.
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) { running = true; raf = requestAnimationFrame(frame); }
      else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
    }, { threshold: 0 });
    io.observe(canvas);

    const onLost = (e: Event) => { e.preventDefault(); running = false; cancelAnimationFrame(raf); setDraw(false); };
    canvas.addEventListener("webglcontextlost", onLost);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("resize", onResize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [draw]);

  if (!draw) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
