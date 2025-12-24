import { useRef, useEffect } from 'react';
// QUAN TRỌNG: Đã xóa các dòng import @mediapipe... đi vì ta dùng CDN

export const HandTracker = ({ onUpdate }) => {
  const videoRef = useRef(null);
  const lastState = useRef('FIST'); 

  useEffect(() => {
    // Kiểm tra xem thư viện đã tải xong chưa
    if (!window.Hands || !window.Camera) {
      console.error("MediaPipe chưa tải xong. Hãy kiểm tra lại file index.html");
      return;
    }

    // 1. Dùng window.Hands thay vì new Hands()
    const hands = new window.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    // 2. Xử lý kết quả (Logic giữ nguyên)
    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];

        // Logic đếm ngón
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
            x: (lm[9].x - 0.5) * 3, 
            y: -(lm[9].y - 0.5) * 3 
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

    // 3. Khởi tạo Camera bằng window.Camera
    if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await hands.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480,
        });
        camera.start();
    }

  }, [onUpdate]);

  return (
    <video 
      ref={videoRef} 
      className="w-full h-full object-cover scale-x-[-1]" 
      playsInline 
      muted
    />
  );
};