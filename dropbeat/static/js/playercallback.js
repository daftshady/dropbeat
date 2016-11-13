'use strict';

define(function () {

function PlayerCallback () {
  var callbacks = {
    onReady: [],
    onPlay: [],
    onPause: [],
    onFinish: [],
  };

  this.addCallbacks = function (newCallbacks) {
    var keys = Object.keys(callbacks);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];

      if (key in newCallbacks) {
        callbacks[key].push(newCallbacks[key]);
      }
    }
  };

  // Every players must call below 4 callbacks,
  // `onReady`, `onPlay`, `onPause` and `onFinish`.
  // Dropbeat accepts this callbacks, updates views and invokes
  // other more logics.
  this.onReady = function (event) {
    for (var i = 0; i < callbacks.onReady.length; i += 1) {
      callbacks.onReady[i](event);
    }
  };

  this.onPlay = function (track) {
    for (var i = 0; i < callbacks.onPlay.length; i += 1) {
      callbacks.onPlay[i](track);
    }
  };

  this.onPause = function () {
    for (var i = 0; i < callbacks.onPause.length; i += 1) {
      callbacks.onPause[i]();
    }
  };

  this.onFinish = function () {
    for (var i = 0; i < callbacks.onFinish.length; i += 1) {
      callbacks.onFinish[i]();
    }
  };

};

var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new PlayerCallback();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance();

});
