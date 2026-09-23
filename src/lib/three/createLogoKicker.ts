import * as THREE from "three";

function mat(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.25,
    flatShading: true,
    ...opts,
  });
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  y: number,
  z = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(0, y, z);
  mesh.castShadow = false;
  return mesh;
}

/** Procedural TFC logo-style foosball figure (skull / banner / 2019 foot). */
export function createLogoKicker(): THREE.Group {
  const root = new THREE.Group();
  const body = mat(0xc8c8c8);
  const dark = mat(0x1a1a1a, { roughness: 0.55, metalness: 0.1 });
  const mid = mat(0x6e6e6e);

  // Pivot at rod height (y=0)
  const figure = new THREE.Group();
  figure.name = "figure";

  // Head / skull block
  const head = box(0.55, 0.42, 0.45, body, 0.72, 0);
  figure.add(head);

  // Brow
  figure.add(box(0.58, 0.08, 0.2, dark, 0.86, 0.18));

  // Eye sockets
  const eyeL = box(0.14, 0.12, 0.08, dark, 0.74, 0.22);
  eyeL.position.x = -0.12;
  const eyeR = box(0.14, 0.12, 0.08, dark, 0.74, 0.22);
  eyeR.position.x = 0.12;
  figure.add(eyeL, eyeR);

  // Grill / teeth ridges
  for (let i = 0; i < 5; i += 1) {
    const ridge = box(0.05, 0.16, 0.06, dark, 0.58, 0.22);
    ridge.position.x = -0.16 + i * 0.08;
    figure.add(ridge);
  }

  // Banner / torso plate
  const banner = box(0.95, 0.38, 0.28, mid, 0.22, 0.05);
  figure.add(banner);

  // Rod stubs through shoulders
  const rodMat = mat(0x333333, { metalness: 0.7, roughness: 0.3 });
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.35, 12),
    rodMat,
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.y = 0.28;
  figure.add(rod);

  // Neck
  figure.add(box(0.28, 0.18, 0.22, body, -0.05, 0));

  // Legs fused
  figure.add(box(0.36, 0.42, 0.28, body, -0.38, 0));

  // Foot with front face for "2019"
  const foot = box(0.42, 0.22, 0.5, body, -0.68, 0.05);
  figure.add(foot);

  // Canvas texture for FLORSTADT + 2019
  const bannerTex = makeTextTexture("FLORSTADT", 512, 128);
  const bannerLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.22),
    new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true }),
  );
  bannerLabel.position.set(0, 0.22, 0.2);
  figure.add(bannerLabel);

  const yearTex = makeTextTexture("2019", 256, 96);
  const yearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.12),
    new THREE.MeshBasicMaterial({ map: yearTex, transparent: true }),
  );
  yearLabel.position.set(0, -0.68, 0.31);
  figure.add(yearLabel);

  root.add(figure);
  return root;
}

export function createBall(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.35,
      metalness: 0.05,
    }),
  );
  mesh.position.set(0, -0.85, 0.45);
  return mesh;
}

function makeTextTexture(text: string, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.floor(h * 0.55)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      for (const m of materials) {
        if (m && "map" in m && m.map) m.map.dispose();
        m?.dispose();
      }
    }
  });
}
