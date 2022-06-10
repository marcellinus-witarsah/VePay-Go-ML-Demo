import cv2
import numpy as np
from pathlib import Path
import os
import tensorflow as tf
import shutil

width = 400
height = 220


def detect_chars(img, showSteps=False):
    """
    This function will receive an argument img which is an array of pixels which will be
    processed and return array of character
    """
    
    image = np.array(img, np.uint8)
    image = cv2.resize(image, (width, height))

    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    gray = 255-gray
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 37, 25)

    thresh = cv2.erode(thresh, (3, 3))
    thresh = cv2.dilate(thresh, (3, 3))
    thresh = cv2.dilate(thresh, (3, 3))
    thresh = cv2.erode(thresh, (3, 3))

    _, labels = cv2.connectedComponents(thresh)

    mask = np.zeros(thresh.shape, dtype="uint8")

    # Set lower bound and upper bound criteria for characters
    total_pixels = image.shape[0] * image.shape[1]
    lower = total_pixels // 200  # heuristic param, can be fine tuned if necessary
    upper = total_pixels // 20  # heuristic param, can be fine tuned if necessary
    # Loop over the unique components
    for (i, label) in enumerate(np.unique(labels)):
        # If this is the background label, ignore it
        if label == 0:
            continue

        # Otherwise, construct the label mask to display only connected component
        # for the current label
        labelMask = np.zeros(thresh.shape, dtype="uint8")
        labelMask[labels == label] = 255
        numPixels = cv2.countNonZero(labelMask)

        # If the number of pixels in the component is between lower bound and upper bound,
        # add it to our mask
        if numPixels > lower and numPixels < upper:
            mask = cv2.add(mask, labelMask)


    if showSteps == True:
        cv2.imshow("thresh", thresh)
        cv2.imshow("gray", gray)
        cv2.imshow("mask", mask)
    # Find contours and get bounding box for each contour
    cnts, _ = cv2.findContours(
        mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boundingBoxes = [cv2.boundingRect(c) for c in cnts]

    def takeXelement(elem):
        return elem[0]
    boundingBoxes.sort(key=takeXelement)

    detected_char_list = []
    new_mask = mask.copy()
    i = 0
    for c in boundingBoxes:
        x, y, w, h = c
        # check if x, y, w, h are out of bounds
        x = x-5
        if x < 0:
            x = 0

        y = y-5
        if y < 0:
            y = 0

        w = w+5
        if x+w > width:
            w = width-x
        
        h = h+5
        if y+h > height:
            h = height-y

        if x > 5 and x < 395 and y > 10 and y < 210 and h > 70 and h < 200 and w < 100:
            cv2.rectangle(new_mask, (x, y), (x+w, y+h), (0, 0, 0), 3)
            char = np.array(new_mask[y:y+h, x:x+w], np.uint8)
            char_resize = cv2.resize(char, (64, 64))
            detected_char_list.append(char_resize)

    return detected_char_list

# import the model
def prepare_model(model_path):
    """
    This function will receive an argument model_path which is the path of .h5 model
    """
    imported_model = tf.keras.models.load_model(model_path)
    return imported_model

# predict using the model and data
def predict_characters(model, data):
    """
    This function will receive an argument model which will be used for predicting and 
    data which is an array of characters that will be predicted by the model.
    """
    characters = ''
    dictionary = {0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'A',
                  11: 'B', 12: 'C', 13: 'D', 14: 'E', 15: 'F', 16: 'G', 17: 'H', 18: 'I', 19: 'J', 20: 'K',
                  21: 'L', 22: 'M', 23: 'N', 24: 'O', 25: 'P', 26: 'Q', 27: 'R', 28: 'S', 29: 'T',
                  30: 'U', 31: 'V', 32: 'W', 33: 'X', 34: 'Y', 35: 'Z'}
    for arr in data:
        x = tf.convert_to_tensor(arr)
        x = tf.expand_dims(x, axis=0)
        classes = model.predict(x, batch_size=10)
        index = int(np.argmax(classes))
        characters += dictionary[index]

    return characters
