import React from "react";
import Canvas from "../../components/Canvas/Canvas";
import InferenceResult from "../../components/InferenceResult/InferenceResult";
import LicensePlateDetectionVideo from "../../components/LicensePlateDetectionVideo/LicensePlateDetectionVideo";
import ToggleSwitchButton from "../../components/ToggleSwitchButton/ToggleSwitchButton";
import LicensePlateDetectionImage from "../../components/LicensePlateDetectionImage/LicensePlateDetectionImage";
import * as Constants from "../../constants";
import * as tf from "@tensorflow/tfjs";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

class LicensePlateDetection extends React.Component {
  constructor(props) {
    super(props);
    // Setting up states
    this.state = {
      objects: {},
      names: ["license-plate"],
      disappeared: {},
      countSamePosition: {},
      nextObjectId: 0,
      currentImage: null,
      isDataReceived: false,
      inferenceResult: "",
      typeDataInput: "camera",
      model: null,
    };
    // Setting up refs
    this.videoRef = React.createRef();
    this.canvasAnnotRef = React.createRef();
    this.canvasOutputRef = React.createRef();
    this.prevObject = React.createRef();
  }

  componentDidMount() {
    tf.loadGraphModel(Constants.OBJ_DETECTION_MODEL_PATH).then((model) => {
      this.setState({
        model: model,
      });
    });
  }

  // reset state except model and typeDataInput
  reset = () => {
    this.setState({
      objects: {},
      names: ["license-plate"],
      disappeared: {},
      countSamePosition: {},
      nextObjectId: 0,
      currentImage: null,
      isDataReceived: false,
      inferenceResult: "",
    });
    this.videoRef = React.createRef();
    this.canvasAnnotRef = React.createRef();
    this.canvasOutputRef = React.createRef();
    this.prevObject = React.createRef();
  };

  // functions for updating states
  setIsDataReceived = (bool) => {
    this.setState({
      isDataReceived: bool,
    });
  };

  setCurrentImage = (image) => {
    this.setState({
      currentImage: image,
    });
  };

  setNextObjectId = () => {
    this.setState(() => ({
      nextObjectId: this.state.nextObjectId + 1,
    }));
  };

  setObjects = (newObjects) => {
    this.setState(() => ({
      objects: newObjects,
    }));
  };

  setDisappeared = (newDisappeared) => {
    this.setState({
      disappeared: newDisappeared,
    });
  };

  setCountSamePosition = (newCountSamePosition) => {
    this.setState({
      countSamePosition: newCountSamePosition,
    });
  };

  setInferenceResult = (newInferenceResult) => {
    this.setState({
      inferenceResult: newInferenceResult,
    });
  };

  changeTypeDataInput = () => {
    this.setState({
      typeDataInput: this.state.typeDataInput === "camera" ? "image" : "camera",
    });
    this.reset();
  };

  render() {
    return (
      <div>
        <div>
          <div className="liveheader">
            <h1>Live Camera Feed</h1>
          </div>
          <ToggleSwitchButton
            label="Change Data Input"
            changeTypeDataInput={this.changeTypeDataInput}
          />
          <div className="video-wrapper">
            {this.state.model ? (
              <div>
                {this.state.typeDataInput === "camera" ? (
                  <LicensePlateDetectionVideo
                    // passin states
                    parentState={this.state}
                    // passing functions
                    setIsDataReceived={this.setIsDataReceived}
                    setCurrentImage={this.setCurrentImage}
                    setNextObjectId={this.setNextObjectId}
                    setObjects={this.setObjects}
                    setDisappeared={this.setDisappeared}
                    setCountSamePosition={this.setCountSamePosition}
                    setInferenceResult={this.setInferenceResult}
                    // passing refs
                    videoRef={this.videoRef}
                    canvasAnnotRef={this.canvasAnnotRef}
                    canvasOutputRef={this.canvasOutputRef}
                    prevObject={this.prevObject}
                  />
                ) : (
                  <LicensePlateDetectionImage
                    // passing functions
                    setIsDataReceived={this.setIsDataReceived}
                    setInferenceResult={this.setInferenceResult}
                    parentState={this.state}
                    canvasAnnotRef={this.canvasAnnotRef}
                    canvasOutputRef={this.canvasOutputRef}
                  />
                )}
              </div>
            ) : (
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress style={{color: "#D3B016"}}/>
              </Box>
            )}
            <div className="inference-result">
              <h2 style={{ textAlign: "center" }}>Information</h2>
              <InferenceResult
                inferenceResult={this.state.inferenceResult}
                location={"Senayan City Mall"}
                licensePlatePicture={
                  <Canvas canvasRef={this.canvasOutputRef} />
                }
                isDataReceived={this.state.isDataReceived}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LicensePlateDetection;