import React, { Component } from 'react'
import './App.css'

import AudioReactRecorder, { RecordState } from './Recorder'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      recordState: null,
      canvasWidth: 500,
      canvasHeight: 300,
    }
  }

  componentDidMount = () => {

    this.setState({
      recordState: RecordState.START,
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
    })

  }

  start = () => {
    this.setState({
      recordState: RecordState.START
    })
  }

  stop = () => {
    this.setState({
      recordState: RecordState.STOP
    })
  }

  //audioData contains blob and blobUrl
  onStop = (audioData) => {
    this.setState({
      recordState: RecordState.STOP
    })
  }

  render() {
    const { canvasHeight, canvasWidth, recordState } = this.state

    const backgroundColor = "rgb(15,18,23)"

    return (
      <div
        style={{
          backgroundColor,
        }}
      >
        <AudioReactRecorder
          canvasHeight={canvasHeight}
          canvasWidth={canvasWidth}
          backgroundColor={backgroundColor}
          foregroundColor="rgb(185,215,124)"
          state={recordState}
          onStop={this.onStop}
        />

        <button onClick={this.start}>Start</button>
        <button onClick={this.stop}>Stop</button>
      </div>
    )
  }
}

export default App;
