import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const MOON_PARTICLE_COUNT = 600; // Số lượng hạt tạo nên mặt trăng

export const DistantMoon = () => {
  const meshRef = useRef();

  // Tạo dữ liệu vị trí và màu sắc cho các hạt mặt trăng
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(MOON_PARTICLE_COUNT * 3);
    const colors = new Float32Array(MOON_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(MOON_PARTICLE_COUNT);

    // Vị trí tâm mặt trăng (Góc trên bên trái, rất xa)
    const moonCenter = new THREE.Vector3(-80, 60, -180);
    const baseRadius = 15; // Bán kính mặt trăng

    const colorPalette = [
        new THREE.Color('#fffce0').multiplyScalar(1.2), // Vàng nhạt sáng
        new THREE.Color('#ffffff').multiplyScalar(1.0), // Trắng
        new THREE.Color('#ffeebb').multiplyScalar(1.1), // Vàng kem ấm
    ];

    for (let i = 0; i < MOON_PARTICLE_COUNT; i++) {
      // --- THUẬT TOÁN TẠO HÌNH LƯỠI LIỀM ---
      // 1. Tạo một góc ngẫu nhiên trong một cung tròn (không phải cả vòng tròn)
      // Góc từ -PI/2 đến PI/1.5 sẽ tạo ra hình trăng khuyết hơi nghiêng
      const angle = Math.random() * Math.PI * 1.3 - Math.PI / 2.5;

      // 2. Tạo độ dày cho mặt trăng
      // Hạt ở giữa cung tròn sẽ dày hơn, ở 2 đầu nhọn sẽ mỏng hơn
      const thicknessRatio = Math.sin(angle + Math.PI/2.5); // Tạo độ cong
      const randomRadiusOffset = Math.random() * 3 * thicknessRatio;
      
      const r = baseRadius + randomRadiusOffset;

      // 3. Tính vị trí cục bộ của hạt trên mặt trăng
      const localX = r * Math.cos(angle);
      const localY = r * Math.sin(angle);
      // Thêm chút độ sâu Z ngẫu nhiên để nó không quá phẳng
      const localZ = (Math.random() - 0.5) * 2; 

      // 4. Đặt vào vị trí không gian 3D
      positions[i * 3] = moonCenter.x + localX;
      positions[i * 3 + 1] = moonCenter.y + localY;
      positions[i * 3 + 2] = moonCenter.z + localZ;
      
      // Kích thước: Hạt mặt trăng to hơn sao nền một chút
      sizes[i] = 1.0 + Math.random() * 1.5;

      // Màu sắc
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, sizes };
  }, []);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      
      {/* Vật liệu hạt phát sáng */}
      <pointsMaterial 
        vertexColors 
        size={1} // Kích thước cơ bản
        sizeAttenuation={true} // Xa nhỏ gần to
        transparent 
        opacity={0.9} // Hơi trong suốt
        blending={THREE.AdditiveBlending} // Hòa trộn ánh sáng để trông rực rỡ
        depthWrite={false} // Không che khuất các vật khác
      />
    </points>
  );
};