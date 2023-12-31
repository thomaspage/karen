import React from 'react';
import PropTypes from 'prop-types';

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}


// Asynchronously call a function and send errors to recovery continuation
function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

var RecordState = Object.freeze({
  START: 'start',
  PAUSE: 'pause',
  STOP: 'stop',
  NONE: 'none'
});

var AudioReactRecorder = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(AudioReactRecorder, _React$Component);

  function AudioReactRecorder(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;

    _this.init = function () {
      try {
        _this.leftchannel = [];
        _this.rightchannel = [];
        _this.recorder = null;
        _this.recording = false;
        _this.recordingLength = 0;
        _this.volume = null;
        _this.audioInput = null;
        _this.sampleRate = null;
        _this.AudioContext = window.AudioContext || window.webkitAudioContext;
        _this.context = null;
        _this.analyser = null;
        _this.canvas = _this.canvasRef.current;
        _this.canvasCtx = _this.canvas.getContext('2d');
        _this.stream = null;
        _this.tested = false;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _this.getStream = function (constraints) {
      if (!constraints) {
        constraints = {
          audio: true,
          video: false
        };
      }

      return navigator.mediaDevices.getUserMedia(constraints);
    };

    _this.setUpRecording = function () {
      _this.context = new _this.AudioContext();
      _this.sampleRate = _this.context.sampleRate;
      _this.volume = _this.context.createGain();
      _this.audioInput = _this.context.createMediaStreamSource(_this.stream);
      _this.analyser = _this.context.createAnalyser();

      _this.audioInput.connect(_this.analyser);

      var bufferSize = 2048;
      _this.recorder = _this.context.createScriptProcessor(bufferSize, 2, 2);

      _this.analyser.connect(_this.recorder);

      _this.recorder.connect(_this.context.destination);

      var self = _assertThisInitialized(_this);

      _this.recorder.onaudioprocess = function (e) {
        if (!self.recording) return;
        var left = e.inputBuffer.getChannelData(0);
        var right = e.inputBuffer.getChannelData(1);

        if (!self.tested) {
          self.tested = true;

          if (!left.reduce(function (a, b) {
            return a + b;
          })) {
            console.log('Error: There seems to be an issue with your Mic');
            self.stop();
            self.stream.getTracks().forEach(function (track) {
              track.stop();
            });
          }
        }

        self.leftchannel.push(new Float32Array(left));
        self.rightchannel.push(new Float32Array(right));
        self.recordingLength += bufferSize;
      };

      _this.visualize();
    };

    _this.mergeBuffers = function (channelBuffer, recordingLength) {
      var result = new Float32Array(recordingLength);
      var offset = 0;
      var lng = channelBuffer.length;

      for (var i = 0; i < lng; i++) {
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
      }

      return result;
    };

    _this.interleave = function (leftChannel, rightChannel) {
      var length = leftChannel.length + rightChannel.length;
      var result = new Float32Array(length);
      var inputIndex = 0;

      for (var index = 0; index < length;) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
      }

      return result;
    };

    _this.writeUTFBytes = function (view, offset, string) {
      var lng = string.length;

      for (var i = 0; i < lng; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    _this.visualize = function () {
      var _this$props = _this.props,
          backgroundColor = _this$props.backgroundColor,
          foregroundColor = _this$props.foregroundColor;
      _this.WIDTH = _this.canvas.width;
      _this.HEIGHT = _this.canvas.height;
      _this.CENTERX = _this.canvas.width / 2;
      _this.CENTERY = _this.canvas.height / 2;
      if (!_this.analyser) return;
      _this.analyser.fftSize = 512;
      var bufferLength = _this.analyser.fftSize;
      var dataArray = new Uint8Array(bufferLength);

      _this.canvasCtx.clearRect(0, 0, _this.WIDTH, _this.HEIGHT);

      var self = _assertThisInitialized(_this);

      var draw = function draw() {
        self.drawVisual = requestAnimationFrame(draw);
        self.analyser.getByteTimeDomainData(dataArray);
        self.canvasCtx.fillStyle = backgroundColor;
        self.canvasCtx.fillRect(0, 0, self.WIDTH, self.HEIGHT);
        self.canvasCtx.lineWidth = 4;
        self.canvasCtx.strokeStyle = foregroundColor;
        self.canvasCtx.beginPath();
        var sliceWidth = self.WIDTH * 1.0 / bufferLength;
        var x = 0;

        var straightLine = dataArray.every(point => point < 132)
        
        for (var i = 0; i < bufferLength; i++) {
        //   var multiplier = Math.abs((i - bufferLength / 2) / bufferLength)
            var y
          if (straightLine) {
            y = self.HEIGHT / 2
          } else {
            var v = dataArray[i] / 128.0;

            var multiplier = - 2 * (i**3) * (i - bufferLength)**3 / ((bufferLength / 2) ** 6)
  
            // v = [0.9, 1, 1.1]
            y = multiplier * v * self.HEIGHT / 2 + (self.HEIGHT / 2 - multiplier * self.HEIGHT / 2)
  
          }

          if (i === 0) {
            self.canvasCtx.moveTo(x, y);
          } else {
            self.canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        self.canvasCtx.lineTo(self.canvas.width, self.canvas.height / 2);
        self.canvasCtx.stroke();
      };

      draw();
    };

    _this.setupMic = function () {
      try {
        var _temp3 = function _temp3() {
          _this.setUpRecording();
        };

        var _temp4 = _catch(function () {
          return Promise.resolve(_this.getStream()).then(function (_this$getStream) {
            window.stream = _this.stream = _this$getStream;
          });
        }, function (err) {
          console.log('Error: Issue getting mic', err);
        });

        return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp3) : _temp3(_temp4));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _this.start = function () {
      try {
        return Promise.resolve(_this.setupMic()).then(function () {
          _this.recording = true;
          _this.leftchannel.length = _this.rightchannel.length = 0;
          _this.recordingLength = 0;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _this.stop = function () {
      var _this$props2 = _this.props,
          onStop = _this$props2.onStop,
          type = _this$props2.type;
      _this.recording = false;

      _this.closeMic();

      _this.leftBuffer = _this.mergeBuffers(_this.leftchannel, _this.recordingLength);
      _this.rightBuffer = _this.mergeBuffers(_this.rightchannel, _this.recordingLength);

      var interleaved = _this.interleave(_this.leftBuffer, _this.rightBuffer);

      var buffer = new ArrayBuffer(44 + interleaved.length * 2);
      var view = new DataView(buffer);

      _this.writeUTFBytes(view, 0, 'RIFF');

      view.setUint32(4, 44 + interleaved.length * 2, true);

      _this.writeUTFBytes(view, 8, 'WAVE');

      _this.writeUTFBytes(view, 12, 'fmt ');

      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 2, true);
      view.setUint32(24, _this.sampleRate, true);
      view.setUint32(28, _this.sampleRate * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);

      _this.writeUTFBytes(view, 36, 'data');

      view.setUint32(40, interleaved.length * 2, true);
      var lng = interleaved.length;
      var index = 44;
      var volume = 1;

      for (var i = 0; i < lng; i++) {
        view.setInt16(index, interleaved[i] * (0x7fff * volume), true);
        index += 2;
      }

      var blob = new Blob([view], {
        type: type
      });
      var audioUrl = URL.createObjectURL(blob);
      onStop && onStop({
        blob: blob,
        url: audioUrl,
        type: type
      });
    };

    _this.pause = function () {
      _this.recording = false;

      _this.closeMic();
    };

    _this.resume = function () {
      _this.setupMic();

      _this.recording = true;
    };

    _this.closeMic = function () {
      _this.stream.getAudioTracks().forEach(function (track) {
        track.stop();
      });

      _this.audioInput.disconnect(0);

      _this.analyser.disconnect(0);

      _this.recorder.disconnect(0);
    };

    _this.canvasRef = React.createRef();
    return _this;
  }

  var _proto = AudioReactRecorder.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.init();
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
    var state = this.props.state;
    this.checkState(prevProps.state, state);
  };

  _proto.checkState = function checkState(previousState) {
    switch (previousState) {
      case RecordState.START:
        this.doIfState(RecordState.PAUSE, this.pause);
        this.doIfState(RecordState.STOP, this.stop);
        break;

      case RecordState.PAUSE:
        this.doIfState(RecordState.START, this.resume);
        this.doIfState(RecordState.STOP, this.stop);
        break;

      case RecordState.STOP:
        this.doIfState(RecordState.START, this.start);
        break;

      default:
        this.doIfState(RecordState.START, this.start);
        break;
    }
  };

  _proto.doIfState = function doIfState(state, cb) {
    if (this.props.state === state) {
      cb && cb();
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {};

  _proto.render = function render() {
    var _this$props3 = this.props,
        canvasWidth = _this$props3.canvasWidth,
        canvasHeight = _this$props3.canvasHeight;
    return /*#__PURE__*/React.createElement("div", {
      className: "audio-react-recorder"
    }, /*#__PURE__*/React.createElement("canvas", {
      ref: this.canvasRef,
      width: canvasWidth,
      height: canvasHeight,
      className: "audio-react-recorder__canvas"
    }));
  };

  return AudioReactRecorder;
}(React.Component);

AudioReactRecorder.propTypes = {
  state: PropTypes.string,
  type: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  foregroundColor: PropTypes.string,
  canvasWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  canvasHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onStop: PropTypes.func
};
AudioReactRecorder.defaultProps = {
  state: RecordState.NONE,
  type: 'audio/wav',
  backgroundColor: 'rgb(200, 200, 200)',
  foregroundColor: 'rgb(0, 0, 0)',
  canvasWidth: 500,
  canvasHeight: 300
};

export default AudioReactRecorder;
export { RecordState };
//# sourceMappingURL=index.modern.js.map
