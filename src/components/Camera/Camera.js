import React from "react";
class Camera extends React.Component {
  render() {
    return (
      <video
        className={this.props.className}
        autoPlay
        playsInline
        muted
        ref={this.props.videoRef}
        id="frame"
      />
    );
  }
}
export default Camera;
