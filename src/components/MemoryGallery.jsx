import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

// =========================================================
// CẤU HÌNH MÀU SẮC (ĐÃ ĐIỀU CHỈNH LẠI CHO DỊU MẮT)
// =========================================================

// 1. Màu phủ lên ảnh (TINT): 
// #b0b0b0: Màu xám bạc. Giúp giảm độ chói xuống còn ~70%, 
// làm ảnh trông đầm hơn, giống như xem phim rạp.
const TINT_COLOR = "#b0b0b0"; 

// 2. Màu viền (BORDER):
// Không dùng #ffffff (Trắng tinh) nữa vì rất gắt.
// Dùng #d4d4d4 (Xám sáng) -> Tạo khung rõ ràng nhưng êm dịu.
const BORDER_COLOR = "#d4d4d4"; 

const BORDER_SIZE = 0.15;

// ==========================================
// 1. COMPONENT HIỂN THỊ VIDEO
// ==========================================
const VideoContent = ({ url }) => {
  // ... (Giữ nguyên code cũ)
  const meshRef = useRef();
  const texture = useVideoTexture(url, { muted: true, loop: true, start: true, playsInline: true });
  const { width, height } = useMemo(() => {
    // ... (Giữ nguyên logic tính toán)
    const video = texture.image;
    const vidW = video.videoWidth || 16;
    const vidH = video.videoHeight || 9;
    const aspect = vidW / vidH;
    const baseHeight = 2.5;
    return { width: baseHeight * aspect, height: baseHeight };
  }, [texture]);

  useFrame((state) => {
    // ... (Giữ nguyên logic âm thanh)
    if (!meshRef.current || !texture.image) return;
    const videoEl = texture.image;
    const camera = state.camera;
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);
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
          color={TINT_COLOR} // Màu đã chỉnh sửa
          toneMapped={true}  // BẬT cái này lên để render xử lý ánh sáng chuẩn hơn
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 2. COMPONENT HIỂN THỊ ẢNH
// ==========================================
const ImageContent = ({ url }) => {
  const texture = useLoader(THREE.TextureLoader, url);
  const { width, height } = useMemo(() => {
    const imgW = texture.image.width;
    const imgH = texture.image.height;
    const aspect = imgW / imgH;
    const baseHeight = 2.5;
    return { width: baseHeight * aspect, height: baseHeight };
  }, [texture]);

  return (
    <group>
      {/* LỚP VIỀN */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width + BORDER_SIZE, height + BORDER_SIZE]} />
        <meshBasicMaterial color={BORDER_COLOR} />
      </mesh>

      {/* LỚP ẢNH */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.DoubleSide} 
          color={TINT_COLOR} // Màu đã chỉnh sửa
          toneMapped={true} 
        />
      </mesh>
    </group>
  );
};

// ... (Phần còn lại giữ nguyên không đổi)
const MediaContent = ({ item }) => {
  if (item.type === 'video') {
    return <VideoContent url={item.url} />;
  }
  return <ImageContent url={item.url} />;
};

const PhotoFrame = ({ item, targetPos, handData }) => {
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
      <MediaContent item={item} />
    </group>
  );
};

export const MemoryGallery = ({ handData, memories }) => {
  const positions = useMemo(() => {
    return memories.map((_, i) => {
      const count = memories.length;
      const radius = 16; 
      const angle = (i / count) * Math.PI * 2; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(i * 132) * 2.5; 
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
        />
      ))}
    </group>
  );
};