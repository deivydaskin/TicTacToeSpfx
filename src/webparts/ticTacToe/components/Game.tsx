import * as React from "react";
import styles from "./TicTacToe.module.scss";
import Board from "./Board";
import calculateWinner from "./Winner";
import { IGameState } from "./props/IGameState";
import { sendMSG } from "./TicTacToe";
import { PrimaryButton } from "office-ui-fabric-react";

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

  private handleClick(i: number): void {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    let check = sendMSG(squares, !this.state.xIsNext);
    if (check) return;
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });
  }

  private handleCustomEvent(e): void {
    let event = JSON.parse(e.detail);
    this.setState({
      squares: event.figures,
      xIsNext: event.xIsNext
    });
  }

  private handleRestart(): void {
    this.setState({
      squares: initsqrs,
      xIsNext: !initxIsNext
    });
    initxIsNext = !initxIsNext;
  }

  componentDidMount() {
    document.addEventListener("tic", e => this.handleCustomEvent(e));
  }

  public render() {
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
          <PrimaryButton
            text='Restart'
            onClick={this.handleRestart}
            style={{ marginTop: 50, marginLeft: -90 }}
          />
        ) : null}
      </div>
    );
  }
}
