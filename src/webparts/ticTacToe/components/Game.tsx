import * as React from "react";
import styles from "./TicTacToe.module.scss";
import Board from "./Board";
import calculateWinner from "./Winner";
import { IGameState } from "./props/IGameState";
import { sendMSGOffer } from "./OfferSDP";
import { sendMSGAnswer } from "./AnswerSDP";

const initsqrs = [];
var initxIsNext = true;

export default class Game extends React.Component<{}, IGameState> {
  constructor(props) {
    super(props);

    for (let i = 0; i < 9; i++) {
      initsqrs[i] = null;
    }
    this.state = {
      squares: initsqrs,
      xIsNext: true
    };

    this.handleRestart = this.handleRestart.bind(this);
  }

  handleClick(i: number) {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    //console.log(sendMSGOffer(squares, this.state.xIsNext));
    this.state.xIsNext
      ? sendMSGOffer(squares, !this.state.xIsNext)
      : sendMSGAnswer(squares, !this.state.xIsNext);

    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });
  }

  handleCustomEvent(e) {
    let event = JSON.parse(e.detail);
    console.log(event.figures);
    console.log(event.xIsNext);
    this.setState({
      squares: event.figures,
      xIsNext: event.xIsNext
    });
  }

  handleRestart() {
    this.setState({
      squares: initsqrs,
      xIsNext: !initxIsNext
    });
    initxIsNext = !initxIsNext;
  }

  componentDidMount() {
    document.addEventListener("tic", e => this.handleCustomEvent(e));
  }

  render() {
    const winner = calculateWinner(this.state.squares);

    let status: string;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      if (this.state.squares.every(s => s != null)) {
        status = "Draw game";
      } else {
        status = "Next player: " + (this.state.xIsNext ? "X" : "O");
      }
    }

    return (
      <div className={styles.game}>
        <div className='game-board'>
          <Board
            squares={this.state.squares}
            onClick={(i: number) => this.handleClick(i)}
          />
        </div>
        <div className={styles["game-info"]}>
          <div>{status}</div>
        </div>
        {winner || status == "Draw game" ? (
          <button onClick={this.handleRestart}>Restart</button>
        ) : null}
      </div>
    );
  }
}
