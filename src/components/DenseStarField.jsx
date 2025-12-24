import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const DenseStarField = ({ handData }) => {
  const starsRef = useRef();

  // Tạo dữ liệu cho 6000 ngôi sao
  const { positions, sizes, colors } = useMemo(() => {
    const count = 6000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    const colorPalette = [
        new THREE.Color('#ffffff'), // Trắng
        new THREE.Color('#aaddff'), // Xanh dương nhạt (sao trẻ)
        new THREE.Color('#ffddaa'), // Vàng nhạt (sao già)
    ];

    for (let i = 0; i < count; i++) {
      // Phân bố sao theo hình cầu rỗng (để không đè vào cây thông ở giữa)
      // Bán kính từ 40 đến 200
      const r = 40 + Math.random() * 160;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Kích thước ngẫu nhiên: Sao gần thì to, sao xa thì nhỏ
      sizes[i] = Math.random() * 2.0;

      // Màu sắc ngẫu nhiên
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, sizes, colors };
  }, []);

  useFrame((state) => {
    if (!starsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // 1. XOAY BẦU TRỜI: Tạo cảm giác vũ trụ bao la đang chuyển động
    starsRef.current.rotation.y = time * 0.02; 
    starsRef.current.rotation.x = Math.sin(time * 0.1) * 0.05; // Nghiêng nhẹ

    // 2. LOGIC TƯƠNG TÁC (QUAN TRỌNG)
    // - FIST (Cây thông): Opacity = 1 (Sáng rực)
    // - OPEN (Ảnh): Opacity = 0.2 (Mờ đi để làm nền)
    const targetOpacity = handData.state === 'FIST' ? 1.0 : 0.2;
    
    // Lerp để chuyển đổi độ sáng mượt mà, không bị giật
    starsRef.current.material.opacity = THREE.MathUtils.lerp(
        starsRef.current.material.opacity,
        targetOpacity,
        0.05 // Tốc độ chuyển đổi
    );
    
    // Hiệu ứng "Thở" nhẹ cho kích thước (lấp lánh toàn cục)
    const twinkle = 1 + Math.sin(time * 2) * 0.1;
    starsRef.current.scale.setScalar(twinkle);
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      
      {/* Vật liệu sao */}
      <pointsMaterial 
        vertexColors 
        size={0.5} 
        sizeAttenuation={true} // Sao ở xa tự động nhỏ lại
        transparent 
        opacity={1} 
        blending={THREE.AdditiveBlending} // Hòa trộn ánh sáng
        depthWrite={false} // Không che khuất các vật thể khác
      />
    </points>
  );
};