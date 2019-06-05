import { escape } from "@microsoft/sp-lodash-subset";
import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
import * as Peer from "peerjs";

const peer = new Peer();

peer.on("open", function(id) {
  console.log("My peer ID is: " + id);
});

console.log(Peer);

interface IState {
  start: boolean;
  join: boolean;
  opponentID: string;
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
      opponentID: ""
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    console.log(e.target.id);

    if (e.target.id == "start") {
      this.setState({
        start: !this.state.start
      });
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

  public render(): React.ReactElement<ITicTacToeProps> {
    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <button id='start' onClick={this.handleClick}>
              Start
            </button>
            <button id='join' onClick={this.handleClick}>
              Join
            </button>
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <Game />
                  <div>Your ID:{"peerID"}</div>
                </div>
              ) : null}
              {this.state.join ? (
                <div>
                  <Game />
                  <input
                    id='opponentID'
                    placeholder="Enter your opponent's ID"
                  />
                  <button id='submitID' onClick={this.handleClick}>
                    Ok
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
