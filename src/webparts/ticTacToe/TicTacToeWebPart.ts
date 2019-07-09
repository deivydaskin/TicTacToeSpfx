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
import { PropertyFieldTextWithCallout } from "@pnp/spfx-property-controls/lib/PropertyFieldTextWithCallout";
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy
} from "@pnp/spfx-property-controls/lib/PropertyFieldListPicker";
import { CalloutTriggers } from "@pnp/spfx-property-controls/lib/PropertyFieldHeader";
import { ListSubscriptionFactory } from "@microsoft/sp-list-subscription";

export interface ITicTacToeWebPartProps {
  description: string;
  tictactoeLibraryId: string;
  siteUrl?: string;
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
        loginName: this.context.pageContext.user.loginName,
        libraryId: this.properties.tictactoeLibraryId,
        listSubscriptionFactory: new ListSubscriptionFactory(this)
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
            description: strings.Description
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyFieldTextWithCallout("siteUrl", {
                  calloutTrigger: CalloutTriggers.Click,
                  key: "siteUrlFieldId",
                  label: strings.SiteUrlLabel,
                  calloutContent: React.createElement(
                    "span",
                    {},
                    strings.Description
                  ),
                  calloutWidth: 250,
                  value: this.properties.siteUrl
                }),
                PropertyFieldListPicker("tictactoeLibraryId", {
                  label: strings.DocumentLibraryLabel,
                  selectedList: this.properties.tictactoeLibraryId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: "listPickerFieldId",
                  webAbsoluteUrl: this.properties.siteUrl,
                  baseTemplate: 101
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
