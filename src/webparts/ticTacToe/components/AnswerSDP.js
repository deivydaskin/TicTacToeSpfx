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
    $("#status1").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      console.log(e);
      //console.log(typeof e.data);
      var str = e.data;
      var res = str.split(",");
      //console.log(res);
      let event = new CustomEvent("tic", { detail: str });
      //console.log(event);
      document.dispatchEvent(event);
      //console.log(pc);
    }
  };
}

export default function createAnswerSDP() {
  var offerDesc = new RTCSessionDescription(JSON.parse($("#offerSDP").val()));

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
  //console.log(move);
  var value = {
    figures: move,
    xIsNext: xIsNext
  };
  if (value) {
    dc.send(JSON.stringify(value));
    //console.log(dc.send(value, xIsNext));
  }
};

export function getMove() {
  return pc;
}
