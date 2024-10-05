import { Text, View, TouchableOpacity, PanResponder, Dimensions, StyleSheet, GestureResponderEvent, Modal } from "react-native";
import React, { useRef, useState,useEffect } from "react";
import { Gyroscope } from 'expo-sensors';
import { Renderer,THREE } from 'expo-three';
import { loadTextureAsync } from 'expo-three';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import mydata from "./data";
import { ExoplanetSystem } from "./data";
import { ScrollView } from "react-native";

interface NASAExoplanetHWO {
  name: string;
  type: string;
  radius: number;
  mass: number;
  orbitalPeriod: number | null;
  effectiveTemp: number | null;
  equilibriumTemperature: number | null;
  insolationFlux: number | null;
  discoveryMethod: string;
  discoveryYear: number;
  lastUpdated: string;
  distanceFromEarth: number;
  composition: string;
  habitabilityScore?: number;
}


const mockExoplanets: NASAExoplanetHWO[] = [
  {
    "name": "Sun",
    "type": "Star",
    "radius": 109.2,
    "mass": 332946,
    "orbitalPeriod": null,
    "effectiveTemp": 5778,
    "equilibriumTemperature": null,
    "insolationFlux": null,
    "discoveryMethod": "Visual",
    "discoveryYear": -5000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 0.000015813,
    "composition": "Hydrogen and Helium"
  },
  {
    "name": "Mercury",
    "type": "Planet",
    "radius": 0.3829,
    "mass": 0.0553,
    "orbitalPeriod": 87.969,
    "effectiveTemp": null,
    "equilibriumTemperature": 440,
    "insolationFlux": 6.67,
    "discoveryMethod": "Visual",
    "discoveryYear": -2000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 0.61,
    "composition": "Rocky"
  },
  {
    "name": "Venus",
    "type": "Planet",
    "radius": 0.9499,
    "mass": 0.815,
    "orbitalPeriod": 224.701,
    "effectiveTemp": null,
    "equilibriumTemperature": 737,
    "insolationFlux": 1.91,
    "discoveryMethod": "Visual",
    "discoveryYear": -2000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 0.28,
    "composition": "Rocky"
  },
  {
    "name": "Earth",
    "type": "Planet",
    "radius": 1,
    "mass": 1,
    "orbitalPeriod": 365.256,
    "effectiveTemp": null,
    "equilibriumTemperature": 255,
    "insolationFlux": 1,
    "discoveryMethod": "Visual",
    "discoveryYear": -5000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 0,
    "composition": "Rocky",
    "habitabilityScore": 1
  },
  {
    "name": "Mars",
    "type": "Planet",
    "radius": 0.532,
    "mass": 0.107,
    "orbitalPeriod": 686.98,
    "effectiveTemp": null,
    "equilibriumTemperature": 210,
    "insolationFlux": 0.431,
    "discoveryMethod": "Visual",
    "discoveryYear": -5000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 0.52,
    "composition": "Rocky",
    "habitabilityScore": 0.4
  },
  {
    "name": "Jupiter",
    "type": "Planet",
    "radius": 11.209,
    "mass": 317.8,
    "orbitalPeriod": 4332.59,
    "effectiveTemp": null,
    "equilibriumTemperature": 110,
    "insolationFlux": 0.037,
    "discoveryMethod": "Visual",
    "discoveryYear": -2000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 4.2,
    "composition": "Gas Giant"
  },
  {
    "name": "Saturn",
    "type": "Planet",
    "radius": 9.449,
    "mass": 95.2,
    "orbitalPeriod": 10759.22,
    "effectiveTemp": null,
    "equilibriumTemperature": 81,
    "insolationFlux": 0.011,
    "discoveryMethod": "Visual",
    "discoveryYear": -2000,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 8.5,
    "composition": "Gas Giant"
  },
  {
    "name": "Uranus",
    "type": "Planet",
    "radius": 4.007,
    "mass": 14.5,
    "orbitalPeriod": 30688.5,
    "effectiveTemp": null,
    "equilibriumTemperature": 59,
    "insolationFlux": 0.0027,
    "discoveryMethod": "Telescope",
    "discoveryYear": 1781,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 18.2,
    "composition": "Ice Giant"
  },
  {
    "name": "Neptune",
    "type": "Planet",
    "radius": 3.883,
    "mass": 17.1,
    "orbitalPeriod": 60182,
    "effectiveTemp": null,
    "equilibriumTemperature": 47,
    "insolationFlux": 0.0011,
    "discoveryMethod": "Mathematical Prediction",
    "discoveryYear": 1846,
    "lastUpdated": "2024-09-17T00:00:00Z",
    "distanceFromEarth": 29.1,
    "composition": "Ice Giant"
  }
];


