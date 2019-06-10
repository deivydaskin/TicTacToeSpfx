import { escape } from "@microsoft/sp-lodash-subset";
import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
import { checkStat, createOffer, start, sendMSG } from "./OfferSDP";
import createAnswerSDP from "./AnswerSDP";

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
    this.handleOpponentSDP = this.handleOpponentSDP.bind(this);
  }

  handleClick(e) {
    console.log(e.target.id);

    if (e.target.id == "start") {
      this.setState({
        start: !this.state.start
      });
      createOffer();
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

  handleKeyPress = event => {
    if (event.key === "Enter" || event.id === "send") {
      sendMSG("SADD");
    }
  };

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
            <input id='status' disabled />
            <input
              id='msg'
              multiple
              type='text'
              onKeyPress={this.handleKeyPress}
            />
            <button id='send' onClick={this.handleKeyPress}>
              Send
            </button>
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <textarea
                    id='createSDP'
                    placeholder='Your SDP'
                    readOnly
                    //defaultValue={this.state.createSDPval}
                  />
                  <button id='startBtn' onClick={start}>
                    Start
                  </button>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
                    value={this.state.opponentID}
                    onChange={this.handleOpponentSDP}
                  />

                  <button onClick={checkStat}>Check status</button>
                  <Game />
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
                  <button id='createSDPBtn' onClick={createAnswerSDP}>
                    Create SDP
                  </button>
                  <textarea
                    id='participantSDP'
                    placeholder='create participant SDP'
                    //value={this.state.createSDPval}
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
