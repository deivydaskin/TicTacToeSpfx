import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
import GameThumbnail from "./GameThumbnail";
import {
  SPHttpClient,
  SPHttpClientResponse,
  ISPHttpClientOptions
} from "@microsoft/sp-http";
import { Fabric } from "office-ui-fabric-react/lib/Fabric";
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  Selection
} from "office-ui-fabric-react/lib/DetailsList";
import {
  ListSubscriptionFactory,
  IListSubscription
} from "@microsoft/sp-list-subscription";
import { Guid } from "@microsoft/sp-core-library";
import { PrimaryButton } from "office-ui-fabric-react";
import { MessageBar } from "office-ui-fabric-react/lib/MessageBar";
import { postOfferToList } from "./Api";
import { sp } from "@pnp/sp";
import * as strings from "TicTacToeWebPartStrings";
import { IReadonlyTheme } from "@microsoft/sp-component-base";

var pc, dc;
var sdpConstraints = { optional: [{ RtpDataChannels: true }] };

export const sendMSG = (move, xIsNext) => {
  if (pc.localDescription.type == "answer" && xIsNext) {
    let value = {
      figures: move,
      xIsNext: xIsNext
    };
    if (value) {
      dc.send(JSON.stringify(value));
    }
  } else if (pc.localDescription.type == "offer" && !xIsNext) {
    let value = {
      figures: move,
      xIsNext: xIsNext
    };
    if (value) {
      dc.send(JSON.stringify(value));
    }
  } else {
    return "Not your move";
  }
};

