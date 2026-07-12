import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
import { Sky } from "three/examples/jsm/Addons.js";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
	sizes.width * sizes.pixelRatio,
	sizes.height * sizes.pixelRatio,
);

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);
	sizes.resolution.set(
		sizes.width * sizes.pixelRatio,
		sizes.height * sizes.pixelRatio,
	);

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	25,
	sizes.width / sizes.height,
	0.1,
	100,
);
camera.position.set(4, 0, 20);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Fireworks
 */
const textures = [
	textureLoader.load("./particles/1.png"),
	textureLoader.load("./particles/2.png"),
	textureLoader.load("./particles/3.png"),
	textureLoader.load("./particles/4.png"),
	textureLoader.load("./particles/5.png"),
	textureLoader.load("./particles/6.png"),
	textureLoader.load("./particles/7.png"),
	textureLoader.load("./particles/8.png"),
];

const createFirework = (
	count,
	position,
	size,
	texture,
	radius,
	color,
	duration,
) => {
	// Geometry
	const positionsArray = new Float32Array(count * 3);
	const sizesArray = new Float32Array(count);
	const timeMultipliersArray = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;

		// On créé un spherical pour positionner les particules dans une sphere
		// plutôt que dans un cube
		const spherical = new THREE.Spherical(
			radius * (0.8 + Math.random() * 0.2),
			Math.random() * Math.PI, // phi
			Math.random() * Math.PI * 2, // theta
		);

		// On créé un vec3 de positions pour la sphère, qu'on convertit depuis le spherical
		const position = new THREE.Vector3();
		position.setFromSpherical(spherical);

		positionsArray[i3 + 0] = position.x;
		positionsArray[i3 + 1] = position.y;
		positionsArray[i3 + 2] = position.z;

		sizesArray[i] = Math.random();

		timeMultipliersArray[i] = 1 + Math.random();
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(positionsArray, 3),
	);
	geometry.setAttribute(
		"aSize",
		new THREE.Float32BufferAttribute(sizesArray, 1),
	);
	geometry.setAttribute(
		"aTimeMultiplier",
		new THREE.Float32BufferAttribute(timeMultipliersArray, 1),
	);

	texture.flipY = false;
	// Material
	const material = new THREE.ShaderMaterial({
		vertexShader: fireworkVertexShader,
		fragmentShader: fireworkFragmentShader,
		uniforms: {
			uSize: new THREE.Uniform(size),
			uResolution: new THREE.Uniform(sizes.resolution),
			uTexture: new THREE.Uniform(texture),
			uColor: new THREE.Uniform(color),
			uProgress: new THREE.Uniform(0),
		},
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});

	// Points
	const firework = new THREE.Points(geometry, material);
	firework.position.copy(position);
	scene.add(firework);

	// Destroy
	const destroy = () => {
		scene.remove(firework);
		geometry.dispose();
		material.dispose();
	};

	// Animate
	gsap.to(material.uniforms.uProgress, {
		value: 1,
		duration: duration,
		ease: "linear",
		onComplete: destroy,
	});
};

const materialParameters = {};
materialParameters.size = 0.2;
materialParameters.particlesCountMultiplier = 1.2;
materialParameters.duration = 3;
materialParameters.sphereRadius = 0.5;

const fireworkFolder = gui.addFolder("Firework");
fireworkFolder
	.add(materialParameters, "size")
	.min(0.01)
	.max(2)
	.step(0.01)
	.name("particleSize");
fireworkFolder
	.add(materialParameters, "particlesCountMultiplier")
	.min(0.1)
	.max(20)
	.step(0.1);
fireworkFolder.add(materialParameters, "duration").min(1).max(10).step(0.1);
fireworkFolder
	.add(materialParameters, "sphereRadius")
	.min(0.2)
	.max(2.5)
	.step(0.1);

const createRandomFirework = (position = null) => {
	const count = Math.round(
		(400 + Math.random() * 1000) * materialParameters.particlesCountMultiplier,
	);
	const fireworkPosition =
		position ??
		new THREE.Vector3(
			(Math.random() - 0.5) * 10,
			(Math.random() - 0.5) * 5,
			(Math.random() - 0.5) * 10,
		);
	const size = 0.1 + Math.random() * materialParameters.size;
	const texture = textures[Math.floor(Math.random() * textures.length)];
	const radius = materialParameters.sphereRadius + Math.random();
	const color = new THREE.Color();
	color.setHSL(Math.random(), 1, 0.7);
	const duration = materialParameters.duration;

	createFirework(
		count,
		fireworkPosition,
		size,
		texture,
		radius,
		color,
		duration,
	);
};
createRandomFirework();

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();
const clickPlane = new THREE.Plane(); // Plan utilisé pour projeter un point à une certaine profondeur
const clickPoint = new THREE.Vector3(); // Position du clic
const cameraDirection = new THREE.Vector3(); // Utilisé pour construire le plan

