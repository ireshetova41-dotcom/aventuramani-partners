import { useEffect, useRef } from "react";

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  alpha: number;
  type: number; // 0=triangle, 1=diamond, 2=hexagon
}

const GeoBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let shapes: Shape[] = [];
    const SHAPE_COUNT = 14;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };

    const init = () => {
      shapes = [];
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      for (let i = 0; i < SHAPE_COUNT; i++) {
        shapes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.003,
          size: Math.random() * 40 + 20,
          alpha: Math.random() * 0.06 + 0.03,
          type: Math.floor(Math.random() * 3),
        });
      }
    };

    const drawTriangle = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
      }
      ctx.closePath();
    };

    const drawDiamond = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size * 0.7, cy);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.7, cy);
      ctx.closePath();
    };

    const drawHexagon = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
      }
      ctx.closePath();
    };

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      const dpr = devicePixelRatio;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      time += 0.003;

      // Animated gradient
      const shift = Math.sin(time) * 0.5 + 0.5;
      const shift2 = Math.cos(time * 0.7) * 0.5 + 0.5;
      const grad = ctx.createLinearGradient(
        w * shift * 0.3, 0,
        w * (0.7 + shift2 * 0.3), h
      );
      // Dark navy base → deep indigo → dark with gold tint
      grad.addColorStop(0, "hsl(235, 33%, 12%)");
      grad.addColorStop(0.5, `hsl(${235 + shift * 10}, 28%, ${14 + shift2 * 4}%)`);
      grad.addColorStop(1, `hsl(${240 - shift2 * 15}, 25%, ${13 + shift * 3}%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle gold radial glow
      const glowX = w * (0.3 + Math.sin(time * 0.5) * 0.2);
      const glowY = h * (0.3 + Math.cos(time * 0.4) * 0.2);
      const radGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, w * 0.5);
      radGrad.addColorStop(0, "hsla(44, 78%, 72%, 0.04)");
      radGrad.addColorStop(1, "hsla(44, 78%, 72%, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);

      // Shapes
      for (const s of shapes) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;

        if (s.x < -s.size) s.x = w + s.size;
        if (s.x > w + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = h + s.size;
        if (s.y > h + s.size) s.y = -s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        if (s.type === 0) drawTriangle(0, 0, s.size);
        else if (s.type === 1) drawDiamond(0, 0, s.size);
        else drawHexagon(0, 0, s.size);

        ctx.strokeStyle = `hsla(44, 78%, 72%, ${s.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = `hsla(44, 78%, 72%, ${s.alpha * 0.3})`;
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    const onResize = () => { resize(); init(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

export default GeoBackground;
