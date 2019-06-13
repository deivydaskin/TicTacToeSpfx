import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from "@microsoft/sp-property-pane";

import * as strings from "TicTacToeWebPartStrings";
import TicTacToe from "./components/TicTacToe";
import { ITicTacToeProps } from "./components/props/ITicTacToeProps";

export interface ITicTacToeWebPartProps {
  description: string;
}

export default class TicTacToeWebPart extends BaseClientSideWebPart<
  ITicTacToeWebPartProps
> {
  public render(): void {
    const element: React.ReactElement<ITicTacToeProps> = React.createElement(
      TicTacToe,
      {
        description: this.properties.description,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        loginName: this.context.pageContext.user.displayName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
