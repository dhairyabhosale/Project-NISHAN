"use client";

import { useEffect, useRef } from "react";

export function HeaderDashedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const header = canvas?.closest("header");
    if (!header || !canvas) return;
    const headerElement = header;
    const canvasElement = canvas;

    const context = canvasElement.getContext("2d");
    if (!context) return;
    const canvasContext = context;

    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--focus-on-teal").trim();
    const background = rootStyles.getPropertyValue("--teal-deep").trim();
    const cell = 18;
    const dashMax = 11;
    const dashMin = 2;
    const radius = 110;
    const minFactor = 0.08;
    const ease = 0.16;
    const topFade = 90;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mask = document.createElement("canvas");
    const maskContext = mask.getContext("2d", { willReadFrequently: true });
    if (!maskContext) return;
    const maskCanvasContext = maskContext;

    let width = 0;
    let height = 0;
    let scale = 1;
    let frame = 0;
    let cells: { x: number; y: number; current: number; base: number; masked: boolean }[] = [];
    let pointer: { x: number; y: number } | null = null;

    function rebuild() {
      const bounds = headerElement.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      scale = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.ceil(width * scale);
      canvasElement.height = Math.ceil(height * scale);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;

      mask.width = Math.ceil(width);
      mask.height = Math.ceil(height);
      maskCanvasContext.clearRect(0, 0, width, height);
      maskCanvasContext.fillStyle = "#000";
      maskCanvasContext.fillRect(0, 0, width, height);
      maskCanvasContext.fillStyle = "#fff";
      maskCanvasContext.font = `700 ${Math.min(220, width * 0.25)}px ${rootStyles.fontFamily || "sans-serif"}`;
      maskCanvasContext.textAlign = "center";
      maskCanvasContext.textBaseline = "middle";
      maskCanvasContext.fillText("NISHAN", width / 2, height / 2);

      cells = [];
      for (let y = 0; y <= height; y += cell) {
        for (let x = 0; x <= width; x += cell) {
          const alpha = maskCanvasContext.getImageData(Math.min(x, width - 1), Math.min(y, height - 1), 1, 1).data[3];
          cells.push({ x, y, current: 0, base: dashMax, masked: alpha > 20 });
        }
      }
    }

    function smoothstep(value: number) {
      return value * value * (3 - 2 * value);
    }

    function render() {
      canvasContext.setTransform(scale, 0, 0, scale, 0, 0);
      canvasContext.fillStyle = background;
      canvasContext.fillRect(0, 0, width, height);
      canvasContext.strokeStyle = color;
      canvasContext.lineWidth = 2;
      canvasContext.lineCap = "butt";

      for (const point of cells) {
        const distance = pointer ? Math.hypot(point.x - pointer.x, point.y - pointer.y) : Infinity;
        const influence = distance < radius ? smoothstep(1 - distance / radius) : 0;
        const target = point.masked
          ? dashMin
          : dashMax - (dashMax - dashMax * minFactor) * influence;
        point.current += (target - point.current) * ease;
        const fade = Math.min(1, Math.max(0, point.y / topFade));
        const length = Math.max(dashMin, point.current * fade);
        canvasContext.beginPath();
        canvasContext.moveTo(point.x - length / 2, point.y);
        canvasContext.lineTo(point.x + length / 2, point.y);
        canvasContext.stroke();
      }

      if (!reducedMotion) frame = window.requestAnimationFrame(render);
    }

    function setPointer(event: MouseEvent | Touch) {
      const bounds = headerElement.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    function clearPointer() {
      pointer = null;
    }

    rebuild();
    frame = window.requestAnimationFrame(render);
    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(headerElement);
    headerElement.addEventListener("mousemove", setPointer);
    const touchMove = (event: TouchEvent) => setPointer(event.touches[0]);
    headerElement.addEventListener("touchmove", touchMove, { passive: true });
    headerElement.addEventListener("mouseleave", clearPointer);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      headerElement.removeEventListener("mousemove", setPointer);
      headerElement.removeEventListener("touchmove", touchMove);
      headerElement.removeEventListener("mouseleave", clearPointer);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