export default function Index() {

  const [selectedBody, setSelectedBody] = useState<ExoplanetSystem | null>(null);
  const [showAll, setShowAll] = useState(false);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(Date.now());
  const currentRotation = new THREE.Quaternion();

  const gyroRotationRate = new THREE.Vector3(); // To store angular velocity data
  const smoothedQuaternion = useRef(new THREE.Quaternion());
  const targetQuaternion = useRef(new THREE.Quaternion());

  const lastDistanceRef = useRef(0);
  const zoomSpeedRef = useRef(0.5); // Reduced from 0.1 to 0.01 for lower sensitivity
  const minZoom = 0; // Closest zoom level
  const maxZoom = 400; // Farthest zoom level
  const initialZoom = 5; // Initial camera position

  const moveSpeedRef = useRef(0.05);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  const { width, height } = Dimensions.get('window');

  
useEffect(() => {
  let gyroSubscription: { remove: () => void } | null = null;
  Gyroscope.setUpdateInterval(16); // 60fps

  const startGyroscope = async () => {
    try {
      const { status } = await Gyroscope.requestPermissionsAsync();
      if (status === 'granted') {
        gyroSubscription = Gyroscope.addListener((data) => {
          const { x, y, z } = data;
          // Store angular velocity in radians/second for each axis
          gyroRotationRate.set(x, y, z);
          //setdisplayGyroData({ x, y, z });
        });
      }
    } catch (error) {
      console.error("Failed to start gyroscope:", error);
    }
  };

  startGyroscope();

  return () => {
    gyroSubscription?.remove();
    if (requestAnimationFrameRef.current !== null) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
    }
  };
}, []);



useEffect(() => {
  if (cameraRef.current){
    smoothedQuaternion.current.copy(cameraRef.current.quaternion);
    cameraRef.current.position.set(0, 0, initialZoom);
  }
}, []);

