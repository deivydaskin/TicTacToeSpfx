import {
  SPHttpClient,
  SPHttpClientResponse,
  ISPHttpClientOptions
} from "@microsoft/sp-http";

export const postOfferToList = (name, body, siteUrl, spHttpClient, libId) => {
  let spOpts: ISPHttpClientOptions = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };

  console.log(JSON.stringify(body));

  var url = `${siteUrl}/_api/web/lists(guid'${libId}')/rootfolder/files/add(url='${name}',overwrite=true)`;

  spHttpClient
    .post(url, SPHttpClient.configurations.v1, spOpts)
    .then((response: SPHttpClientResponse) => {
      console.log(`Status code: ${response.status}`);
      console.log(`Status text: ${response.statusText}`);

      response.json().then((responseJSON: JSON) => {
        console.log(responseJSON);
      });
    })
    .catch(err => console.log(err));
};
