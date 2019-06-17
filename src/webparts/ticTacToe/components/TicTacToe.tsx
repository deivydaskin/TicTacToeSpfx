import * as React from "react";
import styles from "./TicTacToe.module.scss";
import { ITicTacToeProps } from "./props/ITicTacToeProps";
import Game from "./Game";
//import { createOffer, start, returnOfferSDP } from "./OfferSDP";
//import createAnswerSDP from "./AnswerSDP";
//import API from "./API";
import {
  SPHttpClient,
  SPHttpClientResponse,
  SPHttpClientConfiguration,
  ISPHttpClientOptions
} from "@microsoft/sp-http";
import { Fabric } from "office-ui-fabric-react/lib/Fabric";
import { TextField } from "office-ui-fabric-react/lib/TextField";
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

const exampleChildClass = mergeStyles({
  display: "block",
  marginBottom: "10px"
});

var pc, dc;
var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var fferSDP;
var ejimas = true;
var isSet = false;
var lengthOfOffer = 0;

export const sendMSGOffer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (ejimas) {
    if (value) {
      dc.send(JSON.stringify(value));
    }
  }
  ejimas = !ejimas;
};

export const sendMSGAnswer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (!ejimas) {
    if (value) {
      dc.send(JSON.stringify(value));
    }
  }
  ejimas = !ejimas;
};

function dcInit(dc) {
  dc.onopen = function() {
    // $("textarea").attr("disabled", true);
    // $("#joinGame").attr("disabled", true);
    // $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      let event = new CustomEvent("tic", { detail: e.data });
      document.dispatchEvent(event);
    }
  };
}

