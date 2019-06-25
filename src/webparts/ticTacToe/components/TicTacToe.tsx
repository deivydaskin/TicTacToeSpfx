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
  IColumn
} from "office-ui-fabric-react/lib/DetailsList";
import {
  ListSubscriptionFactory,
  IListSubscription
} from "@microsoft/sp-list-subscription";
import { Guid } from "@microsoft/sp-core-library";
import { PrimaryButton } from "office-ui-fabric-react";
import {
  MessageBar,
  MessageBarType
} from "office-ui-fabric-react/lib/MessageBar";

var pc, dc;
var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var fferSDP;

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

  constructor(props) {
    super(props);

    this._columns = [
      {
        key: "column1",
        name: "Name",
        fieldName: "name",
        minWidth: 100,
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
      notification: false
    };

    this.handleClick = this.handleClick.bind(this);
    this.getOfferList = this.getOfferList.bind(this);
    this.createOffer1 = this.createOffer1.bind(this);
    this.start = this.start.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
    this.getAnswerSDP = this.getAnswerSDP.bind(this);
    this.createListSubscription = this.createListSubscription.bind(this);
    this.dismissNotification = this.dismissNotification.bind(this);
  }

  private handleClick(e): void {
    console.log(e);
    if (e == "createGame") {
      this.setState({
        startGame: !this.state.startGame
      });
      this.createOffer1();
      this.createListSubscription();
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
  }

  getOfferList() {
    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          let temp = [];
          responseJSON.value.map((e, i) =>
            temp.push({
              key: i,
              name: e.Name
            })
          );
          this.setState({ offers: temp });
        });
      });
    this.setState({ offerList: true });
  }

  postOfferToList() {
    let loginName = this.props.loginName;
    let offerSD = JSON.stringify(pc.localDescription);
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: offerSD
    };

    var url = `${
      this.props.siteUrl
    }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files/Add(url='${loginName}', overwrite=true)`;

    this.props.spHttpClient
      .post(url, SPHttpClient.configurations.v1, spOpts)
      .then((response: SPHttpClientResponse) => {
        console.log(`Status code: ${response.status}`);
        console.log(`Status text: ${response.statusText}`);

        response.json().then((responseJSON: JSON) => {
          console.log(responseJSON);
        });
      });
  }

  createOffer1() {
    dc = pc.createDataChannel(null);
    pc.createOffer()
      .then(function(offer) {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        this.setState({
          offerSDP: JSON.stringify(pc.localDescription)
        });

        console.log(pc.localDescription);
      });
    dcInit(dc);
  }

  start() {
    var answerDesc = new RTCSessionDescription(
      JSON.parse(this.state.offerOpponentSDP)
    );
    pc.setRemoteDescription(answerDesc);
  }

  handleChange(e) {
    if (e.target.id == "getSDP") {
      this.setState({
        offerOpponentSDP: e.target.value
      });
    }
    if (e.target.id == "offerSDP") {
      this.setState({
        answerOfferSDP: e.target.value
      });
    }
  }

  createAnswerSDP(SDP, item) {
    var offerDesc = new RTCSessionDescription(SDP);

    pc.setRemoteDescription(offerDesc);
    console.log(offerDesc);
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
        this.sendAnswerSDP(pc.localDescription, item);
      });
  }

  private getAnswerSDP() {
    let loginName = this.props.loginName;

    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('${loginName}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          this.setState({
            offerOpponentSDP: JSON.stringify(responseJSON)
          });
        });
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
      });
  }

  private _loadDocuments(): void {
    if (this.state.joinGame) {
      this.setState({
        notification: true
      });
    }
    if (this.state.startGame) {
      let loginName = this.props.loginName;

      this.props.spHttpClient
        .get(
          `${
            this.props.siteUrl
          }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('${loginName}')/$value`,
          SPHttpClient.configurations.v1
        )
        .then((response: SPHttpClientResponse) => {
          response.json().then((responseJSON: any) => {
            if (responseJSON.type == "answer") {
              this.setState({
                offerOpponentSDP: JSON.stringify(responseJSON),
                notification: true
              });
            }
          });
        });
    }
  }

  componentDidMount() {
    pc = new RTCPeerConnection(null);

    pc.onicecandidate = function(e) {
      if (e.candidate) return;
      console.log(pc.localDescription);
      //return this.postOfferToList();
    };
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

    var url = `${
      this.props.siteUrl
    }/_api/web/GetFileByServerRelativeUrl('/ticTacToe/${loginName}')`;

    this.props.spHttpClient
      .post(url, SPHttpClient.configurations.v1, spOpts)
      .then((response: SPHttpClientResponse) => {
        console.log(`Status code: ${response.status}`);
        console.log(`Status text: ${response.statusText}`);

        response.json().then((responseJSON: JSON) => {
          console.log(responseJSON);
        });
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
                      Your offer has been accepted! Press 'Start' to start the
                      game
                    </MessageBar>
                  ) : null}
                  <PrimaryButton
                    id='sendOffer'
                    text='Send Offer'
                    onClick={() => this.postOfferToList()}
                    style={{ margin: 10 }}
                  />
                  <PrimaryButton
                    id='startBtn'
                    text='Start'
                    onClick={this.start}
                    style={{ margin: 10 }}
                  />
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
                        isHeaderVisible={false}
                        layoutMode={DetailsListLayoutMode.justified}
                        selectionMode={1}
                        selectionPreservedOnEmptyClick={true}
                        onItemInvoked={this._onItemInvoked}
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

  private _onItemInvoked = (item: IDetailsListBasicExampleItem): void => {
    this.getFileOffer(item.name);
  };

  private getFileOffer(item) {
    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('${item}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          this.setState({
            answerOfferSDP: JSON.stringify(responseJSON)
          });
          this.createAnswerSDP(responseJSON, item);
        });
      });
  }

  private sendAnswerSDP(description, item) {
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pc.localDescription)
    };

    var url = `${
      this.props.siteUrl
    }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files/Add(url='${item}', overwrite=true)`;

    this.props.spHttpClient
      .post(url, SPHttpClient.configurations.v1, spOpts)
      .then((response: SPHttpClientResponse) => {
        console.log(`Status code: ${response.status}`);
        console.log(`Status text: ${response.statusText}`);

        response.json().then((responseJSON: JSON) => {
          console.log(responseJSON);
        });
      });
  }
}
