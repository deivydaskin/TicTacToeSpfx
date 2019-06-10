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
    $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) {
      console.log(e.data);
      console.log(typeof e.data);
      var str = e.data;
      var res = str.split(",");
      console.log(res);
      let event = new CustomEvent("tic", { detail: res });
      console.log(event);
      document.dispatchEvent(event);
      console.log(document.dispatchEvent(event));
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

var sendMSG = function() {
  var value = $("#msg").val();
  if (value) {
    dc.send(value);
    $("#msg").val("");
  }
};

$("#msg").keypress(function(e) {
  if (e.which == 13) {
    sendMSG();
  }
});

$("#send").click(sendMSG);