function dcInit(
  dataChannel,
  isCreator,
  loginName,
  libId,
  siteUrl,
  spHttpClient
) {
  dataChannel.onopen = () => {
    alert("Connected");
    if (isCreator) {
      let spOpts: ISPHttpClientOptions = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "IF-MATCH": "etag or '*'",
          "X-HTTP-Method": "DELETE"
        }
      };

      var url = `${siteUrl}/_api/web/lists(guid'${libId}')/rootfolder/Files('${loginName}')`;

      spHttpClient
        .post(url, SPHttpClient.configurations.v1, spOpts)
        .then((response: SPHttpClientResponse) => {
          console.log(`Status code: ${response.status}`);
          console.log(`Status text: ${response.statusText}`);

          response.json().then((responseJSON: JSON) => {
            console.log(responseJSON);
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
  dataChannel.onmessage = e => {
    if (e.data) {
      let event = new CustomEvent("tic", { detail: e.data });
      document.dispatchEvent(event);
    }
  };
}

interface IState {
  startGame: boolean;
  joinGame: boolean;
  offers: string[];
  offerSDP: string;
  offerOpponentSDP: string;
  answerOfferSDP: string;
  answerAnswerSDP: string;
  offerList: boolean;
  notification: boolean;
  selectionDetails: {};
}

export interface IDetailsListBasicExampleItem {
  key: number;
  name: string;
  value: number;
}

export default class TicTacToe extends React.Component<
  ITicTacToeProps,
  IState
> {
  private _columns: IColumn[];
  private _listSubscriptionFactory: ListSubscriptionFactory;
  private _listSubscription: IListSubscription;
  private _selection: Selection;

  constructor(props) {
    super(props);

    this._selection = new Selection({
      onSelectionChanged: () =>
        this.setState({ selectionDetails: this._getSelectionDetails() })
    });

    this._columns = [
      {
        key: "column1",
        name: "Name",
        fieldName: "name",
        minWidth: 200,
        maxWidth: 200,
        isResizable: true
      }
    ];

    this.state = {
      startGame: false,
      joinGame: false,
      offers: [],
      offerSDP: "",
      offerOpponentSDP: "",
      answerOfferSDP: "",
      answerAnswerSDP: "",
      offerList: false,
      notification: false,
      selectionDetails: {}
    };

    this.handleClick = this.handleClick.bind(this);
    this.getOfferList = this.getOfferList.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.start = this.start.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
    this.getAnswerSDP = this.getAnswerSDP.bind(this);
    this.createListSubscription = this.createListSubscription.bind(this);
    this.dismissNotification = this.dismissNotification.bind(this);
  }

  private handleClick(e): void {
    if (e == "createGame") {
      this.setState({
        startGame: !this.state.startGame
      });
      this.createOffer();

      let loginName = this.props.loginName;
      let siteURL = this.props.siteUrl;
      let spHttp = this.props.spHttpClient;
      let libId = this.props.libraryId;

      pc.onicecandidate = ev => {
        if (ev.candidate) return;
        postOfferToList(loginName, pc.localDescription, siteURL, spHttp, libId);
      };

      setTimeout(() => {
        this.createListSubscription();
      }, 2000);
    }
    if (e == "joinGame") {
      let loginName = this.props.loginName;
      let libId = this.props.libraryId;
      let siteUrl = this.props.siteUrl;
      let spHttp = this.props.spHttpClient;
      let isCreator = false;

      this.setState({
        joinGame: !this.state.joinGame
      });
      this.createListSubscription();
      pc.ondatachannel = ev => {
        dc = ev.channel;
        dcInit(dc, isCreator, loginName, libId, siteUrl, spHttp);
      };
    }
    if (e == "hideOfferList") {
      if (this.state.offerList) {
        this.setState({ offerList: false });
      } else {
        this.getOfferList();
      }
    }

    if (e == "play") {
      this.getFileOffer(this.state.selectionDetails);
    }
  }

  private getOfferList(): void {
    sp.web.lists
      .getById(this.props.libraryId)
      .items.select("ID", "Title", "GUID", "Author/Name")
      .expand("Author")
      .get()
      .then((responseJSON: any) => {
        let temp = [];
        responseJSON.map((e, i) =>
          temp.push({
            key: e.GUID,
            name: e.Author.Name.split("|")[2]
          })
        );
        this.setState({ offers: temp, offerList: true });
      })
      .catch(err => {
        console.log(err);
      });
  }

  private createOffer(): void {
    let loginName = this.props.loginName;
    let libId = this.props.libraryId;
    let siteUrl = this.props.siteUrl;
    let spHttp = this.props.spHttpClient;
    let isCreator = true;

    dc = pc.createDataChannel(null);
    dcInit(dc, isCreator, loginName, libId, siteUrl, spHttp);
    pc.createOffer()
      .then(offer => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        this.setState({
          offerSDP: JSON.stringify(pc.localDescription)
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  private start(answer): void {
    var answerDesc = new RTCSessionDescription(answer);
    pc.setRemoteDescription(answerDesc);
  }

  private createAnswerSDP(SDP, item): void {
    var offerDesc = new RTCSessionDescription(SDP);

    let siteURL = this.props.siteUrl;
    let spHttp = this.props.spHttpClient;
    let libId = this.props.libraryId;

    pc.setRemoteDescription(offerDesc);
    pc.createAnswer(sdpConstraints)
      .then(answer => {
        return pc.setLocalDescription(answer);
      })
      .then(() => {
        this.setState({
          answerAnswerSDP: JSON.stringify(pc.localDescription)
        });
      })
      .then(() => {
        postOfferToList(item, pc.localDescription, siteURL, spHttp, libId);
      })
      .catch(err => {
        console.log(err);
      });
  }

  private getAnswerSDP(): void {
    this.props.spHttpClient
      .get(
        `${this.props.siteUrl}/_api/web/lists(guid'${
          this.props.libraryId
        }')/rootfolder/Files('${this.props.loginName}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          let typeStart = 9;
          let typeEnd = 15;
          if (
            JSON.stringify(responseJSON).slice(typeStart, typeEnd) == "answer"
          ) {
            this.setState({
              offerOpponentSDP: JSON.stringify(responseJSON),
              notification: true
            });
            this.start(responseJSON);
          }
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  private createListSubscription(): void {
    this._listSubscriptionFactory = this.props.listSubscriptionFactory;

    this._listSubscriptionFactory
      .createSubscription({
        listId: Guid.parse(this.props.libraryId),

        callbacks: {
          notification: this._loadDocuments.bind(this)
        }
      })
      .then(listSubscription => {
        this._listSubscription = listSubscription;
      })
      .catch(err => {
        console.log(err);
      });
  }

  private _loadDocuments(): void {
    if (this.state.joinGame) {
      this.setState({
        notification: true
      });
    }
    if (this.state.startGame) {
      this.getAnswerSDP();
    }
  }

  public componentDidMount(): void {
    pc = new RTCPeerConnection(null);
  }

  public componentWillUnmount(): void {
    let loginName = this.props.loginName;
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "IF-MATCH": "etag or '*'",
        "X-HTTP-Method": "DELETE"
      }
    };

    var url = `${this.props.siteUrl}/_api/web/lists(guid'${
      this.props.libraryId
    }')/rootfolder/Files('${loginName}')`;

    this.props.spHttpClient
      .post(url, SPHttpClient.configurations.v1, spOpts)
      .then((response: SPHttpClientResponse) => {
        console.log(`Status code: ${response.status}`);
        console.log(`Status text: ${response.statusText}`);

        response.json().then((responseJSON: JSON) => {
          console.log(responseJSON);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  private dismissNotification(): void {
    this.setState({
      notification: false
    });
  }

  public render(): React.ReactElement<ITicTacToeProps> {
    var data = this.state.offers;
    const { semanticColors }: IReadonlyTheme = this.props.themeVariant;

    return (
      <Fabric>
        <div className={styles.ticTacToe}>
          <div
            className={styles.row}
            style={{ color: semanticColors.bodyText }}
          >
            {!this.state.startGame &&
              (!this.state.joinGame && (
                <div className={styles.startWindow}>
                  <GameThumbnail />
                  <div className={styles.startWindowBtns}>
                    <PrimaryButton
                      id="createGame"
                      style={{
                        backgroundColor: semanticColors.primaryButtonBackground,
                        color: semanticColors.primaryButtonText
                      }}
                      text={strings.CreateBtnLabel}
                      onClick={() => this.handleClick("createGame")}
                    />
                    <PrimaryButton
                      id="joinGame"
                      style={{
                        backgroundColor: semanticColors.primaryButtonBackground,
                        color: semanticColors.primaryButtonText
                      }}
                      text={strings.JoinBtnLabel}
                      onClick={() => this.handleClick("joinGame")}
                    />
                  </div>
                </div>
              ))}

            {this.state.startGame && (
              <div className={styles.gameWindow}>
                {this.state.notification && (
                  <MessageBar
                    onDismiss={this.dismissNotification}
                    dismissButtonAriaLabel="Close"
                    styles={{
                      root: {
                        margin: 10,
                        marginBottom: 0,
                        width: "auto",
                        backgroundColor: semanticColors.warningBackground,
                        color: semanticColors.warningText
                      }
                    }}
                  >
                    {strings.OfferAcceptedNotification}
                  </MessageBar>
                )}
                <Game semColors={this.props.themeVariant} />
              </div>
            )}
            {this.state.joinGame && (
              <div className={styles.gameWindow}>
                {this.state.notification && (
                  <MessageBar
                    onDismiss={this.dismissNotification}
                    dismissButtonAriaLabel="Close"
                    styles={{
                      root: {
                        margin: 10,
                        marginBottom: 0,
                        width: "auto",
                        backgroundColor: semanticColors.errorBackground,
                        color: semanticColors.warningText
                      }
                    }}
                  >
                    {strings.NewGameOfferNotification}
                  </MessageBar>
                )}
                <Game semColors={this.props.themeVariant} />
                <PrimaryButton
                  id="hideOfferList"
                  allowDisabledFocus={true}
                  toggle={true}
                  text={
                    this.state.offerList
                      ? strings.HideOffersBtnLabel
                      : strings.ShowOffersBtnLabel
                  }
                  onClick={() => this.handleClick("hideOfferList")}
                  style={{
                    margin: "auto",
                    marginBottom: 0,
                    width: "auto",
                    minWidth: "300px",
                    maxWidth: "500px",
                    backgroundColor: semanticColors.primaryButtonBackground,
                    color: semanticColors.primaryButtonText
                  }}
                />
                {this.state.offerList && (
                  <Fabric
                    style={{
                      margin: "auto",
                      marginTop: "10px",
                      minWidth: "300px"
                    }}
                  >
                    <PrimaryButton
                      text={strings.PlayBtnLabel}
                      onClick={() => this.handleClick("play")}
                      style={{
                        marginBottom: 10,
                        width: "auto",
                        backgroundColor: semanticColors.primaryButtonBackground,
                        color: semanticColors.primaryButtonText
                      }}
                    />
                    <DetailsList
                      items={data}
                      columns={this._columns}
                      selection={this._selection}
                      isHeaderVisible={false}
                      layoutMode={DetailsListLayoutMode.justified}
                      selectionMode={1}
                      selectionPreservedOnEmptyClick={true}
                      onItemInvoked={this._onItemInvoked}
                      styles={{
                        root: {
                          backgroundColor: semanticColors.inputBackground,
                          color: semanticColors.inputText
                        }
                      }}
                    />
                  </Fabric>
                )}
              </div>
            )}
          </div>
        </div>
      </Fabric>
    );
  }

  private _getSelectionDetails(): string {
    if (this._selection.count != 0) {
      return (this._selection.getSelection()[0] as IDetailsListBasicExampleItem)
        .name;
    }
  }

  private _onItemInvoked = (item: IDetailsListBasicExampleItem): void => {
    this.getFileOffer(item.name);
  };

  private getFileOffer(item): void {
    this.props.spHttpClient
      .get(
        `${this.props.siteUrl}/_api/web/lists(guid'${
          this.props.libraryId
        }')/rootfolder/Files('${item}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          this.setState({
            answerOfferSDP: JSON.stringify(responseJSON)
          });
          this.createAnswerSDP(responseJSON, item);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
}
