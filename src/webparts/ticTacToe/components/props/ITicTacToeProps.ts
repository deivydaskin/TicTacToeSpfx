import { SPHttpClient } from "@microsoft/sp-http";
import { ListSubscriptionFactory } from "@microsoft/sp-list-subscription";

export interface ITicTacToeProps {
  description: string;
  spHttpClient: SPHttpClient;
  siteUrl: string;
  loginName: string;
  libraryId: string;
  listSubscriptionFactory: ListSubscriptionFactory;
}
