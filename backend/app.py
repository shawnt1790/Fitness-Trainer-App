# app.py

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import cv2
import base64
from your_model import load_model, process_frame_for_model

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Restrict to React app's origin

model = load_model('final_finetuned_model_v1.keras')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_frame', methods=['POST'])
def process_frame():
    print(request.method)
    try:
        data = request.json['images']
        frames = []

        for image_bytes in data:
            image_data = base64.b64decode(image_bytes.split(',')[1])
            np_image = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(np_image, cv2.IMREAD_COLOR)
            frames.append(frame)

        # Preprocess the frame and run inference
        predictions, keypoints = process_frame_for_model(frames, model)

        if predictions is not None:
            # Return keypoints as a JSON response
            return jsonify({
                'predictions': predictions.tolist(),
                'keypoints': [k.tolist() for k in keypoints]
            })
        else:
            return jsonify({'message': 'Insufficient frames to make a prediction.'}), 202  # 202 Accepted: No prediction yet

    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
