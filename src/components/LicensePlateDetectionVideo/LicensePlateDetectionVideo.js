import React, { Component } from "react";
import * as tf from "@tensorflow/tfjs";
import Camera from "../Camera/Camera";
import Canvas from "../Canvas/Canvas";
import * as Constants from "../../constants";
import axios from "axios";
import "./LicensePlateDetectionVideo.css";

class LicensePlateDetectionVideo extends Component {
  // invoke as soon as the compoenents is mounted (inserted to the tree)
  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            mirrored: true,
          },
        })
        .then((stream) => {
          window.stream = stream;
          this.props.videoRef.current.srcObject = stream;
          try {
            return new Promise((resolve, reject) => {
              this.props.videoRef.current.onloadedmetadata = () => {
                resolve();
              };
            });
          } catch (error) {
            return console.log(error);
          }
        });

      const modelPromise = this.props.parentState.model;

      Promise.all([modelPromise, webCamPromise])
        .then((values) => {
          this.detectFrame(this.props.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  componentDidUpdate() {
    if (this.props.parentState.isDataReceived === true) {
      this.props.setIsDataReceived(false);
    }
  }

  // ###################################################################################################
  detectFrame = (video, model) => {
    // startScope() and endScope() clean up unused tensor
    tf.engine().startScope();
    model.executeAsync(this.processInput(video)).then((predictions) => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });

      // startScope() and endScope() clean up unused tensor
      tf.engine().endScope();
    });
  };

  processInput = (videoFrame) => {
    if (videoFrame) {
      const image = tf.browser
        .fromPixels(videoFrame)
        .resizeBilinear([
          this.props.videoRef.current.offsetHeight,
          this.props.videoRef.current.offsetWidth,
        ])
        .toFloat();
      // result shape: [height, width, channels]

      // update the image
      this.props.setCurrentImage(image);

      // resize and normalized image expand the dimension by 1 so that
      // it can be input to the object detection model
      const tfImg = image
        .resizeBilinear([Constants.WIDTH, Constants.HEIGHT])
        .toFloat();
      const normalizedTfImg = tfImg.div(255.0);
      const expandedimg = normalizedTfImg.expandDims(0);
      return expandedimg;
    }
  };

  renderPredictions = (predictions) => {
    // get canvas element and resize according to camera size\
    // so that it the annotation will fit perfectly
    const canvas = this.props.canvasAnnotRef.current;
    canvas.width = this.props.videoRef.current.offsetWidth;
    canvas.height = this.props.videoRef.current.offsetHeight;

    // get context for drawing
    const ctx = this.props.canvasAnnotRef.current.getContext("2d");

    // console.log(this.videoRef.current.width, this.videoRef.current.height);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    const [boxes, scores, classes, _] = predictions;

    //Getting predictions
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();

    const valid_detections_data = this.buildDetectedObjects(
      this.props.videoRef.current,
      scoresData,
      boxesData,
      classesData,
      this.props.parentState.names
    );

    this.update(valid_detections_data);

    valid_detections_data.forEach((item) => {
      const ctx = this.props.canvasAnnotRef.current.getContext("2d");
      this.drawBoundingBox(item, ctx);
      this.drawText(item, ctx);
    });
  };

  // extract and process information to dictionary form
  buildDetectedObjects = (
    videoFrame,
    scoresData,
    boxesData,
    classesData,
    names
  ) => {
    const detectionObjects = [];

    // Detail abput the function
    // array.forEach(function(currentValue, index, arr), thisValue)
    scoresData.forEach((score, i) => {
      if (score > Constants.THRESHOLD) {
        const bbox = [];
        let [minX, minY, maxX, maxY] = boxesData.slice(i * 4, (i + 1) * 4);
        minX *= videoFrame.offsetWidth;
        minY *= videoFrame.offsetHeight;
        maxX *= videoFrame.offsetWidth;
        maxY *= videoFrame.offsetHeight;

        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        detectionObjects.push({
          class: classesData[i],
          label: names[classesData[i]],
          score: score.toFixed(2),
          bbox: bbox,
        });
      }
    });

    return detectionObjects;
  };

  drawBoundingBox = (item, ctx) => {
    const x = item["bbox"][0];
    const y = item["bbox"][1];
    const width = item["bbox"][2];
    const height = item["bbox"][3];

    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    // Draw the bounding box.
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    // Draw the label background.
    ctx.fillStyle = "#00FFFF";
    const textWidth = ctx.measureText(
      item["label"] + " " + (100 * item["score"]).toFixed(2) + "%"
    ).width;
    const textHeight = parseInt(font, 10); // base 10
    ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
  };

  drawText = (item, ctx) => {
    const x = item["bbox"][0];
    const y = item["bbox"][1];

    // draw text
    ctx.fillStyle = "#000000";
    ctx.fillText(
      item["label"] + " " + (100 * item["score"]).toFixed(2) + "%",
      x,
      y
    );
  };
  // ###################################################################################################

  addObj = (data) => {
    // add objectc
    const copyObjects = { ...this.props.parentState.objects };
    copyObjects[this.props.parentState.nextObjectId] = {
      x: data["x"],
      y: data["y"],
      width: data["width"],
      height: data["height"],
      centerX: data["centerX"],
      centerY: data["centerY"],
      regionOfInterestArr: data["regionOfInterestArr"],
    };
    this.props.prevObject.current =
      copyObjects[this.props.parentState.nextObjectId];

    // add disappeared
    const copyDisappeared = { ...this.props.parentState.disappeared };
    copyDisappeared[this.props.parentState.nextObjectId] = 0;

    // add disappeared
    const copyCountSamePosition = {
      ...this.props.parentState.countSamePosition,
    };
    copyCountSamePosition[this.props.parentState.nextObjectId] = 0;

    this.props.setNextObjectId();
    this.props.setObjects(copyObjects);
    this.props.setDisappeared(copyDisappeared);
    this.props.setCountSamePosition(copyCountSamePosition);
  };

  updateObj = (data, objectId) => {
    // add objectc
    const copyObjects = { ...this.props.parentState.objects };
    copyObjects[objectId] = {
      x: data["x"],
      y: data["y"],
      width: data["width"],
      height: data["height"],
      centerX: data["centerX"],
      centerY: data["centerY"],
      regionOfInterestArr: data["regionOfInterestArr"],
    };
    this.props.prevObject.current = copyObjects[objectId];

    // add disappeared
    const copyDisappeared = { ...this.props.parentState.disappeared };
    copyDisappeared[objectId] = 0;

    this.props.setObjects(copyObjects);
    this.props.setDisappeared(copyDisappeared);
  };

  removeObj = (objectId) => {
    // delete objects element based on key from objectId argument
    const copyObjects = { ...this.props.parentState.objects };
    delete copyObjects[objectId];
    this.props.prevObject.current = null;

    // delete disappeared element based on key from objectId argument
    const copyDisappeared = { ...this.props.parentState.disappeared };
    delete copyDisappeared[objectId];

    const copyCountSamePosition = {
      ...this.props.parentState.countSamePosition,
    };
    delete copyCountSamePosition[objectId];

    this.props.setObjects(copyObjects);
    this.props.setDisappeared(copyDisappeared);
    this.props.setCountSamePosition(copyCountSamePosition);
  };

  processDetectedLicensePlate = (data) => {
    tf.browser
      .toPixels(data["regionOfInterestArr"], this.props.canvasOutputRef.current)
      .then(() => {
        // It's not bad practice to clean up and make sure we got everything
        console.log("Make sure we cleaned up", tf.memory().numTensors);
      });
    // function hans
    // function bintang


    // send data to flask
    // fetch

    const body = { "license-plate": data["regionOfInterestArr"] };
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };
    axios
      .post("https://vepay-go.uc.r.appspot.com", body, {
        headers: headers,
      })
      .then((response) => {
        // update the inference result
        this.props.setInferenceResult(response.data["prediction"]);
        this.props.setIsDataReceived(true);
      });
    
    
    // axios
    //   .post("https://vepay-go.uc.r.appspot.com", body, {
    //     headers: headers,
    //   })
    //   .then((response) => {
    //     // update the inference result
    //     this.props.setInferenceResult(response.data["prediction"]);
    //   });
  };

  update = (valid_detections_data) => {
    if (!valid_detections_data.length) {
      // copy the disappeared dictionary
      let copyDisappeared = { ...this.props.parentState.disappeared };
      // increment each value
      for (let objectId in copyDisappeared) {
        copyDisappeared[objectId]++;
        this.props.setDisappeared(copyDisappeared);
        // check if the value has reach maxFrameDisappeared
        if (copyDisappeared[objectId] >= Constants.MAXFRAMEDISAPPEARED) {
          this.removeObj(objectId);
        }
      }
      return;
    }
    // adding centroid for every newly detected objects from Yolov5
    let inputData = [];
    for (let item of valid_detections_data) {
      inputData.push(this.extractData(item));
    }

    let countExistingObjects = Object.keys(
      this.props.parentState.objects
    ).length;

    // check if current obejcts are emtpy
    // if "true" than all of the detected objects are still
    // just add them all.
    if (!countExistingObjects) {
      for (let data of inputData) {
        this.addObj(data);
      }
    }
    // if "false" calculate euclesian distance for each new detected objects with the previous objects.
    // update the previous objects centroid with the new one that is closed.
    else {
      // console.log("masuk sene");
      let distances = {};
      for (let key in this.props.parentState.objects) {
        distances[key] = [];
        for (let inputCentroid of inputData) {
          const currObject = this.props.parentState.objects[key];
          distances[key].push(
            this.calculateEucledianDistance(inputCentroid, currObject)
          );
        }
      }

      for (let key in distances) {
        const argSortedDistances = distances[key]
          .map((val, ind) => {
            return { ind, val };
          })
          .sort((a, b) => {
            return a.val > b.val ? 1 : a.val === b.val ? 0 : -1;
          })
          .map((obj) => obj.ind);
        const currObject = inputData[argSortedDistances[0]];

        if (this.props.prevObject.current != null) {
          if (
            this.calculateEucledianDistance(
              this.props.prevObject.current,
              currObject
            ) < 30
          ) {
            let copyCountSamePosition = {
              ...this.props.parentState.countSamePosition,
            };
            copyCountSamePosition[key]++;
            this.props.setCountSamePosition(copyCountSamePosition);
            if (
              copyCountSamePosition[key] === Constants.MAXFRAMEFORPROCESSING
            ) {
              this.processDetectedLicensePlate(currObject);
            }
          }
        }
        this.updateObj(inputData[argSortedDistances[0]], key);
      }
    }
  };

  extractData = (item) => {
    let x = parseInt(item["bbox"][0].toFixed(0));
    x -= 5;
    // check of the coordinate out of box or not
    if (x < 0) {
      x = 0;
    }
    console.log("x = ", x);

    let y = parseInt(item["bbox"][1].toFixed(0));
    // check of the coordinate out of box or not
    // y -= 20;
    if (y < 0) {
      y = 0;
    }

    console.log("y = ", y);

    let width = parseInt(item["bbox"][2].toFixed(0));
    width += 10;
    if (x + width > this.props.videoRef.current.offsetWidth) {
      width = this.props.videoRef.current.offsetWidth - x;
    }
    console.log("width = ", this.props.videoRef.current.offsetWidth);

    let height = parseInt(item["bbox"][3].toFixed(0));
    // height += 40;

    if (y + height > this.props.videoRef.current.offsetHeight) {
      height = this.props.videoRef.current.offsetHeight - y;
    }
    console.log("height = ", this.props.videoRef.current.offsetHeight);

    let centerX = x + width / 2.0;
    let centerY = y + height / 2.0;

    const image = this.props.parentState.currentImage;
    console.log(image.shape);
    const startingPoint = [y, x, 0];
    const newSize = [height, width, 3];
    const regionOfInterest = tf.slice(image, startingPoint, newSize);
    const regionOfInterestArr = regionOfInterest.arraySync();

    return { x, y, width, height, centerX, centerY, regionOfInterestArr };
  };

  calculateEucledianDistance = (x1_y1, x2_y2) => {
    const deltaXSquared = (x1_y1["centerX"] - x2_y2["centerX"]) ** 2;
    const deltaYSquared = (x1_y1["centerY"] - x2_y2["centerY"]) ** 2;
    return (deltaXSquared + deltaYSquared) ** (1 / 2);
  };

  render() {
    return (
      <div className="video-container" id="video-container">
        <h2 style={{ textAlign: "center" }}>Camera</h2>
        <div className="license-plate-detection-container">
          <Camera className={"camera"} videoRef={this.props.videoRef} />
          <Canvas className={"canvas"} canvasRef={this.props.canvasAnnotRef} />
        </div>
      </div>
    );
  }
}

export default LicensePlateDetectionVideo;
