import { Text, View, TouchableOpacity, PanResponder, Dimensions, StyleSheet } from "react-native";
import React, { useRef, useState,useEffect } from "react";
import { Gyroscope } from 'expo-sensors';
import { Renderer,THREE } from 'expo-three';
import { loadTextureAsync } from 'expo-three';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Asset } from 'expo-asset';

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

  const [selectedBody, setSelectedBody] = useState<NASAExoplanetHWO | null>(null);

  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

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
  const zoomSpeedRef = useRef(0.01); // Reduced from 0.1 to 0.01 for lower sensitivity
  const minZoom = 2; // Closest zoom level
  const maxZoom = 100; // Farthest zoom level
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
        } else if (evt.nativeEvent.touches.length === 2) {
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
              const zoomFactor = 1 - distanceDelta * zoomSpeedRef.current;
              
              // Calculate new position
              const newPosition = camera.position.clone().multiplyScalar(zoomFactor);
              
              // Apply zoom limits
              const currentDistance = camera.position.length();
              const newDistance = newPosition.length();
              if (newDistance >= minZoom && newDistance <= maxZoom) {
                camera.position.copy(newPosition);
              } else {
                // If we're outside the limits, we'll zoom along the camera's direction
                const direction = camera.position.clone().normalize();
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

  const createCelestialBodies = (scene: THREE.Scene) => {
    const solarSystem = new THREE.Group();
    scene.add(solarSystem);
  
    mockExoplanets.forEach(async (exoplanet, index) => {
      // Calculate size based on planet radius (scaled for visibility)
      const size = exoplanet.radius * 0.1;
  
      // Generate a color based on the equilibrium temperature
      const temperature = exoplanet.equilibriumTemperature || 300;
      const color = new THREE.Color(
        Math.min(1, temperature / 500),
        Math.min(1, 300 / temperature),
        Math.min(1, 200 / temperature)
      );
  
      // Calculate distance (we'll use the index to spread them out)
      const distance = (index + 1) * 5;
  
      const textureAsset = TEXTURE_MAPPING[exoplanet.name] || TEXTURE_MAPPING['default'];
      const texture = await loadTextureAsync({
        asset: textureAsset
      });
  
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
      });
      const mesh = new THREE.Mesh(geometry, material);
  
      // Create a group to hold the planet and its axis
      const planetGroup = new THREE.Group();
  
      // Add the planet mesh to the group
      planetGroup.add(mesh);
  
      // Create and add the axis
      const axisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -size * 1.2, 0),
        new THREE.Vector3(0, size * 1.2, 0)
      ]);
      const axisMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF }); // Grey color
      const axisLine = new THREE.Line(axisGeometry, axisMaterial);
      //planetGroup.add(axisLine);
  
      // Create an orbit group for each planet
      const orbitGroup = new THREE.Group();
      orbitGroup.add(planetGroup);
  
      // Position the planet within its orbit group
      planetGroup.position.set(distance, 0, 0);
  
      // Add the orbit group to the solar system
      solarSystem.add(orbitGroup);
  
      // If it's the sun, add a light source
      if (exoplanet.name === "Sun") {
        const light = new THREE.PointLight(0xffffff, 1, 100);
        planetGroup.add(light);
      }
  
      // Create orbit line
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, distance, 0, Math.PI * 2, true).getPoints(64)
      );
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = Math.PI / 2; // Rotate to lie flat in the X-Z plane
      solarSystem.add(orbitLine);
    });
  
    // Animation function
    const animate = () => {
    requestAnimationFrame(animate);
  
    solarSystem.children.forEach((orbitGroup: THREE.Object3D, index: number) => {
      if (index === 0) return; // Skip the sun (assuming sun is the first child)
  
      // Rotate the orbit group around the Y-axis
      orbitGroup.rotateY(0.01 / (index + 1)); // Slower rotation for outer planets
  
      // Rotate the planet around its own axis
      const planetGroup = orbitGroup.children[0];
      if (planetGroup instanceof THREE.Group) {
        planetGroup.rotateY(0.02); // Adjust rotation speed as needed
        planetGroup.rotateX(0.01); // Adjust rotation speed as needed
      }
    });
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

    createStarField(sceneRef.current);
    createCelestialBodies(sceneRef.current);

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
      {/* <Modal visible={!!selectedBody} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedBody?.name}</Text>
            <Text>Type: {selectedBody?.type}</Text>
            <Text>Radius: {selectedBody?.radius} Earth radii</Text>
            <Text>Mass: {selectedBody?.mass} Earth masses</Text>
            <Text>Composition: {selectedBody?.composition}</Text>
            {selectedBody?.habitabilityScore !== undefined && (
              <Text>Habitability Score: {selectedBody.habitabilityScore}</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBody(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
     
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
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
});

