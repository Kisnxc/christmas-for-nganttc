import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const RealisticMoon = () => {
  const moonTexture = useLoader(THREE.TextureLoader, '/img/moon.jpg');

  return (
    <mesh position={[-40, 40, -250]} rotation={[0.2, 0, 0]}>
      {/* Giảm kích thước khung tròn lại một chút để ôm sát mặt trăng hơn */}
      <circleGeometry args={[28, 64]} /> 
      
      <meshStandardMaterial 
        map={moonTexture}
        
        // --- BÍ KÍP XÓA SẠCH VIỀN ĐEN ---
        // 1. Dùng chính bức ảnh này làm "bản đồ trong suốt"
        // (Chỗ nào sáng -> Hiện, Chỗ nào tối -> Tàng hình)
        alphaMap={moonTexture}
        
        // 2. Bật chế độ trong suốt
        transparent={true}
        
        // 3. QUAN TRỌNG NHẤT: Ngưỡng cắt (Alpha Test)
        // Giá trị 0.2 nghĩa là: "Tất cả màu xám tối dưới 20% độ sáng -> VỨT HẾT"
        // Nó sẽ cắt sạch viền đen mờ mờ mà bạn đang thấy
        alphaTest={0.2} 
        
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={1.2}
        toneMapped={false}
      />
    </mesh>
  );
};

export const MagicalSky = () => {
  return (
    <group>
      <RealisticMoon />
      <fog attach="fog" args={['#000000', 100, 600]} /> 
    </group>
  );
};