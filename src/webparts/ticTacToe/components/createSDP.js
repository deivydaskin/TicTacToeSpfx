var sdpConstraints = { optional: [{ RtpDataChannels: true }] };
var pc = new RTCPeerConnection(null);
var dc;
pc.oniceconnectionstatechange = function(e) {
  var state = pc.iceConnectionState;
  $("#status").html(state);
  if (state == "connected") $("#msg, #send").attr("disabled", false);
};
pc.onicecandidate = function(e) {
  if (e.candidate) return;
  $("#createSDP").val(JSON.stringify(pc.localDescription));
};
function createOfferSDP() {
  dc = pc.createDataChannel("chat");
  pc.createOffer().then(function(e) {
    pc.setLocalDescription(e);
  });
  dc.onopen = function() {
    $("textarea").attr("disabled", true);
    addMSG("CONNECTED!", "info");
  };
  dc.onmessage = function(e) {
    if (e.data) addMSG(e.data, "other");
  };
}
function start() {
  var answerSDP = $("#joiner-sdp").val();
  var answerDesc = new RTCSessionDescription(JSON.parse(answerSDP));
  pc.setRemoteDescription(answerDesc);
}
var addMSG = function(msg, who) {
  var wrap = $("<div>")
    .addClass("wrap")
    .appendTo($("#chat-screen"));
  var div = $("<div>")
    .addClass(who)
    .appendTo(wrap);
  $("<span>")
    .html(who)
    .addClass("who")
    .appendTo(div);
  $("<span>")
    .html(msg)
    .addClass("msg")
    .appendTo(div);
  $("#chat-screen-wp").scrollTop($("#chat-screen").height());
};
createOfferSDP();
var sendMSG = function() {
  var value = $("#msg").val();
  if (value) {
    dc.send(value);
    addMSG(value, "me");
    $("#msg").val("");
  }
};
$("#start").click(function() {
  start();
});
$("#msg").keypress(function(e) {
  if (e.which == 13) {
    sendMSG();
  }
});
$("#send").click(sendMSG);
