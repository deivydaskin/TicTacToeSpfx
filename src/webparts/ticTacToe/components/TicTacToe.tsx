import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
//import { createOffer, start, returnOfferSDP } from "./OfferSDP";
//import createAnswerSDP from "./AnswerSDP";
//import API from "./API";
import {
  SPHttpClient,
  SPHttpClientResponse,
  SPHttpClientConfiguration,
  ISPHttpClientOptions
} from "@microsoft/sp-http";

var pc, dc;
var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var fferSDP;
var ejimas = true;

export const sendMSGOffer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (ejimas) {
    if (value) {
      dc.send(JSON.stringify(value));
    }
  }
  ejimas = !ejimas;
};

export const sendMSGAnswer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (!ejimas) {
    if (value) {
      dc.send(JSON.stringify(value));
    }
  }
  ejimas = !ejimas;
};

function dcInit(dc) {
  dc.onopen = function() {
    // $("textarea").attr("disabled", true);
    // $("#joinGame").attr("disabled", true);
    // $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      let event = new CustomEvent("tic", { detail: e.data });
      document.dispatchEvent(event);
    }
  };
}

interface IState {
  start: boolean;
  join: boolean;
  offers: string[];
  offerSDP: string;
  offerOpponentSDP: string;
  answerOfferSDP: string;
  answerAnswerSDP: string;
  status: string;
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
      offers: [],
      offerSDP: "",
      offerOpponentSDP: "",
      answerOfferSDP: "",
      answerAnswerSDP: "",
      status: ""
    };
    this.handleClick = this.handleClick.bind(this);
    this.getOfferList = this.getOfferList.bind(this);
    this.createOffer1 = this.createOffer1.bind(this);
    this.start = this.start.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
  }

  private handleClick(e): void {
    if (e.target.id == "createGame") {
      this.setState({
        start: !this.state.start
      });
      this.createOffer1();
    }
    if (e.target.id == "joinGame") {
      this.setState({
        join: !this.state.join
      });
    }
    if (e.target.id == "offerList") {
      console.log(e.taget.id);
    }
  }

  getOfferList() {
    ///_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('tictactest.json')/$value
    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          // this.setState({
          //   offers: responseJSON.value
          // });
          let temp = [];
          responseJSON.value.map((e, i) => (temp[i] = e.Name));
          console.log(temp);
          this.setState({ offers: temp });
        });
      });
  }

  postOfferToList() {
    //console.log(returnOfferSDP());

    var loginName = this.props.loginName;
    let offerSD = this.state.offerSDP;
    console.log(loginName);
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: offerSD
    };

    var url = `${
      this.props.siteUrl
    }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files/Add(url='${loginName}', overwrite=true)`;

    this.props.spHttpClient
      .post(url, SPHttpClient.configurations.v1, spOpts)
      .then((response: SPHttpClientResponse) => {
        console.log(`Status code: ${response.status}`);
        console.log(`Status text: ${response.statusText}`);

        response.json().then((responseJSON: JSON) => {
          console.log(responseJSON);
        });
      });
  }

  createOffer1() {
    dc = pc.createDataChannel("ticTacToe");
    pc.createOffer()
      .then(function(offer) {
        pc.setLocalDescription(offer);
        fferSDP = offer;
      })
      .then(() => {
        this.setState({
          offerSDP: JSON.stringify(fferSDP)
        });
        this.postOfferToList();
      });

    dc.onopen = function() {
      // $("textarea").attr("disabled", true);
      // $("#createGame").attr("disabled", true);
      // $("#status").val("CONNECTED!");
      console.log("CONNECTED!");
      this.setStatus();
    };

    dc.onmessage = function(e) {
      if (e.data) {
        let event = new CustomEvent("tic", { detail: e.data });
        document.dispatchEvent(event);
      }
    };
  }

  setStatus = () => {
    this.setState({
      status: "CONNECTED!"
    });
  };

  start() {
    var answerSDP = this.state.offerOpponentSDP;
    var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
    pc.setRemoteDescription(answerDesc);
  }

  handleChange(e) {
    if (e.target.id == "getSDP") {
      this.setState({
        offerOpponentSDP: e.target.value
      });
    }
    if (e.target.id == "offerSDP") {
      this.setState({
        answerOfferSDP: e.target.value
      });
    }
  }

  getOfferDesc() {
    return JSON.parse(this.state.answerOfferSDP);
  }

  createAnswerSDP() {
    var offerDesc = this.getOfferDesc();

    pc.setRemoteDescription(offerDesc);
    pc.createAnswer(
      function(answerDesc) {
        pc.setLocalDescription(answerDesc);
      },
      function() {
        console.warn("Couldn't create offer");
      },
      sdpConstraints
    ).then(() => {
      this.setState({
        answerAnswerSDP: JSON.stringify(pc.localDescription)
      });
    });
  }

  componentDidMount() {
    pc = new RTCPeerConnection(null);
    dc;

    pc.ondatachannel = function(e) {
      dc = e.channel;
      dcInit(dc);
    };
  }

  public render(): React.ReactElement<ITicTacToeProps> {
    var data = this.state.offers;

    console.log(data[1]);

    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <button id='createGame' onClick={this.handleClick}>
              Create Game
            </button>
            <button id='joinGame' onClick={this.handleClick}>
              Join Game
            </button>
            <legend>Status</legend>
            <input
              id='status'
              disabled
              value={this.state.status}
              placeholder='Not Connected.'
            />
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='createSDP'
                    placeholder='Your SDP'
                    readOnly
                    value={this.state.offerSDP}
                  />
                  <button
                    id='startBtn'
                    onClick={this.start}
                    style={{ margin: 10 }}
                  >
                    Start
                  </button>
                  <legend>
                    Paste your opponent's SDP here and press 'Start'
                  </legend>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
                    style={{ marginBottom: 20 }}
                    value={this.state.offerOpponentSDP}
                    onChange={this.handleChange}
                  />
                  <Game />
                </div>
              ) : null}
              {this.state.join ? (
                <div>
                  <legend>
                    Paste your opponent's SDP here and press 'CreateSDP'
                  </legend>
                  <textarea
                    id='offerSDP'
                    placeholder='Paste offer SDP'
                    onChange={this.handleChange}
                    value={this.state.answerOfferSDP}
                  />
                  <button
                    id='createSDPBtn'
                    onClick={this.createAnswerSDP}
                    style={{ margin: 10 }}
                  >
                    CreateSDP
                  </button>
                  <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='participantSDP'
                    placeholder='create participant SDP'
                    readOnly
                    style={{ marginBottom: 20 }}
                    value={this.state.answerAnswerSDP}
                  />
                  <button onClick={this.getOfferList}>Show Offer List</button>
                  <ul>
                    {data.map((event, i) => {
                      return (
                        <li id='offerList' key={i} onClick={this.handleClick}>
                          {data[i]}
                        </li>
                      );
                    })}
                  </ul>
                  <Game />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
