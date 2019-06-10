import * as React from "react";
import styles from "./TicTacToe.module.scss";
import Board from "./Board";
import calculateWinner from "./Winner";
import { IGameState } from "./props/IGameState";
import { sendMSG } from "./OfferSDP";

export default class Game extends React.Component<{}, IGameState> {
  constructor(props) {
    super(props);
    const initsqrs = [];
    for (let i = 0; i < 9; i++) {
      initsqrs[i] = null;
    }
    this.state = {
      squares: initsqrs,
      xIsNext: true
    };
  }

  handleClick(i: number) {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    console.log(squares);
    sendMSG(squares);
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });
  }

  handleCustomEvent(e) {
    console.log(e.detail);
    this.setState({
      squares: e.detail
    });
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
      </div>
    );
  }
}
