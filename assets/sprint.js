import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/lil-gui.module.min';
import { VRButton } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/webxr/VRButton.js';

function IVimageProcessing ( height, width, imageProcessingMaterial )
{
		this.height = height;
		this.width = width;
		
        //3 rtt setup
        this.scene = new THREE.Scene();
        this.orthoCamera = new THREE.OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1 );

        //4 create a target texture
        var options = {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type:THREE.FloatType
        };
        this.rtt = new THREE.WebGLRenderTarget( width, height, options);

        var geom = new THREE.BufferGeometry();
        geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([-1,-1,0, 1,-1,0, 1,1,0, -1,-1, 0, 1, 1, 0, -1,1,0 ]), 3 ) );
        this.scene.add( new THREE.Mesh( geom, imageProcessingMaterial ) );
}

function IVprocess ( imageProcessing, renderer )
{
	renderer.setRenderTarget( imageProcessing.rtt );
	renderer.render ( imageProcessing.scene, imageProcessing.orthoCamera ); 	
	renderer.setRenderTarget( null );
};

var camera, controls, scene, renderer, container;
var cameraGroup;

// VIDEO AND THE ASSOCIATED TEXTURE
var video,videoTexture;

var imageProcessing, imageProcessingMaterial, videoPanelMaterial;

// GUI
var gui;

var redMaterial = new THREE.LineBasicMaterial({
	color: 0xff0000
});
var greenMaterial = new THREE.LineBasicMaterial({
	color: 0x00ff00
});
var blueMaterial = new THREE.LineBasicMaterial({
	color: 0x0000ff
});

var curvedPanelMesh;
var elevationPanelMesh;
var pointsMesh;
var pointsShadowMesh;

var options = {
	curveTerm: 2.0,
	segments: 100,
	pixelSkip: 6.0,
	shadingSteps: 1.0,
	curvedPanel: true,
	elevationPanel: true,
	pointCloud: true,
	space: 'rgb'
}

init();
animate();