const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        handleTouchPlanet(locationX, locationY);
        if (evt.nativeEvent.touches.length === 1) {
          lastTouchRef.current = { x: gestureState.x0, y: gestureState.y0 };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 1) {
          // Single touch - move camera
          const dx = gestureState.moveX - lastTouchRef.current.x;
          const dy = gestureState.moveY - lastTouchRef.current.y;

          if (cameraRef.current) {
            const camera = cameraRef.current;
            const distance = camera.position.length();
            const movementSpeed = moveSpeedRef.current * distance / 50;

            camera.translateOnAxis(new THREE.Vector3(-1, 0, 0), dx * movementSpeed);
            camera.translateOnAxis(new THREE.Vector3(0, 1, 0), dy * movementSpeed);
          }

          lastTouchRef.current = { x: gestureState.moveX, y: gestureState.moveY };
        } else
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch-to-zoom logic
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
        
          const distance = Math.sqrt(
            Math.pow(touch1.pageX - touch2.pageX, 2) +
            Math.pow(touch1.pageY - touch2.pageY, 2)
          );
        
          if (lastDistanceRef.current !== 0) {
            const distanceDelta = distance - lastDistanceRef.current;
            if (cameraRef.current) {
              const camera = cameraRef.current;
              
              // Get the camera's forward direction
              const direction = new THREE.Vector3();
              camera.getWorldDirection(direction);
              
              // Zoom factor
              const zoomFactor = 1 - distanceDelta * zoomSpeedRef.current;
              
              // Calculate new position by moving in the direction the camera is looking
              const newPosition = camera.position.clone().add(direction.multiplyScalar(distanceDelta * zoomSpeedRef.current));
              
              // Apply zoom limits
              const currentDistance = camera.position.length();
              const newDistance = newPosition.length();
              
              if (newDistance >= minZoom && newDistance <= maxZoom) {
                camera.position.copy(newPosition);
              } else {
                // If we're outside the limits, clamp the distance
                const clampedDistance = Math.max(minZoom, Math.min(maxZoom, newDistance));
                camera.position.copy(direction.multiplyScalar(clampedDistance));
              }
            }
          }
        
          lastDistanceRef.current = distance;
        }
        
      },
      onPanResponderRelease: () => {
        lastDistanceRef.current = 0;
        lastTouchRef.current = { x: 0, y: 0 };
      },
    })
  ).current;

 const handleTouchPlanet = (x: number, y: number) => {
  if (cameraRef.current && raycasterRef.current && sceneRef.current) {
    mouseRef.current.x = (x / width) * 2 - 1;
    mouseRef.current.y = -(y / height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const planet = intersects[0].object;
      console.log(planet.userData);
      const exoplanet = mydata.find(p => p.hostname === planet.userData.name);
      if (exoplanet) {
        setSelectedBody(exoplanet);

        // Get the planet's position in world coordinates
        const targetPosition = new THREE.Vector3();
        planet.getWorldPosition(targetPosition);

        // Set up the zooming distance to make the full planet visible
        const planetRadius = planet.geometry.boundingSphere.radius;
        const zoomDistance = planetRadius * 10; // Adjust factor to control how far you want the zoom

        // Calculate the new camera position along the line from the camera to the planet
        const direction = new THREE.Vector3().subVectors(targetPosition, cameraRef.current.position).normalize();
        const newCameraPosition = new THREE.Vector3().copy(targetPosition).sub(direction.multiplyScalar(zoomDistance));

        // Smoothly transition the camera position to the target position using lerp
        const smoothZoom = () => {
          cameraRef.current.position.lerp(newCameraPosition, 0.1); // Adjust the `0.1` for speed of zoom
          cameraRef.current.lookAt(targetPosition); // Always keep looking at the planet

          // Stop when the camera is close enough
          if (cameraRef.current.position.distanceTo(newCameraPosition) > 0.01) {
            requestAnimationFrame(smoothZoom);
          }
        };

        // Start the smooth zoom
        smoothZoom();
      }
    }
  }
};
  const createStarField = (scene: THREE.Scene) => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1 });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
  };

  const TEXTURE_MAPPING: { [key: string]: any } = {
    'Mercury': Asset.fromModule(require('../assets/images/mercury.jpg')),
    'Venus': Asset.fromModule(require('../assets/images/venus.jpg')),
    'Earth': Asset.fromModule(require('../assets/images/eath.png')),
    'Mars': Asset.fromModule(require('../assets/images/mars.jpg')),
    'Jupiter': Asset.fromModule(require('../assets/images/jupiter.jpg')),
    'Saturn': Asset.fromModule(require('../assets/images/saturn.jpg')),
    'Uranus': Asset.fromModule(require('../assets/images/uranus.jpg')),
    'Neptune': Asset.fromModule(require('../assets/images/neptune.jpg')),
    'default': Asset.fromModule(require('../assets/images/sun.jpg'))
  };

const createStars = (scene: THREE.Scene) => {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.5,
    sizeAttenuation: true
  });

  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
};

