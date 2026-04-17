import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { updateProceduralAnimation } from './vrmAnimation.js';

let scene, camera, renderer, clock, player;
let playerVrm;
let zombies = [];
let isGameOver = false;
const keys = {};

// 運動學參數
const playerVelocity = new THREE.Vector3();
const acceleration = 0.015;
const friction = 0.92;
const maxSpeed = 0.22;
let targetRotation = Math.PI;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 5, 45);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);
    clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    scene.add(new THREE.GridHelper(100, 40, 0x00ff00, 0x111111));

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // 1. 載入鯊魚人
    loader.load('./public/assets/SharkPerson.vrm', (gltf) => {
        playerVrm = gltf.userData.vrm;
        player = playerVrm.scene;
        scene.add(player);
        VRMUtils.rotateVRM0(playerVrm);
    }, undefined, (e) => {
        player = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshBasicMaterial({color: 0x00ffff}));
        scene.add(player);
    });

    // 2. 載入多個殭屍
    for (let i = 0; i < 10; i++) {
        loader.load('./public/assets/CoolAlien.vrm', (gltf) => {
            const vrm = gltf.userData.vrm;
            const z = vrm.scene;
            const dist = 15 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            z.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
            VRMUtils.rotateVRM0(vrm);
            
            z.userData = { 
                vx: (Math.random()-0.5)*0.1, 
                vz: (Math.random()-0.5)*0.1,
                vrm: vrm
            };

            scene.add(z);
            zombies.push(z);
            document.getElementById('z-count').innerText = zombies.length;
        });
    }

    // 控制邏輯
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    ['W', 'A', 'S', 'D'].forEach(key => {
        const btn = document.getElementById(`ctrl-${key}`);
        const code = `Key${key}`;
        
        // 手機觸控
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[code] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[code] = false; });

        // 電腦滑鼠切換
        btn.addEventListener('mousedown', (e) => { keys[code] = true; });
        btn.addEventListener('mouseup', (e) => { keys[code] = false; });
        btn.addEventListener('mouseleave', (e) => { keys[code] = false; }); // 避免滑鼠移開後按鍵卡住
    });
}

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (player) {
        // 1. 計算輸入方向
        const inputDir = new THREE.Vector3(0, 0, 0);
        if (keys['KeyW']) inputDir.z -= 1;
        if (keys['KeyS']) inputDir.z += 1;
        if (keys['KeyA']) inputDir.x -= 1;
        if (keys['KeyD']) inputDir.x += 1;

        if (inputDir.length() > 0) {
            inputDir.normalize();
            // 2. 應用加速度
            playerVelocity.addScaledVector(inputDir, acceleration);
            targetRotation = Math.atan2(inputDir.x, inputDir.z) + Math.PI;
        }

        // 3. 限制最大速度與應用摩擦力
        if (playerVelocity.length() > maxSpeed) {
            playerVelocity.setLength(maxSpeed);
        }
        playerVelocity.multiplyScalar(friction);

        // 4. 更新位置與旋轉
        player.position.add(playerVelocity);
        player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, 0.15);

        // 5. 更新動畫與物理
        const currentSpeed = playerVelocity.length();
        if (playerVrm) {
            updateProceduralAnimation(playerVrm, elapsedTime, currentSpeed, true);
            playerVrm.update(delta);
        }

        // 6. 攝像機跟隨 (拉近距離)
        camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y + 5, player.position.z + 8), 0.1);
        camera.lookAt(player.position);
    }

    zombies.forEach((z) => {
        z.position.x += z.userData.vx;
        z.position.z += z.userData.vz;
        if (Math.abs(z.position.x) > 40) z.userData.vx *= -1;
        if (Math.abs(z.position.z) > 40) z.userData.vz *= -1;

        const zDir = new THREE.Vector3(z.userData.vx, 0, z.userData.vz).normalize();
        const zTargetRotation = Math.atan2(zDir.x, zDir.z) + Math.PI;
        z.rotation.y = THREE.MathUtils.lerp(z.rotation.y, zTargetRotation, 0.05);

        if (z.userData.vrm) {
            const zSpeed = Math.sqrt(z.userData.vx**2 + z.userData.vz**2);
            updateProceduralAnimation(z.userData.vrm, elapsedTime, zSpeed, false);
            z.userData.vrm.update(delta);
        }

        if (player) {
            const dist = player.position.distanceTo(z.position);
            if (dist < 1.4) {
                isGameOver = true;
                document.getElementById('msg').style.display = 'flex';
            }
        }
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