function init () {
    container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	scene = new THREE.Scene(); 

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.autoClear = false;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.shadowMap.enabled = false;

	container.appendChild( renderer.domElement );
	container.appendChild(VRButton.createButton(renderer));

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 10 );
	camera.position.z = 0.7;
	controls = new OrbitControls( camera, renderer.domElement );
	controls.minDistance = 0.005;
	controls.maxDistance = 1.0;
	controls.enableRotate = true;
	controls.addEventListener( 'change', render );
	controls.update();

	video = document.createElement('video');
	video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
	video.crossOrigin = "anonymous";
	video.load();
	video.muted = true;
	video.loop = true;

	cameraGroup = new THREE.Group();
	cameraGroup.position.set(0, -1.6, 0);

	//When user turn on the VR mode.
    renderer.xr.addEventListener('sessionstart', () => {
		scene.add(cameraGroup);
		cameraGroup.add(camera);
	});

	video.onloadeddata = function () 
	{ 
		// Video Player
		videoTexture = new THREE.VideoTexture( video );
		
		generatePanels();
		generatePoints();

		// Generate point cloud axes

		var cylinderGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.5);
		var floorMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x555555), side: THREE.DoubleSide });
		var cylinderRedMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000), side: THREE.DoubleSide });
		var cylinderGreenMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x00ff00), side: THREE.DoubleSide });
		var cylinderBlueMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0000ff), side: THREE.DoubleSide });

		var planeGeometry = new THREE.PlaneGeometry( 0.5, 0.5, 1, 1 );
		var mesh = new THREE.Mesh(planeGeometry, floorMaterial);
		mesh.position.set(.75, -0.25, 0);
		mesh.rotateX(Math.PI / 2);
		scene.add(mesh)

		var mesh = new THREE.Mesh(cylinderGeometry, cylinderRedMaterial);
		mesh.position.set(0.75, -0.25, -0.25);
		mesh.rotateZ(Math.PI / 2);
		scene.add(mesh);

		var mesh = new THREE.Mesh(cylinderGeometry, cylinderBlueMaterial);
		mesh.position.set(0.5, -0.25, 0);
		mesh.rotateX(Math.PI / 2);
		scene.add(mesh);

		var mesh = new THREE.Mesh(cylinderGeometry, cylinderGreenMaterial);
		mesh.position.set(0.5, 0, -0.25);
		scene.add(mesh);

		// Generate axes

		var redPoints = [];
		redPoints.push(new THREE.Vector3(0, 0, 0));
		redPoints.push(new THREE.Vector3(0.1, 0, 0));
		var geometry = new THREE.BufferGeometry().setFromPoints(redPoints);
		var line = new THREE.Line(geometry, redMaterial);
		scene.add(line);

		var bluePoints = [];
		bluePoints.push(new THREE.Vector3(0, 0, 0));
		bluePoints.push(new THREE.Vector3(0, 0.1, 0));
		geometry = new THREE.BufferGeometry().setFromPoints(bluePoints);
		line = new THREE.Line(geometry, greenMaterial);
		scene.add(line);

		var greenPoints = [];
		greenPoints.push(new THREE.Vector3(0, 0, 0));
		greenPoints.push(new THREE.Vector3(0, 0, 0.1));
		geometry = new THREE.BufferGeometry().setFromPoints(greenPoints);
		line = new THREE.Line(geometry, blueMaterial);
		scene.add(line);

		var pausePlayObj =
		{
			pausePlay: function () 
			{
				if (!video.paused)
				{
					console.log ( "pause" );
					video.pause();
				}
				else
				{
					console.log ( "play" );
					video.play();
				}
			},
			add10sec: function ()
			{
				video.currentTime = video.currentTime + 10;
				console.log ( video.currentTime  );
			}
		};
		
		gui = new GUI();
		gui.add(options, 'curveTerm', 0.2, 6.0).name('Curve Term').onChange(value => {
			curvedPanelMesh.material.uniforms.curveTerm.value = value;
		})
		gui.add(options, 'segments', 50, 1000).name('Segments').onChange(value => {
			generatePanels();
		});
		gui.add(options, 'pixelSkip', 1, 10).name('Pixel Skip').onChange(value => {
			generatePoints();
		});
		gui.add(options, 'shadingSteps', 1, 10, 1).name('Shading Steps').onChange(value => {
			generatePanels();
		});
		gui.add(options, 'curvedPanel').name('Display curved panel').onChange(value => {
			if (value) {
				scene.add(curvedPanelMesh);
			} else {
				scene.remove(curvedPanelMesh);
			}
		});
		gui.add(options, 'elevationPanel').name('Display elevation panel').onChange(value => {
			if (value) {
				scene.add(elevationPanelMesh);
			} else {
				scene.remove(elevationPanelMesh);
			}
		});
		gui.add(options, 'pointCloud').name('Display point cloud').onChange(value => {
			if (value) {
				scene.add(pointsMesh);
				scene.add(pointsShadowMesh);
			} else {
				scene.remove(pointsMesh);
				scene.remove(pointsShadowMesh);
			}
		});
		gui.add(options, 'space', ['rgb', 'hsv', 'hsl', 'ycbcr', 'xyz', 'lab', 'srgb']).name('Color space').onChange(value => {
			['rgb', 'hsv', 'hsl', 'ycbcr', 'xyz', 'lab', 'srgb'].forEach(space => {
				if (space == 'rgb') {
					return;
				}
				
				if (value == space) {
					pointsMesh.material.uniforms[space].value = true;
					pointsShadowMesh.material.uniforms[space].value = true;
				} else {
					pointsMesh.material.uniforms[space].value = false;
					pointsShadowMesh.material.uniforms[space].value = false;
				}
			})
		});
		// hsl: { type: 'b', value: false },
		// 	ycbcr: { type: 'b', value: false },
		// 	xyz: { type: 'b', value: false },
		// 	lab: { type: 'b', value: false },
		// 	srgb: { type: 'b', value: false }
		gui.add(pausePlayObj,'pausePlay').name ('Pause/play video');
		gui.add(pausePlayObj,'add10sec').name ('Add 10 seconds');

		video.play();

	};
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function generatePoints() {
	destroyMesh(pointsShadowMesh);
	destroyMesh(pointsMesh);

	// Point cloud

	var colorSpaceMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('RGBVertexShader').textContent,
		fragmentShader: document.getElementById('RGBFragmentShader').textContent,
		uniforms: {
			tex: { value: videoTexture },
			hsv: { type: 'b', value: false },
			hsl: { type: 'b', value: false },
			ycbcr: { type: 'b', value: false },
			xyz: { type: 'b', value: false },
			lab: { type: 'b', value: false },
			srgb: { type: 'b', value: false }
		}
	});

	var geometry = new THREE.BufferGeometry();
	const positions = [];
	var pixelSkip = options.pixelSkip;

	for (let i = 0; i < video.videoWidth; i += pixelSkip)
		for (let j = 0; j < video.videoHeight; j += pixelSkip) {
			const x = i / video.videoWidth;
			const y = j / video.videoHeight;
			const z = 0;

			positions.push(x, y, z);
		}

	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();

	pointsMesh = new THREE.Points(geometry, colorSpaceMaterial);
	pointsMesh.position.set(0.75, 0, 0)
	pointsMesh.scale.set(0.5, 0.5, 0.5)

	var shadowColorSpaceMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('PointShadowVertexShader').textContent,
		fragmentShader: document.getElementById('PointShadowFragmentShader').textContent,
		uniforms: {
			tex: { value: videoTexture },
			hsv: { type: 'b', value: false },
			hsl: { type: 'b', value: false },
			ycbcr: { type: 'b', value: false },
			xyz: { type: 'b', value: false },
			lab: { type: 'b', value: false },
			srgb: { type: 'b', value: false }
		}
	});

	pointsShadowMesh = new THREE.Points(geometry, shadowColorSpaceMaterial);
	pointsShadowMesh.position.set(0.75, 0, 0)
	pointsShadowMesh.scale.set(0.5, 0.5, 0.5)

	if (options.pointCloud) {
		scene.add(pointsShadowMesh);
		scene.add(pointsMesh);
	}
}

