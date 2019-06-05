import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";

export default class TicTacToe extends React.Component<ITicTacToeProps, {}> {
  public render(): React.ReactElement<ITicTacToeProps> {
    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <Game />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