interface IState {
  start: boolean;
  join: boolean;
  offers: string[];
  offerSDP: string;
  offerOpponentSDP: string;
  answerOfferSDP: string;
  answerAnswerSDP: string;
  status: string;
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
      start: false,
      join: false,
      offers: [],
      offerSDP: "",
      offerOpponentSDP: "",
      answerOfferSDP: "",
      answerAnswerSDP: "",
      status: "",
      selectionDetails: this._getSelectionDetails()
    };
    this.handleClick = this.handleClick.bind(this);
    this.getOfferList = this.getOfferList.bind(this);
    this.createOffer1 = this.createOffer1.bind(this);
    this.start = this.start.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createAnswerSDP = this.createAnswerSDP.bind(this);
    this.getAnswerSDP = this.getAnswerSDP.bind(this);
  }

  private handleClick(e): void {
    if (e.target.id == "createGame") {
      this.setState({
        start: !this.state.start
      });
      this.createOffer1();
    }
    if (e.target.id == "joinGame") {
      this.setState({
        join: !this.state.join
      });
    }
    if (e.target.id == "offerList") {
      console.log(e.taget.id);
    }
  }

  getOfferList() {
    ///_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('tictactest.json')/$value
    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          // this.setState({
          //   offers: responseJSON.value
          // });
          let temp = [];
          responseJSON.value.map((e, i) =>
            temp.push({
              key: i,
              name: e.Name
            })
          );
          console.log(temp);
          this.setState({ offers: temp });
        });
      });
  }

  postOfferToList() {
    //console.log(returnOfferSDP());

    let loginName = this.props.loginName;
    let offerSD = this.state.offerSDP;
    console.log(loginName);
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
        console.log(JSON.stringify(fferSDP).length);
        this.postOfferToList();
      });

    dc.onopen = function() {
      // $("textarea").attr("disabled", true);
      // $("#createGame").attr("disabled", true);
      // $("#status").val("CONNECTED!");
      console.log("CONNECTED!");
      this.setStatus();
    };

    dc.onmessage = function(e) {
      if (e.data) {
        let event = new CustomEvent("tic", { detail: e.data });
        document.dispatchEvent(event);
      }
    };
  }

  setStatus = () => {
    this.setState({
      status: "CONNECTED!"
    });
  };

  start() {
    var answerSDP = this.state.offerOpponentSDP;
    var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
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

  getOfferDesc() {
    return JSON.parse(this.state.answerOfferSDP);
  }

  createAnswerSDP(SDP) {
    var offerDesc = SDP;
    let answer;
    pc.setRemoteDescription(offerDesc);
    pc.createAnswer(
      function(answerDesc) {
        pc.setLocalDescription(answerDesc);
        answer = pc.localDescription;
      },
      function() {
        console.warn("Couldn't create offer");
      },
      sdpConstraints
    ).then(() => {
      this.setState({
        answerAnswerSDP: JSON.stringify(pc.localDescription)
      });
      console.log(this.state.answerAnswerSDP);
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
        //let str = JSON.stringify(response).slice(0,);
        response.json().then((responseJSON: any) => {
          this.setState({
            offerOpponentSDP: JSON.stringify(responseJSON)
          });
        });
      });
  }

  createListSubscription(): void {
    console.log("Subscription connected!");
    this._listSubscriptionFactory = new ListSubscriptionFactory(this.context);
    this._listSubscription = this._listSubscriptionFactory.createSubscription({
      listId: Guid.parse(this.props.libraryId),
      callbacks: {
        notification: this._loadDocuments.bind(this),
        connect: this._subscriptionConnected.bind(this)
      }
    });
  }

  private _subscriptionConnected(): void {
    console.log("Subscription connected!");
  }

  private _loadDocuments(): void {
    console.log("got new subscription notification!");
  }

  componentDidMount() {
    //this.createListSubscription.bind(this);

    pc = new RTCPeerConnection(null);
    dc;

    pc.ondatachannel = function(e) {
      dc = e.channel;
      dcInit(dc);
    };
  }

  public render(): React.ReactElement<ITicTacToeProps> {
    var data = this.state.offers;

    console.log(data);
    const selectionDetails = this.state.selectionDetails;

    console.log(data[1]);

    return (
      <div className={styles.ticTacToe}>
        <div className={styles.container}>
          <div className={styles.row}>
            <button id='createGame' onClick={this.handleClick}>
              Create Game
            </button>
            <button id='joinGame' onClick={this.handleClick}>
              Join Game
            </button>
            <legend>Status</legend>
            <input
              id='status'
              disabled
              value={this.state.status}
              placeholder='Not Connected.'
            />
            <div className={styles.column}>
              {this.state.start ? (
                <div>
                  {/* <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='createSDP'
                    placeholder='Your SDP'
                    readOnly
                    value={this.state.offerSDP}
                  /> */}
                  <button onClick={this.getAnswerSDP}>Get Answer SDP</button>
                  <button
                    id='startBtn'
                    onClick={this.start}
                    style={{ margin: 10 }}
                  >
                    Start
                  </button>
                  {/* <legend>
                    Paste your opponent's SDP here and press 'Start'
                  </legend>
                  <textarea
                    id='getSDP'
                    placeholder="Get your opponenet's SDP"
                    style={{ marginBottom: 20 }}
                    value={this.state.offerOpponentSDP}
                    onChange={this.handleChange}
                  /> */}
                  <Game />
                </div>
              ) : null}
              {this.state.join ? (
                <div>
                  {/* <legend>
                    Paste your opponent's SDP here and press 'CreateSDP'
                  </legend>
                  <textarea
                    id='offerSDP'
                    placeholder='Paste offer SDP'
                    onChange={this.handleChange}
                    value={this.state.answerOfferSDP}
                  /> */}
                  <button
                    id='createSDPBtn'
                    onClick={this.createAnswerSDP}
                    style={{ margin: 10 }}
                  >
                    CreateSDP
                  </button>
                  {/* <legend>Copy this SDP and send it to your opponent</legend>
                  <textarea
                    id='participantSDP'
                    placeholder='create participant SDP'
                    readOnly
                    style={{ marginBottom: 20 }}
                    value={this.state.answerAnswerSDP}
                  /> */}
                  <button onClick={this.getOfferList}>Show Offer List</button>
                  <Fabric>
                    <div className={exampleChildClass}>{selectionDetails}</div>
                    {/* <TextField
                      className={exampleChildClass}
                      label='Filter by name:'
                      // onChange={this._onFilter}
                      styles={{ root: { maxWidth: "300px" } }}
                    /> */}
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

  // private _onFilter = (
  //   ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  //   text: string
  // ): void => {
  //   this.setState({
  //     items: text
  //       ? this._allItems.filter(i => i.name.toLowerCase().indexOf(text) > -1)
  //       : this._allItems
  //   });
  // };

  private _onItemInvoked = (item: IDetailsListBasicExampleItem): void => {
    this.getFileOffer(item.name);
  };

  private getFileOffer(item) {
    let responseString = "";

    this.props.spHttpClient
      .get(
        `${
          this.props.siteUrl
        }/_api/web/GetFolderByServerRelativeUrl('/ticTacToe')/Files('${item}')/$value`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        //let str = JSON.stringify(response).slice(0,);
        response.json().then((responseJSON: any) => {
          this.setState({
            answerOfferSDP: JSON.stringify(responseJSON)
          });
          this.createAnswerSDP(responseJSON);
        });
      })
      .then(() => {
        if (
          this.state.answerAnswerSDP &&
          this.state.answerAnswerSDP !== "null"
        ) {
          this.sendAnswerSDP(item);
          console.log("checked");
        }
      });
  }

  private sendAnswerSDP(item) {
    let spOpts: ISPHttpClientOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: this.state.answerAnswerSDP
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
