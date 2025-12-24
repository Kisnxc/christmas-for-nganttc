import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

export const CameraRig = ({ handData }) => {
  const { camera } = useThree();
  
  // =========================================================
  // CẤU HÌNH GÓC NHÌN MẶC ĐỊNH
  // =========================================================
  
  // 1. KHOẢNG CÁCH (RADIUS): 
  // Để 55 hoặc 60 để lùi xa ngay từ đầu, bao trọn cả cây và trái tim
  const INITIAL_RADIUS = 50; 

  // 2. ĐỘ CAO CAMERA (PHI):
  // Math.PI / 2 = Ngang tầm mắt. 
  // Giảm nhẹ 1 chút (ví dụ 1.4) để camera hơi nhìn từ trên xuống xíu cho nghệ thuật
  const INITIAL_PHI = Math.PI / 2 - 0.1;

  // 3. ĐIỂM NHÌN (LOOK AT):
  // Thay vì nhìn vào (0,0,0) là gốc cây, ta nhìn vào (0, 4, 0) là giữa thân cây
  // Điều này giúp khung hình lấy được cả ngọn cây (trái tim) và gốc cây.
  const LOOK_AT_TARGET = new THREE.Vector3(0, 0, 1);


  // BỘ NHỚ TRẠNG THÁI
  const spherical = useRef(new THREE.Spherical(INITIAL_RADIUS, INITIAL_PHI, 0));
  const prevHandPos = useRef(null);
  const prevPinchDist = useRef(null);

  useFrame((state, delta) => {
    // A. NẾU CÓ TAY (Đang điều khiển)
    if (handData.hasHand) {
      
      // --- XỬ LÝ DI CHUYỂN & XOAY ---
      if (prevHandPos.current) {
        const deltaX = handData.pos.x - prevHandPos.current.x;
        const deltaY = handData.pos.y - prevHandPos.current.y;

        const sensitivityRotate = 1.2;  
        const sensitivityElevate = 0.8; 

        spherical.current.theta -= deltaX * sensitivityRotate;
        spherical.current.phi -= deltaY * sensitivityElevate;
        
        // Giới hạn góc nâng hạ
        spherical.current.phi = THREE.MathUtils.clamp(spherical.current.phi, 0.1, 2.0);
      }
      prevHandPos.current = handData.pos;

      // --- XỬ LÝ ZOOM ---
      if (handData.pinchDist !== undefined && handData.pinchDist > 0) {
        if (prevPinchDist.current !== null) {
          const pinchDelta = handData.pinchDist - prevPinchDist.current;
          const zoomSensitivity = 120.0; 
          spherical.current.radius -= pinchDelta * zoomSensitivity;
          
          // Giới hạn Zoom: Min 10, Max 90 (Cho phép lùi ra xa hơn nữa)
          spherical.current.radius = THREE.MathUtils.clamp(spherical.current.radius, 10, 90);
        }
        prevPinchDist.current = handData.pinchDist;
      }
    } 
    // B. NẾU BỎ TAY RA
    else {
      prevHandPos.current = null;
      prevPinchDist.current = null;
    }

    // --- C. DI CHUYỂN CAMERA MƯỢT MÀ ---
    const targetPos = new THREE.Vector3().setFromSpherical(spherical.current);
    
    // Cộng thêm vị trí LookAt để Camera thực sự bay quanh điểm đó
    // (Logic vector: Vị trí Camera = Điểm nhìn + Vector cầu)
    targetPos.add(LOOK_AT_TARGET);

    camera.position.lerp(targetPos, 0.1); 
    camera.lookAt(LOOK_AT_TARGET); // Luôn nhìn vào giữa thân cây (cao độ y=4)
  });

  return null;
};