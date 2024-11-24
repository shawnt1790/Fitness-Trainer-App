import tensorflow as tf
import numpy as np
from pose_detection import extract_keypoints, preprocess_image, load_movenet_model

# Load MoveNet model for keypoint extraction
movenet_model = load_movenet_model()


def load_model(model_path):
    return tf.keras.models.load_model(model_path)

def process_frame_for_model(frames, lstm_model):
    sequence_buffer = []

    for frame in frames:
        input_frame = preprocess_image(frame)
        keypoints = extract_keypoints(movenet_model, input_frame)
        features = keypoints.flatten()

        sequence_buffer.append(features)

    if len(sequence_buffer)>0:  # Adjust condition if needed
        sequence = np.array(sequence_buffer).reshape(1, len(frames), -1)
        predictions = lstm_model.predict(sequence)
        return predictions, sequence_buffer  # Modify as needed based on your requirements
    else:
        return None, None
