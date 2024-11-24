// src/App.js

import React from 'react';
import './App.css';
import WebcamComponent from './components/WebcamComponent';
import OutputComponent from './components/OutputComponent';

function App() {
  return (
    <div className="App">
      <h1>Live Object Detection with Keypoints</h1>
      <WebcamComponent />
      <OutputComponent />
    </div>
  );
}

export default App;
