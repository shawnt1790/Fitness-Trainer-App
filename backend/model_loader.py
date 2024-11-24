import tensorflow as tf
import tensorflow_hub as hub

def load_movenet_model():
  model = hub.load("C:/Users/shawn/Downloads/movenet")
  return model

def preprocess_image(image):
  '''Preprocess the image for MoveNet model.'''
  #resize image to 256x256 and cast into 32 bit integer type
  image = tf.image.resize_with_pad(image, 256, 256)
  image = tf.cast(image, dtype=tf.int32)
  return image

def augment_image(image):
  """Perform data augmentation on the image."""
  image = tf.image.random_flip_left_right(image)
  image = tf.image.random_brightness(image, max_delta=0.1)
  image = tf.image.random_contrast(image, lower=0.9, upper=1.1)
  return image

def extract_keypoints(movenet, image):
  '''Use MoveNet model to extract keypoints from an image'''
  #convert image into 32 bit floating point for movenet input
  inputs = tf.cast(image, dtype=tf.int32)[tf.newaxis, ...] #adds extra dimension to image tensor
  outputs = movenet.signatures['serving_default'](inputs)

  #get keypoints from the outputs, convert into 1 dimensional numpy array
  keypoints = outputs['output_0']
  return keypoints.numpy().flatten()