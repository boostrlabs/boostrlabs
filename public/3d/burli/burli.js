import * as THREE from 'https://esm.sh/three@0.172.0';
import { OrbitControls } from 'https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js';

const root = document.getElementById('viewer');
const status = document.getElementById('status');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, root.clientWidth/root.clientHeight, .01, 100);
camera.position.set(7,5.2,10);

const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(root.clientWidth,root.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x191919,3.2));
const key=new THREE.DirectionalLight(0xffffff,5); key.position.set(6,9,8); key.castShadow=true; scene.add(key);
const rim=new THREE.PointLight(0xffd33d,18,18); rim.position.set(-4,1,-3); scene.add(rim);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.target.set(0,2.4,0); controls.minDistance=5; controls.maxDistance=18;

const G=new THREE.Group(); scene.add(G);
const M={
 white:new THREE.MeshStandardMaterial({color:0xf4f2ed,roughness:.38,metalness:.08}),
 black:new THREE.MeshStandardMaterial({color:0x111214,roughness:.32,metalness:.22}),
 dark:new THREE.MeshStandardMaterial({color:0x1b1c1f,roughness:.62}),
 glass:new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.08,transmission:.22,transparent:true,opacity:.42}),
 eye:new THREE.MeshStandardMaterial({color:0x171717,roughness:.2}),
 yellow:new THREE.MeshStandardMaterial({color:0xffcf2d,emissive:0xff9b00,emissiveIntensity:1.1}),
 orange:new THREE.MeshStandardMaterial({color:0xff7a18,emissive:0xff3b00,emissiveIntensity:.8}),
 paper:new THREE.MeshStandardMaterial({color:0xf1e7d5,roughness:.8}),
 graphite:new THREE.MeshStandardMaterial({color:0x303236,roughness:.65}),
 skin:new THREE.MeshStandardMaterial({color:0xf4f1ec,roughness:.5})
};
const mesh=(geo,mat,p=[0,0,0],r=[0,0,0],s=[1,1,1])=>{const o=new THREE.Mesh(geo,mat);o.position.set(...p);o.rotation.set(...r);o.scale.set(...s);o.castShadow=o.receiveShadow=true;G.add(o);return o};
const sphere=(p,s,mat=M.white)=>mesh(new THREE.SphereGeometry(1,40,28),mat,p,[0,0,0],s);
const cyl=(p,rad,depth,mat=M.white,r=[0,0,0])=>mesh(new THREE.CylinderGeometry(rad,rad,depth,40),mat,p,r);
const box=(p,s,mat=M.dark,r=[0,0,0])=>mesh(new THREE.BoxGeometry(...s),mat,p,r);

sphere([0,3.3,0],[1.42,1.82,1.16]);
mesh(new THREE.ConeGeometry(1.15,1.65,48),M.black,[0,5.25,0]);
cyl([0,1.72,0],1.03,.6,M.black);
cyl([0,1.28,0],.82,.34,M.graphite);
cyl([0,.95,0],.62,.22,M.black);

const finGeo=new THREE.CapsuleGeometry(.34,1.2,8,20);
mesh(finGeo,M.black,[-1.35,2.0,-.05],[0,0,.38],[1,1.25,.45]);
mesh(finGeo,M.black,[1.35,2.0,-.05],[0,0,-.38],[1,1.25,.45]);

sphere([0,2.35,.02],[1.28,.88,1.1],M.dark);
cyl([0,2.82,.72],.72,.18,M.black,[Math.PI/2,0,0]);

for(const x of [-.48,.48]){
 sphere([x,3.62,1.03],[.42,.52,.18],M.white);
 sphere([x,3.61,1.19],[.20,.28,.10],M.eye);
 sphere([x-.07,3.76,1.29],[.055,.075,.025],M.white);
 mesh(new THREE.TorusGeometry(.55,.075,18,60),M.black,[x,3.63,1.27],[Math.PI/2,0,0]);
}
box([0,3.65,1.28],[.25,.07,.07],M.black);
box([-.98,3.64,1.14],[.45,.075,.075],M.black,[0,.25,0]);
box([.98,3.64,1.14],[.45,.075,.075],M.black,[0,-.25,0]);

mesh(new THREE.TorusGeometry(.28,.055,12,30,Math.PI),M.black,[-.48,4.2,1.08],[Math.PI/2,0,.1]);
mesh(new THREE.TorusGeometry(.28,.055,12,30,Math.PI),M.black,[.48,4.2,1.08],[Math.PI/2,0,-.1]);
mesh(new THREE.TorusGeometry(.28,.065,14,32,Math.PI),M.black,[0,3.05,1.13],[-Math.PI/2,0,0]);
sphere([0,2.96,1.18],[.13,.08,.04],new THREE.MeshStandardMaterial({color:0xf06a55}));

cyl([-1.23,2.35,.45],.22,1.05,M.dark,[0,0,-.85]);
cyl([1.18,2.62,.38],.22,1.18,M.dark,[0,0,.7]);
sphere([-1.58,1.95,.75],[.26,.26,.26],M.skin);
sphere([1.52,3.12,.75],[.26,.26,.26],M.skin);

box([-1.45,2.05,1.0],[.95,1.25,.13],M.black,[0,.1,-.08]);
for(let i=0;i<7;i++) cyl([-1.94,2.52-i*.16,1.02],.035,.16,M.graphite,[Math.PI/2,0,0]);
box([-1.43,2.05,1.08],[.5,.06,.02],M.yellow);
box([-1.43,1.9,1.08],[.28,.06,.02],M.white);

cyl([1.65,3.63,.76],.07,1.25,new THREE.MeshStandardMaterial({color:0xf4b52b}),[0,0,-.12]);
mesh(new THREE.ConeGeometry(.07,.22,16),M.paper,[1.58,4.26,.76],[0,0,-.12]);
mesh(new THREE.ConeGeometry(.028,.09,12),M.graphite,[1.57,4.38,.76],[0,0,-.12]);

for(const x of [-1.48,1.48]){cyl([x,3.5,0],.28,.18,M.graphite,[0,0,Math.PI/2]);cyl([x*1.06,3.5,0],.16,.22,M.black,[0,0,Math.PI/2]);}

mesh(new THREE.ConeGeometry(.42,1.2,32),M.orange,[0,.24,0],[Math.PI,0,0]);
mesh(new THREE.ConeGeometry(.24,.85,32),M.yellow,[0,.18,.02],[Math.PI,0,0]);

const ground=new THREE.Mesh(new THREE.CircleGeometry(4.5,64),new THREE.MeshStandardMaterial({color:0x0b0c0e,roughness:.9,transparent:true,opacity:.65}));
ground.rotation.x=-Math.PI/2; ground.position.y=-.45; ground.receiveShadow=true; scene.add(ground);

G.rotation.y=-.12;
status.textContent='BURLi listo · arrastra para rotar · pellizca o usa la rueda para acercar';

let t=0,frame;
function animate(){frame=requestAnimationFrame(animate);t+=.012;G.position.y=Math.sin(t)*.08;G.rotation.z=Math.sin(t*.7)*.015;controls.update();renderer.render(scene,camera)}
animate();

const resize=()=>{camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix();renderer.setSize(root.clientWidth,root.clientHeight)};
addEventListener('resize',resize);
document.getElementById('reset')?.addEventListener('click',()=>{camera.position.set(7,5.2,10);controls.target.set(0,2.4,0);controls.update()});
document.getElementById('fullscreen')?.addEventListener('click',async()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen());
