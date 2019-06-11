import $ from "jquery";

var pc = new RTCPeerConnection(null);
var dc;

export function createOffer() {
  dc = pc.createDataChannel("ticTacToe");
  pc.createOffer()
    .then(function(offer) {
      return pc.setLocalDescription(offer);
    })
    .then(() => $("#createSDP").val(JSON.stringify(pc.localDescription)));

  dc.onopen = function() {
    $("textarea").attr("disabled", true);
    $("#createGame").attr("disabled", true);
    $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      let event = new CustomEvent("tic", { detail: e.data });
      document.dispatchEvent(event);
    }
  };
}

export function start() {
  var answerSDP = $("#getSDP").val();
  var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
  pc.setRemoteDescription(answerDesc);
}

export const sendMSGOffer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (value) {
    dc.send(JSON.stringify(value));
  }
};
