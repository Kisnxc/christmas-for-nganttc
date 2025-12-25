import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

// =========================================================
// CẤU HÌNH MÀU SẮC (GIỮ NGUYÊN)
// =========================================================
const TINT_COLOR = "#b0b0b0"; 
const BORDER_COLOR = "#d4d4d4"; 
const BORDER_SIZE = 0.15;

// ==========================================
// 1. COMPONENT HIỂN THỊ VIDEO (VÁ LỖI IOS)
// ==========================================
const VideoContent = ({ url, onProximityChange }) => {
  const meshRef = useRef();
  const wasNearRef = useRef(false);

  // Cấu hình texture
  const texture = useVideoTexture(url, { 
    muted: true,    // Bắt buộc muted mới tự chạy được trên iOS
    loop: true, 
    start: true, 
    playsInline: true, // Chống phóng to
    crossOrigin: 'Anonymous' 
  });

  // --- [ĐOẠN CODE FIX LỖI IPHONE] ---
  useEffect(() => {
    const video = texture.image;
    if (video) {
        // 1. Ép lại thuộc tính playsInline trực tiếp vào thẻ HTML
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        
        // 2. Đảm bảo nó tắt tiếng ban đầu
        video.muted = true;

        // 3. Ép chạy thủ công (Force Play)
        const attemptPlay = () => {
            video.play().catch(e => console.log("iOS loading...", e));
        };
        attemptPlay();
    }
  }, [texture]); // Chạy ngay khi texture tải xong
  // ------------------------------------

  const { width, height } = useMemo(() => {
    const video = texture.image;
    // Fallback kích thước chuẩn 16:9 nếu chưa load kịp
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
    const isNear = distance < 20;

    // Báo cho App biết
    if (isNear !== wasNearRef.current) {
        wasNearRef.current = isNear;
        if (onProximityChange) onProximityChange(isNear);
    }

    // Logic âm thanh
    if (isNear) {
      // Chỉ bật tiếng khi video đã thực sự sẵn sàng
      // Lưu ý: Trên iOS, nếu người dùng chưa chạm vào màn hình (interact), dòng này có thể fail
      // Nhưng vì ta đã có nút "Mở quà" ở đầu, nên audio context đã được mở -> OK
      videoEl.muted = false;
      let volume = 1 - (distance / 15);
      videoEl.volume = THREE.MathUtils.clamp(volume, 0, 1);
    } else {
      videoEl.muted = true;
    }
  });

  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width + BORDER_SIZE, height + BORDER_SIZE]} />
        <meshBasicMaterial color={BORDER_COLOR} /> 
      </mesh>
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
// 2. CÁC COMPONENT KHÁC (GIỮ NGUYÊN 100%)
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
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} color={TINT_COLOR} toneMapped={true} />
      </mesh>
    </group>
  );
};

const MediaContent = ({ item, onProximityChange }) => {
  if (item.type === 'video') {
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
      <MediaContent item={item} onProximityChange={onProximityChange} />
    </group>
  );
};

export const MemoryGallery = ({ handData, memories, onProximityChange }) => {
  const positions = useMemo(() => {
    return memories.map((_, i) => {
      const count = memories.length;
      const radius = 16; 
      const angle = (i / count) * Math.PI * 2; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // SỬA LẠI THÀNH HÌNH TRÒN PHẲNG (Y=0) CHO BẠN
      const y = 0; 
      
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
            onProximityChange={onProximityChange}
        />
      ))}
    </group>
  );
};