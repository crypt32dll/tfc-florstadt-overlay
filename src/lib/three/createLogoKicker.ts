import * as THREE from "three";

/** Greyscale plastic matching the TFC logo print. */
function mat(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.22,
    ...opts,
  });
}

function roundedRectShape(w: number, h: number, r: number) {
  const hw = w / 2;
  const hh = h / 2;
  const radius = Math.min(r, hw, hh);
  const s = new THREE.Shape();
  s.moveTo(-hw + radius, -hh);
  s.lineTo(hw - radius, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + radius);
  s.lineTo(hw, hh - radius);
  s.quadraticCurveTo(hw, hh, hw - radius, hh);
  s.lineTo(-hw + radius, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - radius);
  s.lineTo(-hw, -hh + radius);
  s.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
  return s;
}

function extrudeShape(
  shape: THREE.Shape,
  depth: number,
  material: THREE.Material,
  bevel = 0.02,
) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.center();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  return mesh;
}

function extrudeRounded(
  w: number,
  h: number,
  depth: number,
  radius: number,
  material: THREE.Material,
  bevel = 0.025,
) {
  return extrudeShape(roundedRectShape(w, h, radius), depth, material, bevel);
}

/** Logo eye: angular socket, wider on top, pointed bottom-inner. */
function logoEyeShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.09, 0.08);
  s.lineTo(0.09, 0.08);
  s.lineTo(0.1, 0.02);
  s.lineTo(0.035, -0.09);
  s.lineTo(-0.02, -0.1);
  s.lineTo(-0.1, 0.0);
  s.closePath();
  return s;
}

/**
 * Procedural foosball figure matching the TFC Florstadt logo:
 * flat-top skull block, angular eyes, triangle nose, vertical grill,
 * wide FLORSTADT banner, ridged shaft, 2019 foot.
 */
export function createLogoKicker(): THREE.Group {
  const root = new THREE.Group();

  const silver = mat(0xc8c8c8);
  const mid = mat(0x8a8a8a);
  const dark = mat(0x2a2a2a, { roughness: 0.55, metalness: 0.08 });
  const ink = mat(0x0b0b0b, { roughness: 0.7, metalness: 0.02 });
  const steel = mat(0x3f3f3f, { metalness: 0.8, roughness: 0.25 });
  const highlight = mat(0xe8e8e8, { roughness: 0.3 });

  const figure = new THREE.Group();
  figure.name = "figure";

  // ——— Head / skull block (logo silhouette, not anatomical) ———
  const head = extrudeRounded(0.58, 0.48, 0.34, 0.08, silver, 0.035);
  head.position.set(0, 0.78, 0);
  figure.add(head);

  // Soft crown highlight (logo top bevel)
  const crown = extrudeRounded(0.5, 0.06, 0.08, 0.025, highlight, 0.012);
  crown.position.set(0, 0.98, 0.16);
  figure.add(crown);

  // Brow shelf above eyes
  const brow = extrudeRounded(0.5, 0.06, 0.1, 0.02, mid, 0.012);
  brow.position.set(0, 0.9, 0.18);
  figure.add(brow);

  // Angular eye sockets + slit pupils (logo)
  for (const side of [-1, 1] as const) {
    const socket = extrudeShape(logoEyeShape(), 0.07, ink, 0.008);
    socket.position.set(side * 0.13, 0.78, 0.18);
    socket.scale.x = side; // mirror left eye
    figure.add(socket);

    const slit = extrudeRounded(0.07, 0.022, 0.02, 0.006, mid, 0.004);
    slit.position.set(side * 0.13, 0.79, 0.22);
    figure.add(slit);
  }

  // Triangle nose cavity
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0.045);
  noseShape.lineTo(0.04, -0.04);
  noseShape.lineTo(-0.04, -0.04);
  noseShape.closePath();
  const nose = extrudeShape(noseShape, 0.05, ink, 0.006);
  nose.position.set(0, 0.66, 0.19);
  figure.add(nose);

  // Vertical grill / jaw bars (logo teeth)
  for (let i = 0; i < 6; i += 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.16, 0.04),
      dark,
    );
    bar.position.set(-0.125 + i * 0.05, 0.52, 0.18);
    // Slight taper toward bottom via scale
    bar.scale.set(1, 1 - i * 0.01, 1);
    figure.add(bar);
  }

  // ——— Banner (wider than head, logo chest plate) ———
  const bannerOuter = extrudeRounded(1.02, 0.4, 0.26, 0.09, mid, 0.03);
  bannerOuter.position.set(0, 0.16, 0);
  figure.add(bannerOuter);

  const bannerInner = extrudeRounded(0.94, 0.32, 0.04, 0.07, ink, 0.01);
  bannerInner.position.set(0, 0.16, 0.15);
  figure.add(bannerInner);

  // Rod through shoulders
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 1.4, 24),
    steel,
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 0.24, -0.05);
  figure.add(rod);
  for (const x of [-0.65, 0.65]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), steel);
    cap.position.set(x, 0.24, -0.05);
    figure.add(cap);
  }

  // ——— Shaft + rings (between banner and foot) ———
  const shaft = extrudeRounded(0.32, 0.22, 0.26, 0.06, silver, 0.025);
  shaft.position.set(0, -0.18, 0);
  figure.add(shaft);

  for (let i = 0; i < 2; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.02, 8, 24),
      dark,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -0.08 - i * 0.07, 0.02);
    figure.add(ring);
  }

  // Small grid detail above year (logo)
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const cell = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.04, 0.02),
        dark,
      );
      cell.position.set(-0.06 + col * 0.06, -0.42 - row * 0.05, 0.16);
      figure.add(cell);
    }
  }

  // ——— Foot with 2019 ———
  const foot = extrudeRounded(0.4, 0.34, 0.34, 0.07, silver, 0.03);
  foot.position.set(0, -0.68, 0.02);
  figure.add(foot);

  const yearPlate = extrudeRounded(0.28, 0.14, 0.03, 0.03, ink, 0.008);
  yearPlate.position.set(0, -0.74, 0.21);
  figure.add(yearPlate);

  // ——— Labels ———
  const clubTex = makeTextTexture("TISCHFUSSBALL CLUB", 640, 80, 0.48);
  const clubLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.08),
    new THREE.MeshBasicMaterial({ map: clubTex, transparent: true }),
  );
  clubLabel.position.set(0, 0.24, 0.19);
  figure.add(clubLabel);

  const cityTex = makeTextTexture("FLORSTADT", 640, 140, 0.7);
  const cityLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.16),
    new THREE.MeshBasicMaterial({ map: cityTex, transparent: true }),
  );
  cityLabel.position.set(0, 0.1, 0.19);
  figure.add(cityLabel);

  const yearTex = makeTextTexture("2019", 256, 120, 0.72);
  const yearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.11),
    new THREE.MeshBasicMaterial({ map: yearTex, transparent: true }),
  );
  yearLabel.position.set(0, -0.74, 0.24);
  figure.add(yearLabel);

  root.add(figure);
  return root;
}

export function createBall(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xf2f2f2,
      roughness: 0.3,
      metalness: 0.05,
    }),
  );
  mesh.position.set(0, -0.85, 0.48);
  return mesh;
}

function makeTextTexture(
  text: string,
  w: number,
  h: number,
  sizeFactor = 0.55,
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.floor(h * sizeFactor)}px "Teko", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
