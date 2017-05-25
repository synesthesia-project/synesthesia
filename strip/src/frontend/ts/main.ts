(() => {

  const socket = new WebSocket(`ws://${window.location.hostname}:8120/strip`);

  const formElements = {
    primaryArtifacts: $('#primaryArtifacts'),
    secondaryArtifacts: $('#secondaryArtifacts'),
    sparkliness: $('#sparkliness')
  };

  socket.onmessage = event => {
    const msg: synesthesia.strip_controller_api.ServerMessage = JSON.parse(event.data);
    console.log('event', msg);
    if (msg.state) {
      formElements.primaryArtifacts.val(msg.state.primaryArtifacts);
      formElements.secondaryArtifacts.val(msg.state.secondaryArtifacts);
      formElements.sparkliness.val(msg.state.sparkliness);
    }
  };

  const updateState = (state: Partial<synesthesia.strip_controller_api.StripState>) => {
    const msg: synesthesia.strip_controller_api.ClientMessage = {
      updateState: state
    };
    socket.send(JSON.stringify(msg));
  };

  // Add listeners to Dom
  formElements.primaryArtifacts.on('change', () =>
    updateState({primaryArtifacts: formElements.primaryArtifacts.val()})
  );
  formElements.secondaryArtifacts.on('change', () =>
    updateState({secondaryArtifacts: formElements.secondaryArtifacts.val()})
  );
  formElements.sparkliness.on('change', () =>
    updateState({sparkliness: formElements.sparkliness.val()})
  );

  // Expose Update State via window
  this.window.updateState = (msg: synesthesia.strip_controller_api.ClientMessage) => socket.send(JSON.stringify(msg));

})();