const createCelestialBodies = (scene: THREE.Scene, exoplanets: ExoplanetSystem[]) => {
  const galacticCenter = new THREE.Group();
  scene.add(galacticCenter);

  // Find the maximum distance to scale our visualization
  const maxDist = Math.max(...exoplanets.map(e => e.sy_dist));

  exoplanets.forEach((exoplanet: ExoplanetSystem, index: number) => {
    // Calculate size based on star radius or luminosity
    const size = exoplanet.st_rad ? exoplanet.st_rad * 0.5 : 
                 Math.pow(10, exoplanet.st_lum / 5) * 0.1;

    // Generate a color based on the effective temperature
    const temperature = exoplanet.st_teff || 5000; // Default to 5000K if not available
    const color = new THREE.Color(
      Math.min(1, temperature / 10000),
      Math.min(1, 7000 / temperature),
      Math.min(1, 5000 / temperature)
    );

    // Calculate position based on RA and Dec
    const phi = (exoplanet.ra * Math.PI) / 12; // Convert RA to radians
    const theta = ((90 - exoplanet.dec) * Math.PI) / 180; // Convert Dec to radians
    const distance = (exoplanet.sy_dist / maxDist) * 500; // Scale distance

    const x = distance * Math.sin(theta) * Math.cos(phi);
    const y = distance * Math.cos(theta);
    const z = distance * Math.sin(theta) * Math.sin(phi);

    // Star (same as before)
    const starGeometry = new THREE.SphereGeometry(Math.max(size, 0.5), 32, 32);
    const starMaterial = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 0.5,
      emissive: color,
      emissiveIntensity: 0.5
    });
    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    starMesh.position.set(x, y, z);

    starMesh.userData = {
      name: exoplanet.hostname,
      type: exoplanet.st_spectype,
      temperature: exoplanet.st_teff,
      radius: exoplanet.st_rad,
      mass: exoplanet.st_mass,
      luminosity: exoplanet.st_lum,
      distance: exoplanet.sy_dist,
      planets: exoplanet.sy_pnum
    };

    // Add the star to the galactic center
    galacticCenter.add(starMesh);

    // Add light source for each star
    const light = new THREE.PointLight(color, 0.5, distance * 2);
    light.position.set(x, y, z);
    galacticCenter.add(light);

    // If the star has planets, create star-like planets
    if (exoplanet.sy_pnum > 0) {
      const planetSize = size * 0.3; // Make planets smaller
      const planetGeometry = new THREE.SphereGeometry(Math.max(planetSize, 0.3), 16, 16);
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 0.3, // Lower shininess for planets
        emissive: color,
        emissiveIntensity: 0.3 // Less emissive than stars
      });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      
      // Set the position offset from the star
      planetMesh.position.set(x + planetSize * 2, y, z);

      // Add the planet to the galactic center
      galacticCenter.add(planetMesh);

      // Optional glow effect using a sprite for planets
      const glowTexture = new THREE.TextureLoader().load(Asset.fromModule(require('../assets/images/20559.jpg')));
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: color,
        transparent: true,
        opacity: 0.5,
      });
      const glowSprite = new THREE.Sprite(glowMaterial);
      glowSprite.scale.set(planetSize * 4, planetSize * 4, 1); // Scale glow
      glowSprite.position.set(x + planetSize * 2, y, z);
      galacticCenter.add(glowSprite);
    }
  });

  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  // Debug sphere to show the scale of the galactic center
  const debugSphereGeometry = new THREE.SphereGeometry(10, 32, 32);
  const debugSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const debugSphere = new THREE.Mesh(debugSphereGeometry, debugSphereMaterial);
  galacticCenter.add(debugSphere); // Attach to the galactic center for rotation visualization

  // Animation function
  const animate = () => {
    requestAnimationFrame(animate);
    galacticCenter.rotateY(0.0001); // Rotating the whole galactic center
  };

  // Start the animation
  animate();
};

  
  
  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;
    rendererRef.current =new Renderer({ gl });
    rendererRef.current.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);

    cameraRef.current.position.z = 5;

    //createStarField(sceneRef.current);
    createCelestialBodies(sceneRef.current, mydata);

    const smoothingFactor = 0.5; // Adjust this value to control the smoothing (0.1 to 0.2 is a good range)


    const render = () => {
      requestAnimationFrameRef.current = requestAnimationFrame(render);
    
      if (sceneRef.current && cameraRef.current) {
        // Time difference between frames
        const now = Date.now();
        const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Convert ms to seconds
        lastFrameTimeRef.current = now;
    
        // Apply axis remapping or flipping based on screen orientation
        const screenOrientation = window.screen.orientation?.type || "portrait-primary";
    
        let deltaAngle = new THREE.Vector3();
        
        if (screenOrientation.includes("portrait")) {
          // Portrait mode: map gyroscope data to camera rotation axes
          deltaAngle.set(
            gyroRotationRate.x * deltaTime,  // Not inverted
            gyroRotationRate.y * deltaTime,  // Not inverted
            -gyroRotationRate.z * deltaTime  // Inverted
          );
        } else if (screenOrientation.includes("landscape")) {
          // Landscape mode: swap axes
          deltaAngle.set(
            gyroRotationRate.y * deltaTime,  // Not inverted
            -gyroRotationRate.x * deltaTime, // Inverted
            -gyroRotationRate.z * deltaTime  // Inverted
          );
        }
    
        // Create a quaternion to represent the change in rotation
        const deltaQuaternion = new THREE.Quaternion();
        deltaQuaternion.setFromEuler(new THREE.Euler(deltaAngle.x, deltaAngle.y, deltaAngle.z, 'XYZ'));
    
        // Update the target quaternion
        targetQuaternion.current.copy(cameraRef.current.quaternion).multiply(deltaQuaternion);
    
        // Smoothly interpolate between the current smoothed quaternion and the target quaternion
        smoothedQuaternion.current.slerp(targetQuaternion.current, smoothingFactor);
    
        // Apply the smoothed rotation to the camera
        cameraRef.current.quaternion.copy(smoothedQuaternion.current);
    
        // Render the scene with the updated camera quaternion
        rendererRef.current?.render(sceneRef.current, cameraRef.current);
      }
    
      glRef.current?.endFrameEXP();
    };
    
    // Make sure to initialize smoothedQuaternion when setting up the camera
    // This should be done where you initialize your camera, for example:


    render();
  };

  return (
    <View style={styles.container} >
      
      <GLView style={styles.glView} onContextCreate={onContextCreate} {...panResponder.panHandlers} ></GLView>
      
      <Text style={styles.text}>
        Move your device to explore the 3D galaxy
      </Text>
      <Modal visible={!!selectedBody} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{selectedBody?.hostname}</Text>
      {/* System Identifiers */}
      
      <ScrollView style={{width:"100%"}}>
      <Text>Type: {selectedBody?.st_spectype}</Text>
            <Text>Temperature: {selectedBody?.st_teff} K</Text>
            <Text>Radius: {selectedBody?.st_rad} solar radii</Text>
            <Text>Mass: {selectedBody?.st_mass} solar masses</Text>
            <Text>Luminosity: {selectedBody?.st_lum}</Text>
            <Text>Distance: {selectedBody?.sy_dist} parsecs</Text>
            <Text>Number of Planets: {selectedBody?.sy_pnum}</Text>
      

      {showAll && (
              <>
               <Text>TIC ID: {selectedBody?.tic_id}</Text>
      <Text>HIP Name: {selectedBody?.hip_name || 'N/A'}</Text>
      <Text>HIP Companion Name: {selectedBody?.hip_compname}</Text>
      <Text>HD Name: {selectedBody?.hd_name}</Text>
      <Text>HR Name: {selectedBody?.hr_name}</Text>
      <Text>GJ Name: {selectedBody?.gj_name}</Text>
      <Text>Constellation: {selectedBody?.constellation}</Text>
      
      {/* Location and Distance */}
      <Text>Distance: {selectedBody?.sy_dist} parsecs</Text>
      <Text>RA: {selectedBody?.ra}</Text>
      <Text>Dec: {selectedBody?.dec}</Text>
      <Text>Parallax: {selectedBody?.sy_plx}</Text>
      <Text>Parallax Error: {selectedBody?.sy_plxerr}</Text>
      <Text>Parallax Ref Link: {selectedBody?.sy_plx_reflink}</Text>

      {/* Star Properties */}
      <Text>Visual Magnitude: {selectedBody?.sy_vmag}</Text>
      <Text>Visual Magnitude Error: {selectedBody?.sy_vmagerr}</Text>
      <Text>Visual Magnitude Ref Link: {selectedBody?.sy_vmag_reflink}</Text>
      <Text>B-V Magnitude: {selectedBody?.sy_bvmag}</Text>
      <Text>B-V Magnitude Error: {selectedBody?.sy_bvmagerr}</Text>
      <Text>B-V Magnitude Ref Link: {selectedBody?.sy_bvmag_reflink}</Text>
      <Text>R-C Magnitude: {selectedBody?.sy_rcmag}</Text>
      <Text>R-C Magnitude Ref Link: {selectedBody?.sy_rcmag_reflink}</Text>
      <Text>Spectral Type: {selectedBody?.st_spectype}</Text>
      <Text>Spectral Type Ref Link: {selectedBody?.st_spectype_reflink}</Text>
      <Text>Temperature: {selectedBody?.st_teff} K</Text>
      <Text>Temperature Error: {selectedBody?.st_tefferr}</Text>
      <Text>Temperature Ref Link: {selectedBody?.st_teff_reflink}</Text>
      <Text>Luminosity: {selectedBody?.st_lum}</Text>
      <Text>Luminosity Error: {selectedBody?.st_lumerr}</Text>
      <Text>Luminosity Ref Link: {selectedBody?.st_lum_reflink}</Text>
      <Text>Radius: {selectedBody?.st_rad} solar radii</Text>
      <Text>Diameter: {selectedBody?.st_diam}</Text>
      <Text>Mass: {selectedBody?.st_mass} solar masses</Text>
      <Text>Metallicity: {selectedBody?.st_met}</Text>
      <Text>Metallicity Error: {selectedBody?.st_meterr}</Text>
      <Text>Metallicity Ref Link: {selectedBody?.st_met_reflink}</Text>
      <Text>Surface Gravity: {selectedBody?.st_logg}</Text>
      <Text>Surface Gravity Error: {selectedBody?.st_loggerr}</Text>
      <Text>Surface Gravity Ref Link: {selectedBody?.st_logg_reflink}</Text>
      <Text>Log R'HK: {selectedBody?.st_log_rhk}</Text>
      <Text>Log R'HK Ref Link: {selectedBody?.st_log_rhk_reflink}</Text>

      {/* Exoplanet Suitability Indices */}
      <Text>Orbital Separation (EEI): {selectedBody?.st_eei_orbsep}</Text>
      <Text>Angular Separation (EEI): {selectedBody?.st_eei_angsep}</Text>
      <Text>Brightness Ratio (ETWIN): {selectedBody?.st_etwin_bratio}</Text>
      <Text>R-C Magnitude (ETWIN): {selectedBody?.st_etwin_rcmag}</Text>
      <Text>Orbital Period (EEI): {selectedBody?.st_eei_orbper}</Text>
      <Text>Radial Velocity Amplitude (ETWIN): {selectedBody?.st_etwin_rvamp}</Text>
      <Text>Astrometric Amplitude (ETWIN): {selectedBody?.st_etwin_astamp}</Text>

      {/* Binary System Properties */}
      <Text>WDS Designation: {selectedBody?.wds_designation}</Text>
      <Text>WDS Companion: {selectedBody?.wds_comp}</Text>
      <Text>WDS Separation: {selectedBody?.wds_sep || 'N/A'}</Text>
      <Text>WDS Delta Magnitude: {selectedBody?.wds_deltamag || 'N/A'}</Text>

      {/* System Flags */}
      <Text>Disks Flag: {selectedBody?.sy_disks_flag}</Text>
      <Text>Disks Flag Ref Link: {selectedBody?.sy_disks_flag_reflink}</Text>
      <Text>Planets Flag: {selectedBody?.sy_planets_flag}</Text>
      <Text>Number of Planets: {selectedBody?.sy_pnum}</Text>

      {/* Target Group */}
      <Text>Target Group: {selectedBody?.target_group}</Text>
              </>
            )}
      </ScrollView>

<View style={styles.buttons}>
<TouchableOpacity style={styles.toggleButton} onPress={() => setShowAll(!showAll)}>
            <Text style={styles.toggleButtonText}>{showAll ? 'Show Less' : 'Show More'}</Text>
          </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBody(null)}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
</View>
      
    </View>
  </View>
</Modal>

     
      {/* <Button 
        title="Reset Zoom" 
        onPress={() => {
          if (cameraRef.current) {
            cameraRef.current.position.z = initialZoom;
          }
        }} 
      /> */}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 0,
    margin: 0,
  },
  glView: {
    flex: 1,
  },
  content:{
    textAlign:'left'
  },
  text: {
    color: '#fff',
    fontSize: 18,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'flex-end', // Align content to the bottom
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%', // Limit height to 60% of the screen
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',   // Align buttons horizontally
    alignSelf:'stretch',
    justifyContent: 'space-between', // Spread buttons evenly
    alignItems:'stretch',
    alignContent:"space-between",
    marginTop: 20,          // Add some spacing above the buttons
  },

});

