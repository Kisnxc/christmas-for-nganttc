import { useRef, useEffect } from 'react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';

// KHÔNG import useFrame hay useThree ở đây nữa!

export const HandTracker = ({ onUpdate }) => {
  const videoRef = useRef(null);
  const lastState = useRef('FIST'); 

  useEffect(() => {
    // 1. Cấu hình MediaPipe (Giữ nguyên logic của bạn)
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7, // Giảm nhẹ cho nhạy
      minTrackingConfidence: 0.7,
    });

    // 2. Xử lý kết quả (Giữ nguyên logic ngón tay của bạn)
    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];

        const isIndexOpen = lm[8].y < lm[6].y;
        const isMiddleOpen = lm[12].y < lm[10].y;
        const isRingOpen = lm[16].y < lm[14].y;
        const isPinkyOpen = lm[20].y < lm[18].y;
        
        const distThumbTipToPinkyBase = Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y);
        const distThumbIpToPinkyBase = Math.hypot(lm[2].x - lm[17].x, lm[2].y - lm[17].y);
        const isThumbOpen = distThumbTipToPinkyBase > distThumbIpToPinkyBase;

        const totalFingers = [isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen, isThumbOpen].filter(Boolean).length;

        let stateToSend = lastState.current;
        if (totalFingers >= 4) stateToSend = 'OPEN';
        else if (totalFingers <= 1) stateToSend = 'FIST';
        lastState.current = stateToSend;

        const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

        onUpdate({
          pos: { 
            x: (lm[9].x - 0.5) * 2, 
            y: -(lm[9].y - 0.5) * 2 
          },
          state: stateToSend,
          pinchDist: pinchDist,
          hasHand: true
        });
      } 
      else {
        onUpdate({
          pos: { x: 0, y: 0 },
          state: lastState.current,
          pinchDist: 0, 
          hasHand: false
        });
      }
    });

    // 3. Khởi tạo Camera (QUAN TRỌNG: Thêm playsInline cho iPhone)
    if (videoRef.current) {
        const camera = new cam.Camera(videoRef.current, {
            onFrame: async () => {
                // Kiểm tra video còn tồn tại không trước khi gửi
                if (videoRef.current) {
                    await hands.send({ image: videoRef.current });
                }
            },
            width: 640, height: 480,
        });
        camera.start();
    }

    // Cleanup không cần thiết lắm với camera utils này, 
    // nhưng React sẽ tự hủy videoRef khi unmount
  }, [onUpdate]);

  return (
    <video 
      ref={videoRef} 
      className="w-full h-full object-cover scale-x-[-1]" 
      // QUAN TRỌNG: Phải có 3 thuộc tính này để chạy trên Safari/iPhone
      autoPlay 
      playsInline 
      muted
    />
  );
};