import React from "react";
import Canvas from "../../components/Canvas/Canvas";
import InferenceResult from "../../components/InferenceResult/InferenceResult";
import LicensePlateDetectionVideo from "../../components/LicensePlateDetectionVideo/LicensePlateDetectionVideo";
import LicensePlateDetectionImage from "../../components/LicensePlateDetectionImage/LicensePlateDetectionImage";
import * as Constants from "../../constants";
import * as tf from "@tensorflow/tfjs";
import {
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Badge,
  Stack,
  Form,
} from "react-bootstrap";

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
    this.prevObject = React.createRef();
  };

  // clear canvas
  clearCanvas = () => {
    let canvas = this.canvasAnnotRef.current;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    canvas = this.canvasOutputRef.current;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
    this.clearCanvas();
  };

  render() {
    return (
      <div>
        <Container>
          <Row style={{ textAlign: "center" }}>
            <h1>Live Camera Feed</h1>
          </Row>
          <Row>
            <Stack
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div>
                <h2>
                  <Badge bg="secondary">Input Data</Badge>
                </h2>
              </div>
              <div>
                <Form.Check
                  type="switch"
                  label={this.state.typeDataInput}
                  onClick={this.changeTypeDataInput}
                />
              </div>
            </Stack>
          </Row>
          <Row>
            <Col>
              <Card
                className="border-0"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
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
                  <Spinner animation="border" variant="secondary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                )}
              </Card>
            </Col>
            <Col>
              <Card className="border-0">
                <h2 style={{ textAlign: "center" }}>Information</h2>
                <InferenceResult
                  inferenceResult={this.state.inferenceResult}
                  location={"Senayan City Mall"}
                  licensePlatePicture={
                    <Canvas canvasRef={this.canvasOutputRef} />
                  }
                  isDataReceived={this.state.isDataReceived}
                />
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default LicensePlateDetection;
