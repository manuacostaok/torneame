"use client";

import { useEffect, useRef } from "react";

const FRAME_A = ["0011100", "0111110", "1101011", "1111111", "0101010", "1000001"];
const FRAME_B = ["0011100", "0111110", "1101011", "1111111", "0100010", "0100010"];

// Paleta alineada a la marca (violeta primario, teal, ámbar de premios)
// en vez de los colores genéricos de arcade que tenía antes.
const ROW_COLORS = ["#7c5cfc", "#a597ff", "#00d9c0", "#ffb020"];
const PLAYER_COLOR = "#f5f6fa";
const PLAYER_BULLET_COLOR = "#ffb020";

const PLAYER_SPRITE = ["001100", "011110", "111111", "010010"];

interface Alien {
  row: number;
  col: number;
  diving: boolean;
  diveProgress: number;
  diveStartX: number;
  alive: boolean;
  respawnAt: number;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
  color: string;
  fromPlayer: boolean;
}

interface Explosion {
  x: number;
  y: number;
  age: number;
}

interface PlayerShip {
  baseX: number;
  phase: number;
  shootTimer: number;
}

export function GalaxianBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    function resize() {
      width = canvas!.width = canvas!.offsetWidth;
      height = canvas!.height = canvas!.offsetHeight;
      players[0].baseX = width * 0.35;
      players[1].baseX = width * 0.65;
    }

    const COLS = 8;
    const ROWS = 4;
    const CELL = 4;
    const SPACING_X = 34;
    const SPACING_Y = 30;
    const MARGIN_TOP = 24;

    const aliens: Alien[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        aliens.push({
          row: r,
          col: c,
          diving: false,
          diveProgress: 0,
          diveStartX: 0,
          alive: true,
          respawnAt: 0,
        });
      }
    }

    const players: PlayerShip[] = [
      { baseX: width * 0.35, phase: 0, shootTimer: 0 },
      { baseX: width * 0.65, phase: Math.PI, shootTimer: 600 },
    ];
    window.addEventListener("resize", resize);
    resize();

    let bullets: Bullet[] = [];
    let explosions: Explosion[] = [];
    let frameToggle = 0;
    let frameTimer = 0;
    let diveTimer = 0;
    let frameId: number;
    let lastTime = performance.now();

    function drawSprite(x: number, y: number, pattern: string[], color: string) {
      ctx!.fillStyle = color;
      for (let py = 0; py < pattern.length; py++) {
        for (let px = 0; px < pattern[py].length; px++) {
          if (pattern[py][px] === "1") {
            ctx!.fillRect(x + px * CELL, y + py * CELL, CELL, CELL);
          }
        }
      }
    }

    function formationX(col: number, sway: number) {
      const totalWidth = COLS * SPACING_X;
      const startX = (width - totalWidth) / 2;
      return startX + col * SPACING_X + sway;
    }

    function alienScreenPos(alien: Alien, sway: number) {
      if (!alien.diving) {
        return { x: formationX(alien.col, sway), y: MARGIN_TOP + alien.row * SPACING_Y };
      }
      const t = alien.diveProgress;
      return {
        x: alien.diveStartX + Math.sin(t * Math.PI * 2) * 40,
        y: MARGIN_TOP + alien.row * SPACING_Y + t * (height - MARGIN_TOP),
      };
    }

    function draw(time: number) {
      const dt = time - lastTime;
      lastTime = time;
      ctx!.clearRect(0, 0, width, height);

      const sway = prefersReducedMotion ? 0 : Math.sin(time / 900) * 14;
      const playerY = height - 30;

      if (!prefersReducedMotion) {
        frameTimer += dt;
        if (frameTimer > 450) {
          frameToggle = frameToggle === 0 ? 1 : 0;
          frameTimer = 0;
        }

        diveTimer += dt;
        if (diveTimer > 2200) {
          diveTimer = 0;
          const idle = aliens.filter((a) => a.alive && !a.diving);
          if (idle.length > 0) {
            const pick = idle[Math.floor(Math.random() * idle.length)];
            pick.diving = true;
            pick.diveProgress = 0;
            pick.diveStartX = formationX(pick.col, sway);
          }
        }

        if (Math.random() < 0.018) {
          const alive = aliens.filter((a) => a.alive);
          if (alive.length > 0) {
            const shooter = alive[Math.floor(Math.random() * alive.length)];
            const pos = alienScreenPos(shooter, sway);
            bullets.push({
              x: pos.x + (CELL * 7) / 2,
              y: pos.y + CELL * 6,
              vy: 0.09 * dt,
              color: ROW_COLORS[shooter.row % ROW_COLORS.length],
              fromPlayer: false,
            });
          }
        }

        // Revive aliens caídos después de un rato, para que el escuadrón
        // no se vaya vaciando en una sesión larga
        for (const a of aliens) {
          if (!a.alive && time > a.respawnAt) a.alive = true;
        }

        // Naves propias: se mueven en vaivén y disparan hacia arriba
        for (const p of players) {
          p.phase += dt / 1400;
          p.shootTimer += dt;
          if (p.shootTimer > 1900) {
            p.shootTimer = 0;
            const x = p.baseX + Math.sin(p.phase) * 50 + (CELL * 6) / 2;
            bullets.push({
              x,
              y: playerY,
              vy: -0.16 * dt,
              color: PLAYER_BULLET_COLOR,
              fromPlayer: true,
            });
          }
        }
      }

      const pattern = frameToggle === 0 ? FRAME_A : FRAME_B;

      // Aliens vivos
      for (const alien of aliens) {
        if (!alien.alive) continue;
        const pos = alienScreenPos(alien, sway);
        drawSprite(pos.x, pos.y, pattern, ROW_COLORS[alien.row % ROW_COLORS.length]);
      }

      // Balas + colisión bala-de-jugador contra alien
      bullets = bullets.filter((b) => b.y > -10 && b.y < height + 10);
      for (const b of bullets) {
        b.y += b.vy;
        ctx!.fillStyle = b.color;
        ctx!.fillRect(b.x, b.y, 2, 8);

        if (b.fromPlayer) {
          for (const alien of aliens) {
            if (!alien.alive) continue;
            const pos = alienScreenPos(alien, sway);
            if (
              b.x > pos.x - 4 &&
              b.x < pos.x + CELL * 7 + 4 &&
              b.y > pos.y - 4 &&
              b.y < pos.y + CELL * 6 + 4
            ) {
              alien.alive = false;
              alien.diving = false;
              alien.respawnAt = time + 3200 + Math.random() * 1800;
              explosions.push({ x: pos.x + (CELL * 7) / 2, y: pos.y + (CELL * 6) / 2, age: 0 });
              b.y = -1000; // saca la bala del loop de dibujo
              break;
            }
          }
        }
      }

      // Explosiones: rayos cortos que se expanden y se apagan
      explosions = explosions.filter((e) => e.age < 380);
      for (const e of explosions) {
        e.age += dt;
        const t = e.age / 380;
        const radius = 4 + t * 14;
        ctx!.strokeStyle = `rgba(255, 176, 32, ${1 - t})`;
        ctx!.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          ctx!.beginPath();
          ctx!.moveTo(e.x, e.y);
          ctx!.lineTo(e.x + Math.cos(angle) * radius, e.y + Math.sin(angle) * radius);
          ctx!.stroke();
        }
      }

      // Naves propias
      for (const p of players) {
        const x = p.baseX + (prefersReducedMotion ? 0 : Math.sin(p.phase) * 50);
        drawSprite(x, playerY, PLAYER_SPRITE, PLAYER_COLOR);
      }

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
