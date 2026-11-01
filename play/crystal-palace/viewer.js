// Shared model viewer for the Crystal Palace catalog.
// Auto-orbits; drag, scroll or touch takes over; 25 s of idle hands it back.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const IDLE_S = 25, SPIN = 0.6;

export async function mountViewer(el, glbUrl) {
  const status = el.querySelector('.status');
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2823);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8372, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 6, 4); scene.add(sun);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true; controls.autoRotateSpeed = SPIN * 4;

  let handed = false, idleAt = 0;
  const take = () => { controls.autoRotate = false; handed = true; el.classList.add('manual'); };
  const touch = () => { idleAt = performance.now(); };
  controls.addEventListener('start', () => { take(); touch(); });
  controls.addEventListener('change', touch);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let gltf;
  try { gltf = await loader.loadAsync(glbUrl); }
  catch (err) { status.textContent = 'This model could not be loaded.'; console.error(err); return; }
  const model = gltf.scene; scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z) || 1;
  const grid = new THREE.GridHelper(Math.ceil(r * 3), 12, 0x5c584d, 0x3d3a33);
  grid.position.set(ctr.x, box.min.y, ctr.z); scene.add(grid);
  controls.target.copy(ctr);
  camera.position.set(ctr.x + r * 1.5, ctr.y + r * 0.7, ctr.z + r * 1.8);
  camera.near = r / 200; camera.far = r * 100; camera.updateProjectionMatrix();
  controls.minDistance = r * 0.3; controls.maxDistance = r * 8;

  let tris = 0;
  model.traverse(o => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
  status.textContent = `${Math.round(tris).toLocaleString()} triangles · ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} m · auto-orbit; drag or scroll to take over`;

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el); resize();

  renderer.setAnimationLoop(() => {
    if (handed && performance.now() - idleAt > IDLE_S * 1000) { handed = false; controls.autoRotate = true; el.classList.remove('manual'); }
    controls.update(); renderer.render(scene, camera);
  });
}
