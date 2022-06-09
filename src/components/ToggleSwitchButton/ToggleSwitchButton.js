import React, { Component } from 'react'
import "./ToggleSwitchButton.css";

class ToggleSwitchButton extends Component {
  render() {
    return (
      <div className="container">
      {this.props.label}{" "}
      <div className="toggle-switch">
        <input type="checkbox" className="checkbox" 
               name={this.props.label} id={this.props.label} onChange={this.props.changeTypeDataInput}/>
        <label className="label" htmlFor={this.props.label}>
          <span className="inner" />
          <span className="switch" />
        </label>
      </div>
    </div>
    )
  }
}
  
export default ToggleSwitchButton;