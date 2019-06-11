import { escape } from "@microsoft/sp-lodash-subset";
import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
import { checkStat, createOffer, start, sendMSG } from "./OfferSDP";
import createAnswerSDP from "./AnswerSDP";
import connected from "./AnswerSDP";

interface IState {
  start: boolean;
  join: boolean;
  opponentID: string;
  createSDPval: string;
  offerSDP: string;
  connected: boolean;
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
      offerSDP: "",
      connected: false
    };
    this.handleClick = this.handleClick.bind(this);
    this.createAnswerFromOffer = this.createAnswerFromOffer.bind(this);
    this.handleOpponentSDP = this.handleOpponentSDP.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleClick(e) {
    //console.log(e.target.id);

    if (e.target.id == "createGame") {
      this.setState({
        start: !this.state.start
      });
      createOffer();
    }
    if (e.target.id == "joinGame") {
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
    //console.log(this.state);
  }

  createAnswerFromOffer(event) {
    this.setState({
      offerSDP: event.target.value
    });
    //console.log(this.state);
  }

  handleOpponentSDP(event) {
    this.setState({
      opponentID: event.target.value
    });
  }

  handleChange() {
    this.setState({
      connected: !this.state.connected
    });
  }

  public render(): React.ReactElement<ITicTacToeProps> {
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
              id='status1'
              disabled
              value='Not Connected'
              onChange={() => this.handleChange()}
            />
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='createSDP'
                    placeholder='Your SDP'
                    readOnly
                    //style={{ marginTop: 20 }}
                  />
                  <button id='startBtn' onClick={start} style={{ margin: 10 }}>
                    Start
                  </button>
                  <legend>
                    Paste your opponent's SDP here and press 'Start'
                  </legend>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
                    value={this.state.opponentID}
                    onChange={this.handleOpponentSDP}
                    style={{ marginBottom: 20 }}
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
                    value={this.state.offerSDP}
                    onChange={this.createAnswerFromOffer}
                    //style={{ margin: 20 }}
                  />
                  <button
                    id='createSDPBtn'
                    onClick={createAnswerSDP}
                    style={{ margin: 10 }}
                  >
                    CreateSDP
                  </button>
                  <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='participantSDP'
                    placeholder='create participant SDP'
                    style={{ marginBottom: 20 }}
                  />
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
