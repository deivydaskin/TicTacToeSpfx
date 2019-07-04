import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
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
import {
  MessageBar
} from "office-ui-fabric-react/lib/MessageBar";
import { postOfferToList } from "./Api";
import { sp } from "@pnp/sp";

var pc, dc;
var sdpConstraints = { optional: [{ RtpDataChannels: true }] };

export const sendMSG = (move, xIsNext) => {
  if (pc.localDescription.type == "answer" && xIsNext) {
    var value = {
      figures: move,
      xIsNext: xIsNext
    };
    if (value) {
      dc.send(JSON.stringify(value));
    }
  } else if (pc.localDescription.type == "offer" && !xIsNext) {
    var value = {
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

function dcInit(dc) {
  dc.onopen = () => {
    alert("Connected");
  };
  dc.onmessage = function(e) {
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
  _listSubscriptionFactory: ListSubscriptionFactory;
  _listSubscription: IListSubscription;
  private _selection: Selection;

  constructor(props) {
    super(props);

    this._selection = new Selection({
      onSelectionChanged: () => this.setState({ selectionDetails: this._getSelectionDetails() })
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

      pc.onicecandidate = function(e) {
        if (e.candidate) return;
        postOfferToList(loginName, pc.localDescription, siteURL, spHttp, libId);
      };

      setTimeout(() => {
        this.createListSubscription();
      }, 2000);
    }
    if (e == "joinGame") {
      this.setState({
        joinGame: !this.state.joinGame
      });
      this.createListSubscription();
      pc.ondatachannel = function(e) {
        dc = e.channel;
        dcInit(dc);
      };
    }
    if (e == "hideOfferList") {
      if (this.state.offerList) {
        this.setState({ offerList: false });
      } else {
        this.getOfferList();
      }
    }

    if(e == "play"){
      this.getFileOffer(this.state.selectionDetails);
    }
  }

  getOfferList() {
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

  createOffer() {
    dc = pc.createDataChannel(null);
    dcInit(dc);
    pc.createOffer()
      .then(function(offer) {
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

  start(answer) {
    var answerDesc = new RTCSessionDescription(
      answer
    );
    pc.setRemoteDescription(answerDesc);
  }

  createAnswerSDP(SDP, item) {
    var offerDesc = new RTCSessionDescription(SDP);

    let loginName = this.props.loginName;
    let siteURL = this.props.siteUrl;
    let spHttp = this.props.spHttpClient;
    let libId = this.props.libraryId;

    pc.setRemoteDescription(offerDesc);
    pc.createAnswer(sdpConstraints)
      .then(function(answer) {
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

  private getAnswerSDP() {
    let loginName = this.props.loginName;

    this.props.spHttpClient
      .get(
        `${this.props.siteUrl}/_api/web/lists(guid'${
          this.props.libraryId
        }')/rootfolder/Files('${loginName}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          if(JSON.stringify(responseJSON).slice(9, 15) == "answer"){
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

  componentDidMount() {
    pc = new RTCPeerConnection(null);
  }

  componentWillUnmount() {
    let loginName = this.props.loginName;
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "IF-MATCH": "etag or '*'",
        "X-HTTP-Method": "DELETE"
      },
      body: this.state.answerAnswerSDP
    };

    var url = `${this.props.siteUrl}/_api/web/GetFileByServerRelativeUrl('/${
      this.props.libraryId
    }/${loginName}')`;

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

  dismissNotification() {
    this.setState({
      notification: false
    });
  }

  public render(): React.ReactElement<ITicTacToeProps> {
    var data = this.state.offers;

    return (
      <Fabric>
        <div className={styles.ticTacToe}>
          <div className={styles.container}>
            <div className={styles.row}>
              <div className={styles.startWindow}>
                <PrimaryButton
                  id='createGame'
                  text='Create Game'
                  onClick={() => this.handleClick("createGame")}
                />
                <PrimaryButton
                  id='joinGame'
                  text='Join Game'
                  onClick={() => this.handleClick("joinGame")}
                />
              </div>

              {this.state.startGame ? (
                <div className={styles.gameWindow}>
                  {this.state.notification ? (
                    <MessageBar
                      onDismiss={this.dismissNotification}
                      dismissButtonAriaLabel='Close'
                    >
                      Your offer has been accepted! Start by placing 'X' on the board.
                    </MessageBar>
                  ) : null}
                  {/* <PrimaryButton
                    id='startBtn'
                    text='Start'
                    onClick={this.start}
                    style={{ margin: 10 }}
                  /> */}
                  <Game />
                </div>
              ) : null}
              {this.state.joinGame ? (
                <div className={styles.gameWindow}>
                  {this.state.notification ? (
                    <MessageBar
                      onDismiss={this.dismissNotification}
                      dismissButtonAriaLabel='Close'
                    >
                      Got a new game offer! Press 'Show Offer List' to refresh
                      the list
                    </MessageBar>
                  ) : null}
                  <PrimaryButton
                    id='hideOfferList'
                    data-automation-id='test'
                    allowDisabledFocus={true}
                    toggle={true}
                    text={
                      this.state.offerList
                        ? "Hide Offer List"
                        : "Show Offer List"
                    }
                    onClick={() => this.handleClick("hideOfferList")}
                    style={{ margin: 10 }}
                  />
                  {this.state.offerList ? (
                    <Fabric style={{ margin: 10 }}>
                      <DetailsList
                        items={data}
                        columns={this._columns}
                        setKey='set'
                        selection={this._selection}
                        isHeaderVisible={false}
                        layoutMode={DetailsListLayoutMode.justified}
                        selectionMode={1}
                        selectionPreservedOnEmptyClick={true}
                        onItemInvoked={this._onItemInvoked}
                      />
                      <PrimaryButton
                      text={"Play"}
                      onClick={() => this.handleClick("play")}
                      />
                    </Fabric>
                  ) : null}
                  <Game />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Fabric>
    );
  }

private _getSelectionDetails(): string {
      return (this._selection.getSelection()[0] as IDetailsListBasicExampleItem).name;
}

  private _onItemInvoked = (item: IDetailsListBasicExampleItem): void => {
    this.getFileOffer(item.name);
  };

  private getFileOffer(item) {
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
