"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createBall,
  createLogoKicker,
  disposeObject3D,
} from "@/lib/three/createLogoKicker";

type Props = {
  onComplete: () => void;
  durationMs?: number;
};

export function KickerTransition({ onComplete, durationMs = 1600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100);
    camera.position.set(0, 0.15, 4.2);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x0693e3, 0.35);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const kicker = createLogoKicker();
    const figure = kicker.getObjectByName("figure") as THREE.Group;
    scene.add(kicker);

    const ball = createBall();
    scene.add(ball);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? 1920;
      const h = parent?.clientHeight ?? 1080;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let raf = 0;

    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const easeInCubic = (t: number) => t ** 3;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);

      // Wind-up 0–0.2, snap 0.2–0.4, follow-through 0.4–0.7, fade 0.7–1
      let rot = 0;
      if (t < 0.2) {
        rot = -0.9 * easeOutCubic(t / 0.2);
      } else if (t < 0.4) {
        const u = (t - 0.2) / 0.2;
        rot = -0.9 + 2.2 * easeInCubic(u);
      } else if (t < 0.7) {
        const u = (t - 0.4) / 0.3;
        rot = 1.3 - 0.35 * Math.sin(u * Math.PI) * (1 - u);
      } else {
        rot = 1.05;
      }
      figure.rotation.x = rot;

      // Ball flight after contact (~0.35)
      if (t < 0.35) {
        ball.position.set(0.05, -0.85 + Math.sin(rot) * 0.15, 0.45);
        ball.visible = true;
      } else {
        const u = (t - 0.35) / 0.65;
        ball.position.set(
          0.2 + u * 1.2,
          -0.4 + u * 1.8 - u * u * 1.2,
          0.5 + u * 3.5,
        );
        ball.scale.setScalar(1 + u * 4);
      }

      // Fade canvas opacity via CSS variable on parent
      canvas.style.opacity = t > 0.75 ? String(1 - (t - 0.75) / 0.25) : "1";

      renderer.render(scene, camera);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      disposeObject3D(kicker);
      disposeObject3D(ball);
      renderer.dispose();
    };
  }, [onComplete, durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
      aria-hidden
    />
  );
}
