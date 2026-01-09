import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const pointer = new THREE.Vector2();
let renderBlock;
const raycaster = new THREE.Raycaster();
const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.5 );
scene.add( ambientLight );

const pointLight = new THREE.PointLight( 0xffffff, 2.5, 0, 0 );
camera.add( pointLight );
scene.add( camera );


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
const cube = new THREE.InstancedMesh(geometry, material, 10);

const testpoint = new THREE.SphereGeometry(.1, 10, 10);
const sphere = new THREE.Mesh(testpoint, material);
scene.add(cube);
scene.add(sphere);

camera.position.z = 10;

function onPointerMove( event ) {
    // Calculate pointer position in normalized device coordinates (-1 to +1)
    
    // If the canvas covers the whole window
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1; // Y axis is inverted in Three.js
  
}

let sphereposition = new THREE.Vector3();



let boxpositions = [];

for (let i = -1; i < 2; i++) {
  for (let j = -1; j < 2; j++) {
    boxpositions.push(new THREE.Matrix3(i,j,0));

  }
}

boxpositions.forEach((m, index) => {
  cube.setMatrixAt(index, m);

});

cube.computeBoundingBox();

function animate() {
  raycaster.setFromCamera( pointer, camera );
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  sphereposition = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(2));
  sphere.position.copy(sphereposition);
  cube.lookAt(sphereposition);
  
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

