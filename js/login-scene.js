import * as THREE from 'three';

const container = document.getElementById('canvas-container');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Cyberpunk Grid
const gridHelper = new THREE.GridHelper(50, 50, 0x00ffff, 0xff00ff);
scene.add(gridHelper);

// Floating Particles
const geometry = new THREE.BufferGeometry();
const particlesCount = 700;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}

geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const material = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
});
const particlesMesh = new THREE.Points(geometry, material);
scene.add(particlesMesh);

// Floating Shapes (Right Side - Neon Ring)
const torusGeometry = new THREE.TorusGeometry(3, 0.02, 16, 100);
const torusMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torus);

// Original Cyan Ring (Left Side)
const torus2Geometry = new THREE.TorusGeometry(2, 0.02, 16, 100);
const torus2Material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
const torus2 = new THREE.Mesh(torus2Geometry, torus2Material);
scene.add(torus2);

// --- NEW: Floating Magenta Coffee Beans ---
function createCoffeeBean(color, x, y, z, scale) {
    const beanGeometry = new THREE.SphereGeometry(1, 16, 16);
    // Scale it to look more like a bean (oval)
    beanGeometry.scale(0.6, 1, 0.8);

    // Wireframe for cyberpunk look
    const beanMaterial = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });

    const bean = new THREE.Mesh(beanGeometry, beanMaterial);
    bean.position.set(x, y, z);
    bean.scale.set(scale, scale, scale);

    // Add a crease (line) to make it look like a coffee bean
    const creaseGeometry = new THREE.BoxGeometry(0.1, 1.8, 1.8);
    const creaseMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black crease
    const crease = new THREE.Mesh(creaseGeometry, creaseMaterial);
    // We won't add the black crease in wireframe mode as it might look weird, 
    // but the oval shape + color should suggest 'organic/bean' in this abstract world.

    return bean;
}

const beans = [];
// Creating a few floating beans
// Magenta beans
for (let i = 0; i < 5; i++) {
    const bean = createCoffeeBean(0xff00ff, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0.3 + Math.random() * 0.2);
    bean.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02
    };
    scene.add(bean);
    beans.push(bean);
}

// Cyan cups (Cylinders) - Abstract representation
const cups = [];
const cupGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.8, 16); // Top larger than bottom
const cupMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.5 });
for (let i = 0; i < 3; i++) {
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    cup.scale.set(0.5, 0.5, 0.5);
    cup.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.01,
        rotSpeedY: (Math.random() - 0.5) * 0.01
    };
    scene.add(cup);
    cups.push(cup);
}

// Mouse interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    // Normalize mouse position
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = -mouseY * (0.1);
    particlesMesh.rotation.y += mouseX * (0.1);

    torus.rotation.x = elapsedTime * 0.2;
    torus.rotation.y = elapsedTime * 0.1;

    torus2.rotation.x = -elapsedTime * 0.2;
    torus2.rotation.z = elapsedTime * 0.1;

    // Animate Beans
    beans.forEach(bean => {
        bean.rotation.x += bean.userData.rotSpeedX;
        bean.rotation.y += bean.userData.rotSpeedY;
        // Gentle float
        bean.position.y += Math.sin(elapsedTime + bean.position.x) * 0.002;
    });

    // Animate Cups
    cups.forEach(cup => {
        cup.rotation.x += cup.userData.rotSpeedX;
        cup.rotation.y += cup.userData.rotSpeedY;
        cup.position.y += Math.cos(elapsedTime + cup.position.x) * 0.002;
    });

    // Gentle camera movement
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