function generatePanels() {
	destroyMesh(elevationPanelMesh);
	destroyMesh(curvedPanelMesh);

	var segments = options.segments;

	var factor = video.videoHeight/video.videoWidth;

	imageProcessingMaterial = new THREE.ShaderMaterial({
		uniforms: {
			image: {type: 't', value: videoTexture}
		},
		vertexShader: document.
					getElementById('vertShader').text,
		fragmentShader: document.
					getElementById('fragShader').text
	});

	imageProcessing = new IVimageProcessing ( video.videoHeight, video.videoWidth, imageProcessingMaterial );

	videoPanelMaterial = new THREE.ShaderMaterial({
		uniforms: {
			image: {type: 't', value: imageProcessing.rtt.texture},
			curveTerm: {type: 'f', value: options.curveTerm },
			segments: {type: 'f', value: segments}
		},
		vertexShader: document.getElementById('panelVertShader').text,
		fragmentShader: document.getElementById('panelFragShader').text,
		side : THREE.DoubleSide
	});

	var geometry = new THREE.PlaneGeometry( 1, factor, segments, segments );
	curvedPanelMesh = new THREE.Mesh( geometry, videoPanelMaterial );
	curvedPanelMesh.scale.set(1, -1, 1)
	curvedPanelMesh.receiveShadow = false;
	curvedPanelMesh.castShadow = false;
	curvedPanelMesh.position.z = -0.5

	if (options.curvedPanel) {
		scene.add( curvedPanelMesh );
	}

	// Elevation panel

	var scaleElevation = 0.25;

	var lightDir = new THREE.Vector3 (-.5,-.5,.9);
	lightDir.normalize();
	var lightIntensity = 1.25;

	var lightElevationMaterial = new THREE.ShaderMaterial( {
		vertexShader: document.querySelector( '#lightvertexshader' ).textContent.trim(),
		fragmentShader: document.querySelector( '#lightfragmentshader' ).textContent.trim(),
		uniforms: {
			lightDir: { type: '3f', value: lightDir },
			lightIntensity: { value: lightIntensity },
			segments: { value: segments },
			factor: { value: factor },
			scaleElevation: { value: scaleElevation },
			tex: { value: videoTexture },
			shadingSteps: {type: 'f', value: options.shadingSteps}
		}
	} );

	var planeGeometry = new THREE.PlaneGeometry( 1, factor, segments, segments );  
	elevationPanelMesh = new THREE.Mesh( planeGeometry, lightElevationMaterial);
	elevationPanelMesh.material.side = THREE.DoubleSide;
	elevationPanelMesh.position.x = -0.5;
	elevationPanelMesh.rotateY(Math.PI / 2.0);

	if (options.elevationPanel) {
		scene.add(elevationPanelMesh);
	}
}

function render () {
	renderer.clear();
	
	if (typeof imageProcessing !== 'undefined') 
		IVprocess ( imageProcessing, renderer );
	renderer.render( scene, camera );
}

function animate() {	
	renderer.setAnimationLoop( function () {
		controls.update();
		render();
	} );
}

function onWindowResize () {
	camera.aspect = ( window.innerWidth / window.innerHeight);
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	render();
}

function destroyMesh(mesh) {
	if (mesh) {
		mesh.geometry.dispose();
		mesh.material.dispose();
		scene.remove(mesh);
	}
}