const cursor = new THREE.Vector2();

window.addEventListener("click", (event) => {
	// Convertir la position de la souris en des coordonnées normalisées
	const rect = canvas.getBoundingClientRect();
	cursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	cursor.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

	// Envoyer un rayon de la camera vers la souris
	raycaster.setFromCamera(cursor, camera);
	// Obtenir l'orientation de la camera
	camera.getWorldDirection(cameraDirection);
	// Construire un plan perpendiculaire à la direction de la caméra et passant par controls.target
	clickPlane.setFromNormalAndCoplanarPoint(cameraDirection, controls.target);

	// Invoque un firework à l'intersection entre le plan et le rayon
	if (raycaster.ray.intersectPlane(clickPlane, clickPoint)) {
		createRandomFirework(clickPoint.clone());
	} else {
		// Fallback au cas où le point ne touche pas le plan
		createRandomFirework();
	}
});

/**
 * Sky
 */
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

/// GUI

const skyParameters = {
	turbidity: 10, // Opacité de la brume de l'atmosphère
	rayleigh: 3.2, // Intensité de la diffusion de Rayleigh (couleur du ciel)
	mieCoefficient: 0.086, // Diffusion dans l'atmosphère (diffusoin de Mie)
	mieDirectionalG: 0.95, // Anisotropie de la diffusion du soleil (concentration de la lumière du soleil)
	elevation: -2, // Angle du soleil par rapport à l'horizon
	azimuth: 180, // Rotation G/D du soleil
	exposure: renderer.toneMappingExposure, // Exposition du renderer
	// cloudCoverage: 0.4,
	// cloudDensity: 0.4,
	// cloudElevation: 0.5,
	// showSunDisc: true,
};

const updateSky = () => {
	const uniforms = sky.material.uniforms;
	uniforms["turbidity"].value = skyParameters.turbidity;
	uniforms["rayleigh"].value = skyParameters.rayleigh;
	uniforms["mieCoefficient"].value = skyParameters.mieCoefficient;
	uniforms["mieDirectionalG"].value = skyParameters.mieDirectionalG;
	// uniforms["cloudCoverage"].value = skyParameters.cloudCoverage;
	// uniforms["cloudDensity"].value = skyParameters.cloudDensity;
	// uniforms["cloudElevation"].value = skyParameters.cloudElevation;
	// uniforms["showSunDisc"].value = skyParameters.showSunDisc;

	const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
	const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);

	sun.setFromSphericalCoords(1, phi, theta);

	uniforms["sunPosition"].value.copy(sun);

	renderer.toneMappingExposure = skyParameters.exposure;
};

const skyFolder = gui.addFolder("Sky");
skyFolder.add(skyParameters, "turbidity", 0.0, 20.0, 0.1).onChange(updateSky);
skyFolder.add(skyParameters, "rayleigh", 0.0, 4, 0.001).onChange(updateSky);
skyFolder
	.add(skyParameters, "mieCoefficient", 0.0, 0.1, 0.001)
	.onChange(updateSky);
skyFolder
	.add(skyParameters, "mieDirectionalG", 0.7, 0.999, 0.0001)
	.onChange(updateSky);
skyFolder.add(skyParameters, "elevation", -3, 90, 0.01).onChange(updateSky);
skyFolder.add(skyParameters, "azimuth", -180, 180, 0.1).onChange(updateSky);
skyFolder.add(skyParameters, "exposure", 0, 1, 0.0001).onChange(updateSky);
// gui.add(skyParameters, "showSunDisc").onChange(updateSky);

// const folderClouds = gui.addFolder("Clouds");
// folderClouds
// 	.add(skyParameters, "cloudCoverage", 0, 1, 0.01)
// 	.name("coverage")
// 	.onChange(updateSky);
// folderClouds
// 	.add(skyParameters, "cloudDensity", 0, 1, 0.01)
// 	.name("density")
// 	.onChange(updateSky);
// folderClouds
// 	.add(skyParameters, "cloudElevation", 0, 1, 0.01)
// 	.name("elevation")
// 	.onChange(updateSky);

updateSky();

/**
 * Animate
 */
const tick = () => {
	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
