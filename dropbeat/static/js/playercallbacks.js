'use strict';

define(function () {

function CallbackManager () {
  var innerCallbacks = {
        onReady: [],
        onPlay: [],
        onPause: [],
        onFinish: [],
      };

  this.addPlayerCallbacks = function (callbacks) {
    var validKeys = ['onReady', 'onPlay', 'onPause', 'onFinish'];

    for (var i = 0; i < validKeys.length; i += 1) {
      var key = validKeys[i];

      if (key in callbacks) {
        innerCallbacks[key].push(callbacks[key]);
      }
    }
  };

  // Every players must call below 4 callbacks,
  // `onReady`, `onPlay`, `onPause` and `onFinish`.
  // Dropbeat accepts this callbacks, updates views and invokes
  // other more logics.
  this.onReady = function (event) {
    for (var i=0; i < innerCallbacks.onReady.length; i+=1) {
      innerCallbacks.onReady[i](event);
    }
  };

  this.onPlay = function (track) {
    for (var i=0; i < innerCallbacks.onPlay.length; i+=1) {
      innerCallbacks.onPlay[i](track);
    }
  };

  this.onPause = function () {
    for (var i=0; i < innerCallbacks.onPause.length; i+=1) {
      innerCallbacks.onPause[i]();
    }
  };

  this.onFinish = function () {
    for (var i=0; i < innerCallbacks.onFinish.length; i+=1) {
      innerCallbacks.onFinish[i]();
    }
  };

};

var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new CallbackManager();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance();

});
