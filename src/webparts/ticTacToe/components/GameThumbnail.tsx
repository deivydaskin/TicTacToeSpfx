import * as React from "react";
import styles from "./TicTacToe.module.scss";
import Board from "./Board";
import { IGameState } from "./props/IGameState";

const initsqrs = ["X", "O", "X", "O", "X", "O", "X", "X", "O"];

export default class GameThumbnail extends React.Component<{}, IGameState> {
  constructor(props) {
    super(props);

    this.state = {
      squares: initsqrs,
      xIsNext: true
    };
  }

  public render() {
    return (
      <div className={styles.game}>
        <div className="game-board">
          <Board squares={this.state.squares} onClick={() => {}} />
        </div>
      </div>
    );
  }
}
