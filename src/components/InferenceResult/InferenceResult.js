/* eslint-disable no-useless-constructor */
import React from "react";
import { Stack, Card } from "react-bootstrap";

class InferenceResult extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div>
        <Stack gap={2}>
          <div style={{ height: "20%" }}>
            <h3>License Plate Picture: </h3>
            <div>{this.props.licensePlatePicture}</div>
          </div>
          <div style={{ height: "20%" }}>
            <h3>Inference Result: </h3>
            <div>{this.props.inferenceResult}</div>
          </div>
        </Stack>
      </div>
    );
  }
}
export default InferenceResult;
