import * as THREE from "three";

/** High-res club mark for sting animation (~1k PNG, transparent). */
export const KICKER_LOGO_URL = "/brand/tfc-kicker-logo.png?v=2";

/** Flat logo plate for transition sting — light disc behind dark transparent PNG. */
export function createLogoPlate(texture: THREE.Texture): THREE.Group {
  const root = new THREE.Group();
  root.name = "figure";

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  // Source is ~1008×1024
  const h = 1.55;
  const w = h * (1008 / 1024);
  const discR = Math.max(w, h) * 0.72;

  // Bright backing so black logo reads on stream
  const backing = new THREE.Mesh(
    new THREE.CircleGeometry(discR, 64),
    new THREE.MeshBasicMaterial({
      color: 0xf4f7fb,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  backing.name = "logo-backing";
  backing.position.z = -0.02;
  root.add(backing);

  // Soft white rim halo just outside the disc
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(discR * 0.98, discR * 1.08, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  halo.name = "logo-halo";
  halo.position.z = -0.025;
  root.add(halo);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const plate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plate.name = "logo-art";
  plate.position.z = 0.01;
  root.add(plate);
  return root;
}

/** @deprecated use createLogoPlate */
export function createLogoKicker(texture: THREE.Texture): THREE.Group {
  return createLogoPlate(texture);
}

export function loadKickerTexture(): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      KICKER_LOGO_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
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
