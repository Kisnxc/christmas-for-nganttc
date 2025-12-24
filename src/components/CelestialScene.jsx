import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

const COUNT = 12000;   
const CORE_COUNT = 2000; 
const STAR_COUNT = 800;  
const BG_COUNT = 4000; 

const CHRISTMAS_PALETTE = [
  new THREE.Color('#ff0f0f').multiplyScalar(1.5), 
  new THREE.Color('#00ff2a').multiplyScalar(1.2), 
  new THREE.Color('#ffbf00').multiplyScalar(2.0), 
  new THREE.Color('#ffffff').multiplyScalar(1.5), 
  new THREE.Color('#00eaff').multiplyScalar(1.2), 
];

const CORE_PALETTE = [
    new THREE.Color('#ffaa00').multiplyScalar(2.5), 
    new THREE.Color('#ffdd88').multiplyScalar(1.8),
    new THREE.Color('#ffffff').multiplyScalar(2.0),
];

const HEART_PALETTE = [
    new THREE.Color('#ff0055').multiplyScalar(3.0), 
    new THREE.Color('#ff0000').multiplyScalar(4.0), 
    new THREE.Color('#ffcccc').multiplyScalar(2.0), 
];

export const CelestialScene = ({ handData }) => {
  const treeMeshRef = useRef();
  const coreMeshRef = useRef();
  const starMeshRef = useRef();
  const bgRef = useRef();
  const dummy = new THREE.Object3D();

  // =================================================================
  // 1. TẠO DỮ LIỆU HẠT (ĐÃ ĐIỀU CHỈNH VỊ TRÍ THẤP HƠN)
  // =================================================================
  
  // A. CÂY THÔNG
  const { treeParticles, treeColors } = useMemo(() => {
    const temp = [];
    const colorArray = new Float32Array(COUNT * 3);
    const layers = 10;
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random(); 
      const angle = (t * Math.PI * 2 * 15) + (Math.random() * 0.5); 
      const layerProgress = (t * layers) % 1; 
      const baseConeRadius = (1 - t) * 9;
      const branchRadius = baseConeRadius * (0.3 + 0.7 * Math.pow(layerProgress, 0.8));
      const randomSpread = (Math.random() - 0.5) * 1.5;
      const finalRadius = branchRadius + randomSpread;
      const droop = finalRadius * 0.2; 
      
      // --- THAY ĐỔI Ở ĐÂY: Hạ thấp cây xuống (-11.5 thay vì -9) ---
      // Cây sẽ cao từ -11.5 đến +6.5 (Tổng cao 18)
      // Giúp đỉnh cây gần tâm màn hình hơn
      const y = (t * 18 - 11.5) - droop * 0.5;

      const treePos = new THREE.Vector3(Math.cos(angle) * finalRadius, y, Math.sin(angle) * finalRadius);
      const nebulaBasePos = new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 15 + 5);
      const speed = Math.random() * 0.03 + 0.02;
      const isOrnament = Math.random() > 0.9;
      temp.push({ treePos, nebulaBasePos, curPos: nebulaBasePos.clone(), speed, isOrnament, angleOffset: Math.random() * Math.PI * 2 });
      let color;
      if (isOrnament) {
         color = CHRISTMAS_PALETTE[Math.floor(Math.random() * CHRISTMAS_PALETTE.length)];
      } else {
         const leafColors = [new THREE.Color('#00ff2a').multiplyScalar(0.8), new THREE.Color('#00ff2a').multiplyScalar(0.5), new THREE.Color('#ffffff').multiplyScalar(0.8)];
         color = leafColors[Math.floor(Math.random() * leafColors.length)];
      }
      color.toArray(colorArray, i * 3);
    }
    return { treeParticles: temp, treeColors: colorArray };
  }, []);

  // B. LÕI NĂNG LƯỢNG
  const { coreParticles, coreColors } = useMemo(() => {
    const temp = [];
    const colorArray = new Float32Array(CORE_COUNT * 3);
    for (let i = 0; i < CORE_COUNT; i++) {
        const t = Math.random(); 
        const coreRadius = Math.pow(t, 2) * 1.2; 
        const angle = Math.random() * Math.PI * 2; 
        
        // --- THAY ĐỔI Ở ĐÂY: Hạ thấp lõi đồng bộ với cây ---
        const treePos = new THREE.Vector3(Math.cos(angle) * coreRadius, (1-t) * 18 - 11.5, Math.sin(angle) * coreRadius);
        
        const nebulaBasePos = new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 5);
        const speed = Math.random() * 0.03 + 0.02;
        temp.push({ treePos, nebulaBasePos, curPos: nebulaBasePos.clone(), speed, verticalSpeed: Math.random() * 0.05 + 0.02 });
        const color = CORE_PALETTE[Math.floor(Math.random() * CORE_PALETTE.length)];
        color.toArray(colorArray, i * 3);
    }
    return { coreParticles: temp, coreColors: colorArray };
  }, []);

  // C. TRÁI TIM NĂNG LƯỢNG
  const { starParticles, starColors } = useMemo(() => {
    const temp = [];
    const colorArray = new Float32Array(STAR_COUNT * 3);
    
    // --- THAY ĐỔI Ở ĐÂY: Hạ thấp vị trí đỉnh (từ 9.5 xuống 7.0) ---
    // Vị trí y=7.0 rất dễ nhìn thấy mà không cần zoom out
    const topPosition = new THREE.Vector3(0, 7.0, 0); 

    for (let i = 0; i < STAR_COUNT; i++) {
        const t = Math.random() * Math.PI * 2;
        
        // Vẽ trái tim
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        
        hx /= 15;
        hy /= 15;

        const hz = (Math.random() - 0.5) * 0.5; 
        const jitter = 0.05;
        const x = hx + (Math.random() - 0.5) * jitter;
        const y = hy + (Math.random() - 0.5) * jitter;
        const z = hz + (Math.random() - 0.5) * jitter;

        const treePos = topPosition.clone().add(new THREE.Vector3(x, y, z));
        const nebulaBasePos = new THREE.Vector3(x * 8, 25 + Math.random() * 10, z * 8);
        const speed = Math.random() * 0.05 + 0.03;

        temp.push({ treePos, nebulaBasePos, curPos: nebulaBasePos.clone(), speed, pulseOffset: Math.random() * Math.PI });
        const color = HEART_PALETTE[Math.floor(Math.random() * HEART_PALETTE.length)];
        color.toArray(colorArray, i * 3);
    }
    return { starParticles: temp, starColors: colorArray };
  }, []);

  // D. SAO NỀN (Giữ nguyên)
  const bgPositions = useMemo(() => {
    const pos = new Float32Array(BG_COUNT * 3);
    for (let i = 0; i < BG_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20; 
    }
    return pos;
  }, []);

  // =================================================================
  // ANIMATION LOOP
  // =================================================================
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // A. CÂY THÔNG
    treeParticles.forEach((p, i) => {
      let target;
      if (handData.state === 'FIST') {
        target = p.treePos;
      } else {
        const swirlSpeed = time * 0.3; 
        const angle = Math.atan2(p.nebulaBasePos.z, p.nebulaBasePos.x) + swirlSpeed + p.angleOffset;
        const radius = Math.sqrt(p.nebulaBasePos.x**2 + p.nebulaBasePos.z**2);
        target = new THREE.Vector3(Math.cos(angle) * radius, p.nebulaBasePos.y + Math.sin(time + i) * 0.5, Math.sin(angle) * radius);
      }
      p.curPos.lerp(target, p.speed);
      dummy.position.set(p.curPos.x + handData.pos.x * 0.15, p.curPos.y + handData.pos.y * 0.15, p.curPos.z);
      const sparkleThreshold = handData.state === 'FIST' ? 0.99 : 0.98;
      const isSparkle = Math.sin(time * 5 + i) > sparkleThreshold;
      let baseScale = p.isOrnament ? 0.08 : 0.04; 
      if (handData.state !== 'FIST') baseScale *= 1.5;
      const scale = isSparkle ? baseScale * 2.5 : baseScale;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      treeMeshRef.current.setMatrixAt(i, dummy.matrix);
    });
    treeMeshRef.current.instanceMatrix.needsUpdate = true;

    // B. LÕI CHẢY
    coreParticles.forEach((p, i) => {
        let target;
        if (handData.state === 'FIST') {
            p.treePos.y -= p.verticalSpeed;
            // Reset nếu chảy xuống quá thấp (thấp hơn -11.5)
            if (p.treePos.y < -11.5) { p.treePos.y = 6.5; }
            target = p.treePos;
        } else {
            target = p.nebulaBasePos;
        }
        p.curPos.lerp(target, p.speed);
        dummy.position.set(p.curPos.x + handData.pos.x * 0.1, p.curPos.y + handData.pos.y * 0.1, p.curPos.z); 
        const isSparkle = Math.sin(time * 10 + i) > 0.95;
        const baseScale = handData.state === 'FIST' ? 0.03 : 0.05;
        const scale = isSparkle ? baseScale * 3.0 : baseScale;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        coreMeshRef.current.setMatrixAt(i, dummy.matrix);
    });
    coreMeshRef.current.instanceMatrix.needsUpdate = true;

    // C. TRÁI TIM ĐẬP
    starParticles.forEach((p, i) => {
        let target;
        if (handData.state === 'FIST') {
            target = p.treePos;
        } else {
            target = p.nebulaBasePos;
        }
        p.curPos.lerp(target, p.speed * 2.0);
        
        // Ít ảnh hưởng bởi tay để giữ vị trí đỉnh
        dummy.position.set(p.curPos.x + handData.pos.x * 0.02, p.curPos.y + handData.pos.y * 0.02, p.curPos.z); 

        const pulse = Math.pow(Math.sin(time * 8 + p.pulseOffset), 2);
        // Tăng kích thước thêm 1 chút nữa cho dễ thấy (0.1)
        const baseScale = 0.1; 
        const scale = baseScale + pulse * 0.06; 

        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        starMeshRef.current.setMatrixAt(i, dummy.matrix);
    });
    starMeshRef.current.instanceMatrix.needsUpdate = true;
    starMeshRef.current.rotation.y = time * 0.5;
    bgRef.current.rotation.y = time * 0.015;
  });

  return (
    <>
      <points ref={bgRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={BG_COUNT} array={bgPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#ffffff" transparent opacity={0.2} />
      </points>
      <instancedMesh ref={treeMeshRef} args={[null, null, COUNT]}>
        <sphereGeometry args={[1, 8, 8]}>
          <instancedBufferAttribute attach="attributes-color" args={[treeColors, 3]} />
        </sphereGeometry>
        <meshBasicMaterial vertexColors={true} toneMapped={false} color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={coreMeshRef} args={[null, null, CORE_COUNT]}>
        <sphereGeometry args={[0.7, 8, 8]}> 
          <instancedBufferAttribute attach="attributes-color" args={[coreColors, 3]} />
        </sphereGeometry>
        <meshBasicMaterial vertexColors={true} toneMapped={false} color="#ffddaa" />
      </instancedMesh>
      <instancedMesh ref={starMeshRef} args={[null, null, STAR_COUNT]}>
        <sphereGeometry args={[1, 8, 8]}> 
          <instancedBufferAttribute attach="attributes-color" args={[starColors, 3]} />
        </sphereGeometry>
        <meshBasicMaterial vertexColors={true} toneMapped={false} color="#ffbbaa" />
      </instancedMesh>
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.5} radius={0.7} mipmapBlur />
      </EffectComposer>
      <ambientLight intensity={0.1} />
    </>
  );
};