/* eslint-disable no-useless-constructor */
import React from "react";

class InferenceResult extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="inference-result__content">
        <div style={{ height: "20%" }}>
          <h3>License Plate Picture: </h3>
          <div>{this.props.licensePlatePicture}</div>
        </div>
        <div style={{ height: "20%" }}>
          <h3>Inference Result: </h3>
          <div>{this.props.inferenceResult}</div>
        </div>
      </div>
    );
  }
}
export default InferenceResult;
