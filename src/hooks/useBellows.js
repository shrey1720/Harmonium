import { useState, useEffect, useRef } from 'react';

export const useBellows = (isActive) => {
  const [pressure, setPressure] = useState(0.5);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastYRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        requestAnimationFrame(processFrame);
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    const processFrame = () => {
      if (!isActive || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simple motion detection: track the "center of mass" of the image or just use brightness
        // For a more robust solution, we'd use MediaPipe, but for a lightweight "bellows" 
        // we can track the vertical shift of the image content.
        
        // Let's use a simpler heuristic: The user's head usually occupies the center.
        // We'll track the average Y-position of darker pixels (hair/eyes).
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let totalY = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const brightness = (r + g + b) / 3;
          
          if (brightness < 80) { // Dark pixels
            const y = Math.floor((i / 4) / canvas.width);
            totalY += y;
            count++;
          }
        }

        if (count > 0) {
          const avgY = totalY / count;
          if (lastYRef.current !== null) {
            const diff = avgY - lastYRef.current;
            // Map diff to pressure changes
            // If screen moves back, face moves UP in frame (avgY decreases)
            // If screen moves forward, face moves DOWN in frame (avgY increases)
            const sensitivity = 0.005;
            setPressure(prev => {
              const next = prev + (diff * sensitivity);
              return Math.max(0.1, Math.min(1, next));
            });
          }
          lastYRef.current = avgY;
        }
      }
      requestAnimationFrame(processFrame);
    };

    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return { pressure, videoRef };
};
