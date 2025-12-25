import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

// =========================================================
// CẤU HÌNH MÀU SẮC (GIỮ NGUYÊN CỦA BẠN)
// =========================================================
const TINT_COLOR = "#b0b0b0"; 
const BORDER_COLOR = "#d4d4d4"; 
const BORDER_SIZE = 0.15;

// ==========================================
// 1. COMPONENT HIỂN THỊ VIDEO (CÓ SỬA ĐỔI)
// ==========================================
// Thêm prop: onProximityChange để báo về App
const VideoContent = ({ url, onProximityChange }) => {
  const meshRef = useRef();
  
  // [MỚI] Biến lưu trạng thái cũ để tránh spam tín hiệu liên tục
  const wasNearRef = useRef(false);

  const texture = useVideoTexture(url, { muted: true, loop: true, start: true, playsInline: true });
  const { width, height } = useMemo(() => {
    const video = texture.image;
    const vidW = video?.videoWidth || 16;
    const vidH = video?.videoHeight || 9;
    const aspect = vidW / vidH;
    const baseHeight = 2.5;
    return { width: baseHeight * aspect, height: baseHeight };
  }, [texture]);

  useFrame((state) => {
    if (!meshRef.current || !texture.image) return;
    const videoEl = texture.image;
    const camera = state.camera;
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    
    const distance = camera.position.distanceTo(worldPos);

    // --- [ĐOẠN CODE MỚI THÊM VÀO] ---
    // Kiểm tra xem có đang ở gần (< 20m) hay không
    const isNear = distance < 20;

    // Chỉ khi nào trạng thái thay đổi (đang Xa -> Gần hoặc ngược lại) thì mới báo
    if (isNear !== wasNearRef.current) {
        wasNearRef.current = isNear;
        // Gọi hàm báo tin cho App.jsx
        if (onProximityChange) {
            onProximityChange(isNear);
        }
    }
    // -------------------------------

    // Logic âm thanh video (Giữ nguyên của bạn)
    if (distance < 20) {
      videoEl.muted = false;
      let volume = 1 - (distance / 15);
      videoEl.volume = THREE.MathUtils.clamp(volume, 0, 1);
    } else {
      videoEl.muted = true;
    }
  });

  return (
    <group>
      {/* LỚP VIỀN */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width + BORDER_SIZE, height + BORDER_SIZE]} />
        <meshBasicMaterial color={BORDER_COLOR} /> 
      </mesh>

      {/* LỚP VIDEO */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.DoubleSide} 
          color={TINT_COLOR} 
          toneMapped={true} 
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 2. COMPONENT HIỂN THỊ ẢNH (GIỮ NGUYÊN)
// ==========================================
const ImageContent = ({ url }) => {
  const texture = useLoader(THREE.TextureLoader, url);
  const { width, height } = useMemo(() => {
    const imgW = texture.image?.width || 1;
    const imgH = texture.image?.height || 1;
    const aspect = imgW / imgH;
    const baseHeight = 2.5;
    return { width: baseHeight * aspect, height: baseHeight };
  }, [texture]);

  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width + BORDER_SIZE, height + BORDER_SIZE]} />
        <meshBasicMaterial color={BORDER_COLOR} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.DoubleSide} 
          color={TINT_COLOR} 
          toneMapped={true} 
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 3. CÁC COMPONENT TRUNG GIAN (TRUYỀN PROP XUỐNG)
// ==========================================
const MediaContent = ({ item, onProximityChange }) => {
  if (item.type === 'video') {
    // Truyền tiếp onProximityChange vào Video
    return <VideoContent url={item.url} onProximityChange={onProximityChange} />;
  }
  return <ImageContent url={item.url} />;
};

const PhotoFrame = ({ item, targetPos, handData, onProximityChange }) => {
  const groupRef = useRef();
  const hiddenPos = new THREE.Vector3(0, 0, 0); 
  const currentPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const targetScale = handData.state === 'OPEN' ? 1 : 0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    const target = handData.state === 'OPEN' ? targetPos : hiddenPos;
    currentPos.current.lerp(target, 0.08);
    groupRef.current.position.copy(currentPos.current);

    if (handData.state === 'OPEN') {
       groupRef.current.lookAt(state.camera.position);
    } else {
       groupRef.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Truyền tiếp onProximityChange vào MediaContent */}
      <MediaContent item={item} onProximityChange={onProximityChange} />
    </group>
  );
};

// ==========================================
// 4. COMPONENT CHÍNH (NHẬN PROP TỪ APP)
// ==========================================
// Thêm prop onProximityChange ở đây để nhận hàm từ App.jsx
export const MemoryGallery = ({ handData, memories, onProximityChange }) => {
  const positions = useMemo(() => {
    return memories.map((_, i) => {
      const count = memories.length;
      const radius = 16; 
      const angle = (i / count) * Math.PI * 2; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(i * 132) * 2.5; // Giữ nguyên công thức vị trí của bạn
      return new THREE.Vector3(x, y, z);
    });
  }, [memories]);

  return (
    <group>
      {memories.map((item, i) => (
        <PhotoFrame 
            key={i} 
            item={item} 
            targetPos={positions[i]} 
            handData={handData} 
            // Truyền hàm này xuống các lớp dưới
            onProximityChange={onProximityChange}
        />
      ))}
    </group>
  );
};