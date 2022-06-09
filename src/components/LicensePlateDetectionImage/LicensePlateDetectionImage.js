import React from "react";
import MagicDropzone from "react-magic-dropzone";
import "./LicensePlateDetectionImage.css";
import * as Constants from "../../constants";
import Canvas from "../Canvas/Canvas";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";

class LicensePlateDetectionImage extends React.Component {
  // declare dictionary which represent the state of the website page
  componentDidUpdate() {
    if (this.props.parentState.isDataReceived === true) {
      this.props.setIsDataReceived(false);
    }
  }

  state = {
    model: null,
    preview: "",
    predictions: [],
  };

  onDrop = (accepted, rejected, links) => {
    this.setState({ preview: accepted[0].preview || links[0] });
  };

  cropToCanvas = (image, canvas, ctx) => {
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    console.log("ctx = ", ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ratio = Math.min(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight
    );
    const newWidth = Math.round(naturalWidth * ratio);
    const newHeight = Math.round(naturalHeight * ratio);
    ctx.drawImage(
      image,
      0,
      0,
      naturalWidth,
      naturalHeight,
      (canvas.width - newWidth) / 2,
      (canvas.height - newHeight) / 2,
      newWidth,
      newHeight
    );
    console.log("new width new heigt = ", newHeight, newWidth);
  };

  onImageChange = (e) => {
    const canvas = this.props.canvasAnnotRef.current;
    const ctx = this.props.canvasAnnotRef.current.getContext("2d");
    this.cropToCanvas(e.target, canvas, ctx);
    let [modelWidth, modelHeight] =
      this.props.parentState.model.inputs[0].shape.slice(1, 3);

    const image = tf.tidy(() => {
      return tf.browser
        .fromPixels(canvas)
        .resizeBilinear([canvas.height, canvas.width])
        .toFloat();
    });

    console.log(image.shape);

    const tfImageForPrediction = tf.tidy(() => {
      return image
        .resizeBilinear([modelWidth, modelHeight])
        .toFloat()
        .div(255.0)
        .expandDims(0);
    });

    this.props.parentState.model
      .executeAsync(tfImageForPrediction)
      .then((res) => {
        // Font options.
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

        // result after inference
        const [boxes, scores, classes, _] = res;

        // dataSync() function just downloading the values get
        const boxesData = boxes.dataSync();
        const scoresData = scores.dataSync();
        const classesData = classes.dataSync();
        // const valid_detections_data = valid_detections.dataSync()[0];
        // dispose the unused tensor inside the res
        tf.dispose(res);

        const valid_detections_data = this.buildDetectedObjects(
          this.props.canvasAnnotRef.current,
          scoresData,
          boxesData,
          classesData,
          this.props.parentState.names
        );

        // Xs and Ys coordinate are normalized so needs to be scaled
        // by real width and height from the image received

        valid_detections_data.forEach((item) => {
          const ctx = this.props.canvasAnnotRef.current.getContext("2d");
          this.drawBoundingBox(item, ctx);
          this.drawText(item, ctx);
        });

        console.log(valid_detections_data[0]);
        // becase the license plate that is being detected will always at index 1
        this.processDetectedLicensePlate(
          this.extractData(valid_detections_data[0], image)
        );
      });
  };

  processDetectedLicensePlate = (data) => {
    tf.browser
      .toPixels(data["regionOfInterestArr"], this.props.canvasOutputRef.current)
      .then(() => {
        // It's not bad practice to clean up and make sure we got everything
        console.log("Make sure we cleaned up", tf.memory().numTensors);
      });

    console.log("test", {
      license_plate: JSON.stringify(data["regionOfInterestArr"]),
    });
    console.log(data["regionOfInterestArr"].print);

    // send data to flask
    // fetch
    this.props.setIsDataReceived(true);

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

  extractData = (item, image) => {
    let x = parseInt(item["bbox"][0].toFixed(0));
    // x -= 5;
    // check of the coordinate out of box or not
    if (x < 0) {
      x = 0;
    }
    console.log("x = ", x);

    let y = parseInt(item["bbox"][1].toFixed(0));
    // check of the coordinate out of box or not
    // y -= 5;
    if (y < 0) {
      y = 0;
    }

    console.log("y = ", y);

    let width = parseInt(item["bbox"][2].toFixed(0));
    // width += 10;
    if (x + width > this.props.canvasAnnotRef.current.width) {
      width = this.props.canvasAnnotRef.current.width - x;
    }
    console.log("width = ", this.props.canvasAnnotRef.current.width);

    let height = parseInt(item["bbox"][3].toFixed(0));
    // height += 10;

    if (y + height > this.props.canvasAnnotRef.current.height) {
      height = this.props.canvasAnnotRef.current.height - y;
    }
    console.log("height = ", this.props.canvasAnnotRef.current.height);

    let centerX = x + width / 2.0;
    let centerY = y + height / 2.0;

    const startingPoint = [y, x, 0];
    const newSize = [height, width, 3];
    const regionOfInterest = tf.slice(image, startingPoint, newSize);
    const regionOfInterestArr = regionOfInterest.arraySync();

    return { x, y, width, height, centerX, centerY, regionOfInterestArr };
  };

  buildDetectedObjects = (
    imageData,
    scoresData,
    boxesData,
    classesData,
    names
  ) => {
    const detectionObjects = [];
    console.log("scores data", scoresData);

    // Detail abput the function
    // array.forEach(function(currentValue, index, arr), thisValue)
    scoresData.forEach((score, i) => {
      if (score > Constants.THRESHOLD) {
        const bbox = [];
        let [minX, minY, maxX, maxY] = boxesData.slice(i * 4, (i + 1) * 4);
        minX *= imageData.width;
        minY *= imageData.height;
        maxX *= imageData.width;
        maxY *= imageData.height;

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

  render() {
    return (
      <div className="Dropzone-page">
        <h2 style={{ textAlign: "center" }}>Image</h2>
        {this.props.parentState.model ? (
          <MagicDropzone
            className="Dropzone"
            accept="image/jpeg, image/png, .jpg, .jpeg, .png"
            multiple={false}
            onDrop={this.onDrop}
          >
            {this.state.preview ? (
              <img
                alt="upload preview"
                onLoad={this.onImageChange}
                className="Dropzone-img"
                src={this.state.preview}
              />
            ) : (
              "Choose or drop a file."
            )}
            <Canvas id={"canvas"} canvasRef={this.props.canvasAnnotRef} />
          </MagicDropzone>
        ) : (
          <div className="Dropzone">Loading model...</div>
        )}
      </div>
    );
  }
}

export default LicensePlateDetectionImage;
