import {useEffect, useState} from "react"
import React from "react"

export class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: this.props.message}
  }

  render(){
    return (
      <div id="output">
      <h1>{this.state.text}</h1>
      </div>
    );
  }
}

