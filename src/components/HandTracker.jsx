import { useRef, useEffect } from 'react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';

export const HandTracker = ({ onUpdate }) => {
  const videoRef = useRef(null);
  const lastState = useRef('FIST'); 

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.8,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];

        // --- 1. LOGIC ĐẾM NGÓN (Để đóng/mở cây thông) ---
        const isIndexOpen = lm[8].y < lm[6].y;
        const isMiddleOpen = lm[12].y < lm[10].y;
        const isRingOpen = lm[16].y < lm[14].y;
        const isPinkyOpen = lm[20].y < lm[18].y;
        
        // Check ngón cái
        const distThumbTipToPinkyBase = Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y);
        const distThumbIpToPinkyBase = Math.hypot(lm[2].x - lm[17].x, lm[2].y - lm[17].y);
        const isThumbOpen = distThumbTipToPinkyBase > distThumbIpToPinkyBase;

        const totalFingers = [isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen, isThumbOpen].filter(Boolean).length;

        // Quyết định trạng thái Open/Fist
        let stateToSend = lastState.current;
        if (totalFingers === 5) stateToSend = 'OPEN';
        else if (totalFingers === 0) stateToSend = 'FIST';
        lastState.current = stateToSend;

        // --- 2. LOGIC TÍNH KHOẢNG CÁCH PINCH (MỚI) ---
        // Tính khoảng cách giữa đầu ngón Cái (4) và đầu ngón Trỏ (8)
        const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

        onUpdate({
          pos: { 
            x: (lm[9].x - 0.5) * 2, 
            y: -(lm[9].y - 0.5) * 2 
          },
          state: stateToSend,
          pinchDist: pinchDist, // <--- Gửi dữ liệu Zoom
          hasHand: true
        });
      } 
      else {
        // Mất tay -> Giữ nguyên mọi thứ
        onUpdate({
          pos: { x: 0, y: 0 },
          state: lastState.current,
          pinchDist: 0, 
          hasHand: false
        });
      }
    });

    const camera = new cam.Camera(videoRef.current, {
      onFrame: async () => await hands.send({ image: videoRef.current }),
      width: 640, height: 480,
    });
    camera.start();

    return () => camera.stop();
  }, [onUpdate]);

  return (
    <video 
      ref={videoRef} 
      className="w-full h-full object-cover scale-x-[-1]" 
      autoPlay playsInline muted
    />
  );
};