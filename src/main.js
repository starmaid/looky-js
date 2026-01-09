import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const pointer = new THREE.Vector2();
let renderBlock;
const raycaster = new THREE.Raycaster();
const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.5 );
scene.add( ambientLight );

const pointLight = new THREE.PointLight( 0xffffff, 2.5, 0, 0 );
camera.add( pointLight );
scene.add( camera );


const loader = new GLTFLoader();
let model = null;
loader.load( 'models/tim1_3.glb', function ( gltf ) {

  model = gltf.scene;
  // Find the first mesh inside the glTF to use as the instanced source
  let sourceMesh = null;
  model.traverse( function ( object ) {
    if ( object.isMesh ) {
      if ( !sourceMesh ) sourceMesh = object;
      object.castShadow = true;
    }
  } );

  if ( sourceMesh ) {
    let srcGeometry = sourceMesh.geometry;
    let srcMaterial = sourceMesh.material;
    if ( Array.isArray(srcMaterial) ) srcMaterial = srcMaterial[0];

    // Create an InstancedMesh directly from the model mesh and use it for the grid
    const newInstanced = new THREE.InstancedMesh(srcGeometry, srcMaterial, INSTANCE_COUNT);
    newInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(newInstanced);
    cube = newInstanced;
  } else {
    // Fallback: if no single mesh found, add the group to the scene
    scene.add(model);
  }

}, undefined, function ( error ) {
  console.error( 'Error loading GLTF model:', error );
} );





const map = new THREE.TextureLoader().load( 'static/uv_grid_opengl.jpg' );
map.wrapS = map.wrapT = THREE.RepeatWrapping;
// Use renderer capability for anisotropy when available
map.anisotropy = renderer.capabilities && typeof renderer.capabilities.getMaxAnisotropy === 'function'
  ? renderer.capabilities.getMaxAnisotropy()
  : 0;
// Use the standard encoding property for broad Three.js compatibility
map.encoding = THREE.sRGBEncoding;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderBlock = renderer.domElement;
renderBlock.addEventListener( 'pointermove', onPointerMove );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );
// Grid instancing: 15 per row, 4 rows
const COLS = 15;
const ROWS = 4;
const INSTANCE_COUNT = COLS * ROWS;
let cube = null;

//const testpoint = new THREE.SphereGeometry(.1, 10, 10);
//const sphere = new THREE.Mesh(testpoint, material);
//scene.add(sphere);

camera.position.z = 5;


function onPointerMove( event ) {
    // Calculate pointer position in normalized device coordinates (-1 to +1)
    
    // If the canvas covers the whole window
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1; // Y axis is inverted in Three.js
  
}

let sphereposition = new THREE.Vector3();




// Prepare a reusable Object3D for setting per-instance transforms
const tempObj = new THREE.Object3D();

// spacing and offsets to center the grid
const spacingX = .85;
const spacingY = 1.1;
const offsetX = (COLS - 1) * spacingX * 0.5;
const offsetY = (ROWS - 1) * spacingY * 0.5;

// Store positions logically by index (row-major) via computed math in animate

function animate() {
  raycaster.setFromCamera( pointer, camera );
  requestAnimationFrame(animate);
  // Update sphere position in front of the ray
  sphereposition = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(2));
  //sphere.position.copy(sphereposition);

  // Update each instance so it faces the sphere position
  for (let i = 0; i < INSTANCE_COUNT; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * spacingX - offsetX;
    const y = offsetY - row * spacingY;
    tempObj.position.set(x, y, 0);
    tempObj.lookAt(sphereposition);
    tempObj.rotateX(Math.PI / 2); // Adjust orientation if needed
    tempObj.updateMatrix();
    tempObj.scale.set(2, 2, 2); // Uniform scale for all instances
    if (cube) cube.setMatrixAt(i, tempObj.matrix);
  }
  if (cube) cube.instanceMatrix.needsUpdate = true;
  
  renderer.render(scene, camera);











  
  let infoEl = document.getElementById('three-info');
  if (!infoEl) {
    infoEl = document.createElement('div');
    infoEl.id = 'three-info';
    Object.assign(infoEl.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      padding: '8px 10px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.3',
      zIndex: 9999,
      pointerEvents: 'none',
      borderRadius: '4px',
      whiteSpace: 'pre'
    });
    document.body.appendChild(infoEl);
  }
  const o = raycaster.ray.origin;
  const cp = camera.position;

  infoEl.textContent =
    `pointer: ${pointer.x.toFixed(3)}, ${pointer.y.toFixed(3)}\n` +
    `ray dir: ${raycaster.ray.direction.x.toFixed(3)}, ${raycaster.ray.direction.y.toFixed(3)}, ${raycaster.ray.direction.z.toFixed(3)}\n` +
    `camera: ${cp.x.toFixed(3)}, ${cp.y.toFixed(3)}, ${cp.z.toFixed(3)}`;

}



animate();

