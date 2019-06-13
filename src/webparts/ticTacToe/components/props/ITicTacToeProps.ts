import { SPHttpClient } from "@microsoft/sp-http";

export interface ITicTacToeProps {
  description: string;
  spHttpClient: SPHttpClient;
  siteUrl: string;
}
