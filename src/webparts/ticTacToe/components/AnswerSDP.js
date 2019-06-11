import $ from "jquery";

var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var pc = new RTCPeerConnection(null);
var dc;

pc.ondatachannel = function(e) {
  dc = e.channel;
  dcInit(dc);
};

function dcInit(dc) {
  dc.onopen = function() {
    $("textarea").attr("disabled", true);
    $("#joinGame").attr("disabled", true);
    $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      let event = new CustomEvent("tic", { detail: e.data });
      document.dispatchEvent(event);
    }
  };
}

function getOfferDesc() {
  return new RTCSessionDescription(JSON.parse($("#offerSDP").val()));
}

export default function createAnswerSDP() {
  var offerDesc = getOfferDesc();

  pc.setRemoteDescription(offerDesc);
  pc.createAnswer(
    function(answerDesc) {
      pc.setLocalDescription(answerDesc);
    },
    function() {
      console.warn("Couldn't create offer");
    },
    sdpConstraints
  ).then(() => $("#participantSDP").val(JSON.stringify(pc.localDescription)));
}

export const sendMSGAnswer = (move, xIsNext) => {
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (value) {
    dc.send(JSON.stringify(value));
  }
};
