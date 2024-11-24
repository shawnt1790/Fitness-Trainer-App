// src/components/OutputComponent.js

import React, { useState, useEffect } from 'react';
import './OutputComponent.css'; // We'll create this CSS file next

function OutputComponent() {
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    const handlePredictions = event => {
      setPredictions(event.detail);
    };

    window.addEventListener('predictions', handlePredictions);

    return () => {
      window.removeEventListener('predictions', handlePredictions);
    };
  }, []);

  return (
    <div id="output">
      {predictions ? (
        <div>
          <p>Class 1: {predictions[0]}</p>
          <p>Class 2: {predictions[1]}</p>
          <p>Class 3: {predictions[2]}</p>
          <p>Class 4: {predictions[3]}</p>
          <p>Class 5: {predictions[4]}</p>
          <p>Class 6: {predictions[5]}</p>
        </div>
      ) : (
        <p>Waiting for predictions...</p>
      )}
    </div>
  );
}

export default OutputComponent;
