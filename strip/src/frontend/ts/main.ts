(() => {

  var socket = new WebSocket("ws://localhost:8120/strip");

  socket.onmessage = event => {
    const msg: synesthesia.strip_controller_api.ServerMessage = JSON.parse(event.data);
    console.log('event', msg);
    if (msg.state) {
    }
  }

  this.window.updateState = (msg: synesthesia.strip_controller_api.ClientMessage) => socket.send(JSON.stringify(msg));

})();
