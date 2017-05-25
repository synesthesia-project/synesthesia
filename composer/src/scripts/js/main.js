'use strict';

// Setup Externals
var ShadowDOM = require('../../bower_components/ReactShadow/dist/react-shadow');
var stage = require('./components/stage');

window.externals = {
  ShadowDOM: ShadowDOM.default
};

// Start
function start() {
    stage.setup();
}
start();
