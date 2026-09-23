import * as THREE from "three";

/** High-res club mark for sting animation (~1k PNG, transparent). */
export const KICKER_LOGO_URL = "/brand/tfc-kicker-logo.png?v=2";

let cachedTexture: THREE.Texture | null = null;
let loadPromise: Promise<THREE.Texture> | null = null;

function configureTexture(tex: THREE.Texture, maxAnisotropy = 4) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
}

/** Flat logo plate for transition sting — light disc behind dark transparent PNG. */
export function createLogoPlate(texture: THREE.Texture): THREE.Group {
  const root = new THREE.Group();
  root.name = "figure";

  configureTexture(texture);

  // Source is ~1008×1024
  const h = 1.55;
  const w = h * (1008 / 1024);
  const discR = Math.max(w, h) * 0.72;
  // 32 segs is enough on stream; cheaper than 64
  const segs = 32;

  const backing = new THREE.Mesh(
    new THREE.CircleGeometry(discR, segs),
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

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(discR * 0.98, discR * 1.08, segs),
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

/** Collect MeshBasicMaterials under the plate for cheap per-frame opacity updates. */
export function collectOpacityMaterials(
  root: THREE.Object3D,
): THREE.MeshBasicMaterial[] {
  const mats: THREE.MeshBasicMaterial[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material) {
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of list) {
        if (m instanceof THREE.MeshBasicMaterial) mats.push(m);
      }
    }
  });
  return mats;
}

/** @deprecated use createLogoPlate */
export function createLogoKicker(texture: THREE.Texture): THREE.Group {
  return createLogoPlate(texture);
}

/** Warm the GPU texture cache (call from overlay mount). */
export function preloadKickerTexture(): Promise<THREE.Texture> {
  return loadKickerTexture();
}

export function loadKickerTexture(): Promise<THREE.Texture> {
  if (cachedTexture) return Promise.resolve(cachedTexture);
  if (loadPromise) return loadPromise;

  const loader = new THREE.TextureLoader();
  loadPromise = new Promise((resolve, reject) => {
    loader.load(
      KICKER_LOGO_URL,
      (tex) => {
        configureTexture(tex);
        cachedTexture = tex;
        resolve(tex);
      },
      undefined,
      (err) => {
        loadPromise = null;
        reject(err);
      },
    );
  });
  return loadPromise;
}

export function disposeObject3D(root: THREE.Object3D, disposeMaps = false) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      for (const m of materials) {
        // Keep shared cached logo map alive across stings
        if (
          disposeMaps &&
          m &&
          "map" in m &&
          m.map &&
          m.map !== cachedTexture
        ) {
          m.map.dispose();
        }
        m?.dispose();
      }
    }
  });
}
