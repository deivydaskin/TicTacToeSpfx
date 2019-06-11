import $ from "jquery";

var pc = new RTCPeerConnection(null);
var dc;

export function createOffer() {
  dc = pc.createDataChannel("chat");
  pc.createOffer()
    .then(function(offer) {
      return pc.setLocalDescription(offer);
    })
    .then(() => $("#createSDP").val(JSON.stringify(pc.localDescription)));

  dc.onopen = function() {
    $("textarea").attr("disabled", true);
    $("#createGame").attr("disabled", true);
    $("#status1").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      console.log(e.data);
      console.log(typeof e.data);
      var str = e.data;
      var res = str.split(",");
      console.log(res);
      let event = new CustomEvent("tic", { detail: str });
      console.log(event);
      document.dispatchEvent(event);
      console.log(document.dispatchEvent(event));
    }
  };
}

export function start() {
  var answerSDP = $("#getSDP").val();
  var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
  pc.setRemoteDescription(answerDesc);
  console.log("start" + dc);
}

export const sendMSGOffer = (move, xIsNext) => {
  console.log(move);
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (value) {
    dc.send(JSON.stringify(value));
    //console.log(dc.send(value, xIsNext));
  }
};

//---non vital---
export function checkStat() {
  console.log(dc);
}
