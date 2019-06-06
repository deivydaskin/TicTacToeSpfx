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
    $("#status").val("CONNECTED!");
  };
  dc.onmessage = function(e) {
    if (e.data) console.log(e.data);
  };
}

export function start() {
  var answerSDP = $("#getSDP").val();
  var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
  pc.setRemoteDescription(answerDesc);
  console.log("start" + dc);
}

export function checkStat() {
  console.log(dc);
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
