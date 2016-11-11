/// <reference path="../../typings/index.d.ts"/>

const timestamps: number[] = [];

// Elements
function fileInput() {
  return <HTMLInputElement> $('#file_picker').get(0);
}

function audio() {
  return <HTMLAudioElement> $('#audio').get(0);
}

export function start(): void {
  console.log("start")
  console.log($);

  $('#file_picker').change(loadAudioFile);
  $(window).keydown(keydown);
}

function loadAudioFile() {
  const file = fileInput().files[0];
  console.debug('file', file);
  audio().src = URL.createObjectURL(document.getElementsByTagName('input')[0].files[0]);
  audio().playbackRate = 0.5;
}

function keydown(e: JQueryEventObject) {
  timestamps.push(Math.round(audio().currentTime * 1000));
  console.info(timestamps);
}
