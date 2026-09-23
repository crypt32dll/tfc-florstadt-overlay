"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clientLog } from "@/lib/logger.client";
import {
  createLogoPlate,
  disposeObject3D,
  loadKickerTexture,
} from "@/lib/three/createLogoKicker";

const log = clientLog("kicker");

type Props = {
  onComplete: () => void;
  durationMs?: number;
};

/**
 * Broadcast logo sting — CL-style impact.
 * Motion tokens (ui-ux-pro-max): ease-out entry, back.out settle,
 * ease-in exit faster than enter, prefers-reduced-motion fade.
 */
export function KickerTransition({ onComplete, durationMs = 2000 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let cancelled = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let logo: THREE.Group | undefined;
    let disposables: THREE.Object3D[] = [];
    let removeResize: (() => void) | undefined;

    // Easing (GSAP-equivalent curves)
    const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
    const easeInExpo = (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10));
    const easeOutBack = (t: number, s = 1.55) => {
      const c1 = s;
      const c3 = c1 + 1;
      return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
    };
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    void (async () => {
      let texture: THREE.Texture;
      try {
        texture = await loadKickerTexture();
      } catch (e) {
        log.error("texture load failed", e);
        if (!cancelled && !doneRef.current) {
          doneRef.current = true;
          void onCompleteRef.current();
        }
        return;
      }
      if (cancelled) {
        texture.dispose();
        return;
      }

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 100);
      camera.position.set(0, 0, 5);

      // Impact flash (wide soft disc)
      const flash = new THREE.Mesh(
        new THREE.CircleGeometry(10, 64),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      flash.position.z = -1.5;
      scene.add(flash);
      disposables.push(flash);

      // Large brand glow behind everything
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(4.8, 64),
        new THREE.MeshBasicMaterial({
          color: 0x0693e3,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      glow.position.z = -0.35;
      scene.add(glow);
      disposables.push(glow);

      // Expanding rings on impact — scaled for big disc
      const rings: THREE.Mesh[] = [];
      for (let i = 0; i < 2; i += 1) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.4, 1.55, 64),
          new THREE.MeshBasicMaterial({
            color: 0x0693e3,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        ring.position.z = -0.08 - i * 0.03;
        scene.add(ring);
        rings.push(ring);
        disposables.push(ring);
      }

      logo = createLogoPlate(texture);
      scene.add(logo);

      const resize = () => {
        if (!renderer) return;
        const parent = canvas.parentElement;
        const w = parent?.clientWidth ?? 1920;
        const h = parent?.clientHeight ?? 1080;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);
      removeResize = () => window.removeEventListener("resize", resize);

      // Reduced motion: short centered fade
      const effectiveDuration = reduceMotion ? Math.min(durationMs, 700) : durationMs;
      const start = performance.now();

      const setLogoOpacity = (opacity: number) => {
        logo?.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.material) {
            const m = obj.material as THREE.MeshBasicMaterial;
            if ("opacity" in m) m.opacity = opacity;
          }
        });
      };

      const tick = (now: number) => {
        if (cancelled || !renderer || !logo) return;
        const t = clamp01((now - start) / effectiveDuration);

        if (reduceMotion) {
          const fadeIn = clamp01(t / 0.35);
          const fadeOut = t > 0.65 ? clamp01((t - 0.65) / 0.35) : 0;
          const opacity = fadeIn * (1 - fadeOut);
          logo.position.set(0, 0, 0);
          logo.scale.setScalar(0.95 + fadeIn * 0.1);
          logo.rotation.set(0, 0, 0);
          setLogoOpacity(opacity);
          (glow.material as THREE.MeshBasicMaterial).opacity = opacity * 0.2;
          canvas.style.opacity = "1";
          renderer.render(scene, camera);
        } else {
          // Timeline: enter 0–0.38 · impact/hold 0.38–0.58 · exit 0.58–1 (exit faster)
          let x = 0;
          let y = 0;
          let z = 0;
          let scale = 1;
          let rotZ = 0;
          let rotY = 0;
          let opacity = 1;
          let glowOp = 0;
          let flashOp = 0;
          let fov = 38;

          if (t < 0.38) {
            const u = easeOutExpo(t / 0.38);
            const overshoot = easeOutBack(u, 1.45);
            z = THREE.MathUtils.lerp(9.5, 0, u);
            scale = THREE.MathUtils.lerp(0.08, 1.08, overshoot);
            rotZ = (1 - u) * Math.PI * 1.6;
            rotY = (1 - u) * 0.55;
            x = Math.sin((1 - u) * Math.PI) * 0.35;
            opacity = clamp01(u * 1.5);
            glowOp = u * 0.45;
            fov = THREE.MathUtils.lerp(48, 36, u);
          } else if (t < 0.58) {
            const u = (t - 0.38) / 0.2;
            // Impact punch then settle
            const punch = Math.sin(clamp01(u / 0.35) * Math.PI);
            z = 0;
            scale = 1.08 - 0.06 * punch + 0.02 * Math.sin(u * Math.PI * 2);
            rotZ = Math.sin(u * Math.PI * 2) * 0.03;
            rotY = 0;
            opacity = 1;
            glowOp = 0.55 + 0.12 * Math.sin(u * Math.PI);
            flashOp = u < 0.4 ? (1 - u / 0.4) * 0.55 : 0;
            fov = 36 + punch * 2.5;

            // Rings expand from impact
            rings.forEach((ring, i) => {
              const delay = i * 0.12;
              const ru = clamp01((u - delay) / (1 - delay));
              const mat = ring.material as THREE.MeshBasicMaterial;
              mat.opacity = (1 - ru) * 0.55;
              ring.scale.setScalar(1 + ru * (3.4 + i * 1.1));
              ring.rotation.z = ru * 0.4 * (i % 2 === 0 ? 1 : -1);
            });
          } else {
            const u = easeInExpo((t - 0.58) / 0.42);
            z = THREE.MathUtils.lerp(0, -11, u);
            scale = THREE.MathUtils.lerp(1.02, 2.4, u);
            rotZ = -u * 0.5;
            rotY = -u * 0.35;
            y = u * 0.25;
            opacity = 1 - u;
            glowOp = 0.5 * (1 - u);
            flashOp = 0;
            fov = THREE.MathUtils.lerp(36, 44, u);
            rings.forEach((ring) => {
              (ring.material as THREE.MeshBasicMaterial).opacity = 0;
            });
          }

          logo.position.set(x, y, z);
          logo.scale.setScalar(scale);
          logo.rotation.set(0, rotY, rotZ);
          setLogoOpacity(opacity);

          const glowMat = glow.material as THREE.MeshBasicMaterial;
          glowMat.opacity = glowOp;
          glow.scale.setScalar(scale * (1.05 + glowOp * 0.4));
          glow.position.copy(logo.position);
          glow.position.z -= 0.2;

          (flash.material as THREE.MeshBasicMaterial).opacity = flashOp;

          camera.fov = fov;
          camera.updateProjectionMatrix();

          // Deterministic impact punch (no random jitter)
          if (t >= 0.38 && t < 0.5) {
            const s = 1 - (t - 0.38) / 0.12;
            camera.position.x = Math.sin(t * 90) * 0.035 * s;
            camera.position.y = Math.cos(t * 70) * 0.025 * s;
          } else {
            camera.position.x = 0;
            camera.position.y = 0;
          }

          canvas.style.opacity = "1";
          renderer.render(scene, camera);
        }

        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else if (!doneRef.current) {
          doneRef.current = true;
          void onCompleteRef.current();
        }
      };

      raf = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      removeResize?.();
      if (logo) disposeObject3D(logo);
      for (const obj of disposables) disposeObject3D(obj);
      renderer?.dispose();
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
      aria-hidden
    />
  );
}
