// src/components/WebcamComponent.js

import React, { useEffect, useRef, useState } from 'react';
import './WebcamComponent.css'; // Ensure this file exists with necessary styles

function WebcamComponent() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentKeypoints, setCurrentKeypoints] = useState([]);
  const [frameBatch, setFrameBatch] = useState([]);
  const BATCH_SIZE = 10;

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    startWebcamAndProcess();
    return () => {
      // Clean up the video stream on component unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startWebcamAndProcess = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setInterval(sendFrameToServer, 200); // Process frames every 200ms
          };
        }
      })
      .catch(err => {
        console.error('Error accessing webcam: ', err);
      });
  };

  const sendFrameToServer = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      // Set canvas size to match the video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const frame = captureFrameFromVideo(video);
      setFrameBatch(prevBatch => {
        const newBatch = [...prevBatch, frame];
        if (newBatch.length === BATCH_SIZE) {
          processFrameBatch(newBatch);
          return [];
        }
        return newBatch;
      });
    }
  };

  const captureFrameFromVideo = (video) => {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    return tempCanvas.toDataURL('image/jpeg');
  };

  const processFrameBatch = async (batch) => {
    try {
      const response = await fetch(`${backendUrl}/process_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: batch }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Received data from backend:', data);

      if (data.keypoints) {
        updateKeypoints(data.keypoints); // Pass the entire array
      }

      if (data.predictions && data.predictions[0]) {
        // Pass predictions to OutputComponent via a custom event
        window.dispatchEvent(new CustomEvent('predictions', { detail: data.predictions[0] }));
      } else if (data.message) {
        console.log(data.message);
      } else {
        console.log('No predictions received.');
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  };

  const updateKeypoints = (keypoints) => {
    console.log('Processing keypoints:', keypoints);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Create a copy of currentKeypoints to avoid direct state mutation
    let updatedKeypoints = [...currentKeypoints];

    // Initialize currentKeypoints if empty
    if (updatedKeypoints.length === 0) {
      for (let i = 0; i < keypoints.length; i += 3) {
        updatedKeypoints.push({ x: 0, y: 0, confidence: keypoints[i + 2] });
      }
    }

    for (let i = 0; i < keypoints.length; i += 3) {
      const y = keypoints[i];
      const x = keypoints[i + 1];
      const confidence = keypoints[i + 2];

      if (confidence > 0.5) { // Confidence threshold
        if (updatedKeypoints[i / 3].confidence === 0) {
          // Draw new keypoint
          drawSingleKeypoint(context, x * canvas.width, y * canvas.height);
        } else {
          // Move existing keypoint
          moveSingleKeypoint(context, updatedKeypoints[i / 3], x * canvas.width, y * canvas.height);
        }

        // Update keypoints
        updatedKeypoints[i / 3] = { x, y, confidence };
      } else {
        if (updatedKeypoints[i / 3].confidence > 0) {
          // Clear keypoint
          clearSingleKeypoint(context, updatedKeypoints[i / 3].x * canvas.width, updatedKeypoints[i / 3].y * canvas.height);
          updatedKeypoints[i / 3].confidence = 0;
        }
      }
    }

    // Update the state once after all keypoints have been processed
    setCurrentKeypoints(updatedKeypoints);
  };

  const drawSingleKeypoint = (context, x, y) => {
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.fillStyle = 'red';
    context.fill();
  };

  const moveSingleKeypoint = (context, keypoint, newX, newY) => {
    clearSingleKeypoint(context, keypoint.x * context.canvas.width, keypoint.y * context.canvas.height);
    drawSingleKeypoint(context, newX, newY);
  };

  const clearSingleKeypoint = (context, x, y) => {
    context.clearRect(x - 5, y - 5, 10, 10);
  };

  return (
    <div id="container">
      <video id="webcam" ref={videoRef} autoPlay playsInline width="640" height="480"></video>
      <canvas id="outputCanvas" ref={canvasRef} width="640" height="480"></canvas>
      <div id="output"></div> {/* Ensure this div exists for predictions */}
    </div>
  );
}

export default WebcamComponent;
