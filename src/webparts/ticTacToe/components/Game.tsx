import * as React from "react";
import styles from "./TicTacToe.module.scss";
import Board from "./Board";
import calculateWinner from "./Winner";
import { IGameState } from "./props/IGameState";

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
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });
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
