import { escape } from "@microsoft/sp-lodash-subset";
import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";

var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var pc: any = new RTCPeerConnection(null);
var dc: any;
var val;

pc.onicecandidate = function(e) {
  console.log("1");
  if (e.candidate) return;
  console.log("2");

  console.log(dc);
  val = JSON.stringify(pc.localDescription);
};

var sendMSG = function() {
  var value = "labasaaaaa";
  if (value) {
    dc.send(value);
  }
};

// dc.onopen = function(e) {
//   console.log("Channel open");
// };

interface IState {
  start: boolean;
  join: boolean;
  opponentID: string;
  createSDPval: string;
  offerSDP: string;
}

export default class TicTacToe extends React.Component<
  ITicTacToeProps,
  IState
> {
  constructor(props) {
    super(props);
    this.state = {
      start: false,
      join: false,
      opponentID: "",
      createSDPval: "",
      offerSDP: ""
    };
    this.handleClick = this.handleClick.bind(this);
    this.createAnswerFromOffer = this.createAnswerFromOffer.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
    this.handleOpponentSDP = this.handleOpponentSDP.bind(this);
    this.start = this.start.bind(this);
  }

  handleClick(e) {
    console.log(e.target.id);

    if (e.target.id == "start") {
      this.setState({
        start: !this.state.start
      });
      this.createOffer();
    }
    if (e.target.id == "join") {
      this.setState({
        join: !this.state.join
      });
    }
    if (e.target.id == "submitID") {
      this.setState({
        opponentID: (document.getElementById("opponentID") as HTMLInputElement)
          .value as string
      });
    }
    console.log(this.state);
  }

  createOffer() {
    dc = pc.createDataChannel("chat");
    pc.createOffer()
      .then(function(offer) {
        return pc.setLocalDescription(offer);
        console.log(offer);
      })
      .then(() =>
        this.setState({
          createSDPval: JSON.stringify(pc.localDescription)
        })
      );
    dc.onopen = function() {
      console.log(dc);
    };
    // dc.onmessage = function(e) {
    //   if (e.data) addMSG(e.data, "other");
    // };
  }

  dcInit(dc) {
    dc.onopen = function() {
      console.warn("Connected");
    };
    dc.onmessage = function(e) {
      if (e.data) console.log(e.data);
    };
  }

  createAnswerSDP() {
    var offerDesc = new RTCSessionDescription(JSON.parse(this.state.offerSDP));
    console.log(offerDesc);
    pc.ondatachannel = function(e) {
      dc = e.channel;
      this.dcInit(dc);
    };

    pc.setRemoteDescription(offerDesc);
    pc.createAnswer()
      .then(function(answer) {
        return pc.setLocalDescription(answer);
      })
      .then(() =>
        this.setState({
          createSDPval: JSON.stringify(pc.localDescription)
        })
      )
      .catch(err => console.warn(err));
  }

  createAnswerFromOffer(event) {
    this.setState({
      offerSDP: event.target.value
    });
    console.log(this.state);
  }

  handleOpponentSDP(event) {
    this.setState({
      opponentID: event.target.value
    });
  }

  start() {
    var answerSDP = this.state.opponentID;
    var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
    pc.setRemoteDescription(answerDesc);
    sendMSG();
  }

  public render(): React.ReactElement<ITicTacToeProps> {
    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <button id='start' onClick={this.handleClick}>
              Create
            </button>
            <button id='join' onClick={this.handleClick}>
              Join
            </button>
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <textarea
                    id='createSDP'
                    placeholder='Your SDP'
                    readOnly
                    value={this.state.createSDPval}
                  />
                  <button id='startBtn' onClick={this.start}>
                    Start
                  </button>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
                    value={this.state.opponentID}
                    onChange={this.handleOpponentSDP}
                  />
                </div>
              ) : null}
              {this.state.join ? (
                <div>
                  <textarea
                    id='offerSDP'
                    placeholder='Paste offer SDP'
                    value={this.state.offerSDP}
                    onChange={this.createAnswerFromOffer}
                  />
                  <button id='createSDPBtn' onClick={this.createAnswerSDP}>
                    Create SDP
                  </button>
                  <textarea
                    id='participantSDP'
                    placeholder='create participant SDP'
                    value={this.state.createSDPval}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
