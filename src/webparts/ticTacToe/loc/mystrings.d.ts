declare interface ITicTacToeWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  CreateBtnLabel: string;
  JoinBtnLabel: string;
  OfferAcceptedNotification: string;
  NewGameOfferNotification: string;
  ShowOffersBtnLabel: string;
  HideOffersBtnLabel: string;
  PlayBtnLabel: string;
  GameStatusWinner: string;
  GameStatusDraw: string;
  GameStatusNextPlayer: string;
  RestartBtnLabel: string;
  Description: string;
  SiteUrlLabel: string;
  DocumentLibraryLabel: string;
}

declare module 'TicTacToeWebPartStrings' {
  const strings: ITicTacToeWebPartStrings;
  export = strings;
}
