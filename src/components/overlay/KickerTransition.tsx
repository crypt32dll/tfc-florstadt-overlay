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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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

      // Wind-up (foot back) → snap forward toward camera → spin under rod
      // +rot.x sends foot to -Z (away); -rot.x kicks toward camera (+Z)
      let rot = 0;
      if (t < 0.18) {
        rot = 0.9 * easeOutCubic(t / 0.18);
      } else if (t < 0.36) {
        const u = (t - 0.18) / 0.18;
        rot = 0.9 - 2.3 * easeInCubic(u);
      } else if (t < 0.55) {
        const u = (t - 0.36) / 0.19;
        rot = -1.4 - 0.12 * Math.sin(u * Math.PI);
      } else {
        const u = easeInCubic((t - 0.55) / 0.45);
        rot = -1.45 - u * (Math.PI * 1.1);
      }
      figure.rotation.x = rot;

      // Ball rides the foot, then flies toward camera after contact (~0.32)
      if (t < 0.32) {
        ball.position.set(
          0.05,
          -0.85 + Math.sin(-rot) * 0.12,
          0.45 + Math.sin(-rot) * 0.08,
        );
        ball.visible = true;
        ball.scale.setScalar(1);
      } else {
        const u = Math.min(1, (t - 0.32) / 0.55);
        ball.position.set(
          0.15 + u * 0.4,
          -0.35 + u * 1.6 - u * u * 1.1,
          0.55 + u * 4.5,
        );
        ball.scale.setScalar(1 + u * 5);
        ball.visible = u < 0.92;
      }

      // Figure fades as it spins away; canvas clears at the end
      if (t < 0.58) {
        figure.visible = true;
        canvas.style.opacity = "1";
      } else {
        const fade = 1 - (t - 0.58) / 0.42;
        figure.visible = fade > 0.05;
        canvas.style.opacity = String(Math.max(0, fade));
      }

      renderer.render(scene, camera);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        void onCompleteRef.current();
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
    // Run once per mount; onComplete is read via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
      aria-hidden
    />
  );
}
