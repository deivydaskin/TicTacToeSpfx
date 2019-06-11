import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
import { createOffer, start } from "./OfferSDP";
import createAnswerSDP from "./AnswerSDP";

interface IState {
  start: boolean;
  join: boolean;
}

export default class TicTacToe extends React.Component<
  ITicTacToeProps,
  IState
> {
  constructor(props) {
    super(props);
    this.state = {
      start: false,
      join: false
    };
    this.handleClick = this.handleClick.bind(this);
  }

  private handleClick(e): void {
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
            <input id='status' disabled value='Not Connected' />
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea id='createSDP' placeholder='Your SDP' readOnly />
                  <button id='startBtn' onClick={start} style={{ margin: 10 }}>
                    Start
                  </button>
                  <legend>
                    Paste your opponent's SDP here and press 'Start'
                  </legend>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
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
                  <textarea id='offerSDP' placeholder='Paste offer SDP' />
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
                    readOnly
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
