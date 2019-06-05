import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ISquareProps } from "./props/ISquareProps";

export default function Square(props: ISquareProps): JSX.Element {
  return (
    <button className={styles.square} onClick={props.onClick}>
      {props.value}
    </button>
  );
}
