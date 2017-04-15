declare var consts: {
  numberOfLeds: number;
}

(() => {

  const leds: JQuery[] = [];

  const $leds = $('#leds');
  for (let i = 0; i < consts.numberOfLeds; i++) {
    leds.push($('<div/>').addClass('led').appendTo($leds));
  }

  function updateLeds(arr: Uint8Array) {
    if (leds.length * 3 !== arr.length) {
      throw new Error("unexpected array length: " + arr.length);
    }
    for (let i = 0; i < leds.length; i ++) {
      const j = i * 3;
      leds[i].css('background-color', 'rgb(' + arr[j] + ',' + arr[j + 1] + ',' + arr[j+2] + ')');
    }
  }

  var socket = new WebSocket("ws://localhost:8126/");

  socket.onmessage = e => {
    const fileReader = new FileReader();
    fileReader.onload = result => {
      updateLeds(new Uint8Array(fileReader.result));
    }
    fileReader.readAsArrayBuffer(e.data);
  }

})();
