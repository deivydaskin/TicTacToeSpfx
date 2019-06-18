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
  Selection,
  IColumn
} from "office-ui-fabric-react/lib/DetailsList";
import { MarqueeSelection } from "office-ui-fabric-react/lib/MarqueeSelection";
import { mergeStyles } from "office-ui-fabric-react/lib/Styling";
import {
  ListSubscriptionFactory,
  IListSubscription
} from "@microsoft/sp-list-subscription";
import { Guid } from "@microsoft/sp-core-library";
import { PrimaryButton } from "office-ui-fabric-react";

const exampleChildClass = mergeStyles({
  display: "block",
  marginBottom: "10px"
});

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
  dc.onopen = function() {
    console.log("Connected");
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
  status: string;
  selectionDetails: {};
  offerList: boolean;
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
  private _selection: Selection;
  private _allItems: IDetailsListBasicExampleItem[];
  private _columns: IColumn[];
  _listSubscriptionFactory: ListSubscriptionFactory;
  _listSubscription: IListSubscription;

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
      status: "",
      selectionDetails: this._getSelectionDetails(),
      offerList: false
    };

    this.handleClick = this.handleClick.bind(this);
    this.getOfferList = this.getOfferList.bind(this);
    this.createOffer1 = this.createOffer1.bind(this);
    this.start = this.start.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
    this.getAnswerSDP = this.getAnswerSDP.bind(this);
    this.createListSubscription = this.createListSubscription.bind(this);
    this.setStatus = this.setStatus.bind(this);
  }

  private handleClick(e): void {
    if (e.target.id == "createGame") {
      this.setState({
        startGame: !this.state.startGame
      });
      this.createOffer1();
      this.createListSubscription();
    }
    if (e.target.id == "joinGame") {
      this.setState({
        joinGame: !this.state.joinGame
      });
      this.createListSubscription();
      pc.ondatachannel = function(e) {
        dc = e.channel;
        dcInit(dc);
      };
    }
    if (e.target.id == "hideOfferList") {
      this.setState({ offerList: false });
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
    let offerSD = this.state.offerSDP;
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
    dc = pc.createDataChannel("ticTacToe");
    pc.createOffer()
      .then(function(offer) {
        pc.setLocalDescription(offer);
        fferSDP = offer;
      })
      .then(() => {
        this.setState({
          offerSDP: JSON.stringify(fferSDP)
        });
        this.postOfferToList();
      });
    dcInit(dc);
  }

  setStatus() {
    this.setState({
      status: "CONNECTED!"
    });
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
          notification: this._loadDocuments.bind(this),
        }
      })
      .then(listSubscription => {
        this._listSubscription = listSubscription;
      });
  }

  private _loadDocuments(): void {
    if (this.state.joinGame) {
      console.log(
        "Got a new game offer! Press 'Show offers' to refresh the list"
      );
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
                offerOpponentSDP: JSON.stringify(responseJSON)
              });
              console.log(
                "Your offer has been accepted! Press 'Start' to start the game"
              );
            }
          });
        });
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

  public render(): React.ReactElement<ITicTacToeProps> {
    var data = this.state.offers;
    const selectionDetails = this.state.selectionDetails;

    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <PrimaryButton id='createGame' onClick={this.handleClick}>
              Create Game
            </PrimaryButton>
            <PrimaryButton id='joinGame' onClick={this.handleClick}>
              Join Game
            </PrimaryButton>
            <legend>Status</legend>
            <input
              id='status'
              disabled
              value={this.state.status}
              placeholder='Not Connected.'
            />
            <div className={styles.column}>
              {this.state.startGame ? (
                <div>
                  <PrimaryButton
                    id='startBtn'
                    onClick={this.start}
                    style={{ margin: 10 }}
                  >
                    Start
                  </PrimaryButton>
                  <Game />
                </div>
              ) : null}
              {this.state.joinGame ? (
                <div>
                  <PrimaryButton onClick={this.getOfferList}>
                    Show Offer List
                  </PrimaryButton>
                  <PrimaryButton id='hideOfferList' onClick={this.handleClick}>
                    Hide Offer List
                  </PrimaryButton>
                  {this.state.offerList ? (
                    <Fabric>
                      <div className={exampleChildClass}>
                        {selectionDetails}
                      </div>
                      <MarqueeSelection selection={this._selection}>
                        <DetailsList
                          items={data}
                          columns={this._columns}
                          setKey='set'
                          layoutMode={DetailsListLayoutMode.fixedColumns}
                          selection={this._selection}
                          selectionPreservedOnEmptyClick={true}
                          ariaLabelForSelectionColumn='Toggle selection'
                          ariaLabelForSelectAllCheckbox='Toggle selection for all items'
                          onItemInvoked={this._onItemInvoked}
                        />
                      </MarqueeSelection>
                    </Fabric>
                  ) : null}
                  <Game />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private _getSelectionDetails(): string {
    const selectionCount = this._selection.getSelectedCount();

    switch (selectionCount) {
      case 0:
        return "No items selected";
      case 1:
        return (
          "1 item selected: " +
          (this._selection.getSelection()[0] as IDetailsListBasicExampleItem)
            .name
        );
      default:
        return `${selectionCount} items selected`;
    }
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
      body: JSON.stringify(description)
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
