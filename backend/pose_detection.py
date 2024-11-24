import numpy as np
import os
import tensorflow as tf
from model_loader import preprocess_image, extract_keypoints, load_movenet_model, augment_image

# Load the model
model = load_movenet_model()

def process_images_into_sequences(df, base_directory, sequence_length=20, stride=2, augment=False):
    """Process images into sequences for LSTM training"""
    sequences = []
    labels = []

    # Group by video number
    grouped = df.groupby('video_number')

    for _, group in grouped:
        group = group.sort_values(by='frame_number')
        keypoints_sequence = []
        for i, (_, row) in enumerate(group.iterrows()):
            if i % stride == 0:  # Apply stride
                image_path = os.path.join(base_directory, row['exercise_label'], row['filename'])
                image = tf.io.read_file(image_path)
                image = tf.image.decode_jpeg(image)
                processed_image = preprocess_image(image)
                

                if augment:
                    processed_image = augment_image(processed_image)

                keypoints = extract_keypoints(model, processed_image)
                keypoints_sequence.append(keypoints)

                if len(keypoints_sequence) == sequence_length:
                    sequences.append(keypoints_sequence)
                    labels.append(row['exercise_label'])
                    keypoints_sequence = []

        # If the sequence is shorter than the desired length, pad it with zeros
        if 0 < len(keypoints_sequence) < sequence_length:
            keypoints_sequence += [np.zeros_like(keypoints_sequence[0])] * (sequence_length - len(keypoints_sequence))
            sequences.append(keypoints_sequence)
            labels.append(row['exercise_label'])

    x = np.array(sequences)
    y = np.array(labels)

    return x, y
