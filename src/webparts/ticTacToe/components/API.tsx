import * as React from "react";
import {
  SPHttpClient,
  SPHttpClientResponse,
  SPHttpClientConfiguration
} from "@microsoft/sp-http";

export default class API extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.context.spHttpClient
      .get(
        `${
          this.context.pageContext.web.absoluteUrl
        }/_api/lists('48a6ddfe-534a-425a-9696-76b98610eb20')/items`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        response.json().then((responseJSON: any) => {
          console.log(responseJSON);
        });
      });
  }

  public render(): React.ReactElement<any> {
    return (
      <div>
        <button onClick={this.handleClick}>Get</button>
      </div>
    );
  }
}
