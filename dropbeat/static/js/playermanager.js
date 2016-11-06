'use strict';

define([
  'player', 'api'
], function (players, api) {

/**
 * Player Manager APIs.
 * This manager work for managing playlist, play callbacks and etc.
 */

function PlayerManager () {
  var currentPlayer, currentStatus;

  this.STATUS = {
    NOT_STARTED: -1,
    STOPPED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
  };

  this.TYPES = {
    '0': 'YoutubePlayer',
    '1': 'SoundCloudPlayer'
  };

  this.play = function (track) {
    if (track === undefined) {
      throw 'Do not play with unspecified track.';
    }

    currentPlayer = players[this.TYPES[track.source]];
    if (currentPlayer === undefined) {
      throw 'Player type ' + track.source + ' is not supported.';
    }

    currentPlayer.play(track);
  };

  this.resume = function () {
    if (currentStatus === this.STATUS.PAUSED) {
      currentPlayer.resume();
    }
  };

  this.pause = function () {
    currentPlayer.pause();
  };

  this.seek = function (pos) {
    currentPlayer.seek(pos);
  }

  this.getStatus = function () {
    return currentStatus;
  };

  this.getDuration = function () {
    return currentPlayer.getDuration();
  };

  this.getBuffer = function () {
    return currentPlayer.getBuffer();
  };

  this.getCurrentPosition = function () {
    return currentPlayer.getCurrentPosition();
  };

  this.setPlayCallbacks = function (callbacks) {
    var key;
    for (key in players) {
      if (players.hasOwnProperty(key)) {
        players[key].setPlayCallbacks(callbacks);
      }
    }
  };

  this.getCurrentPlayer = function () {
    return currentPlayer;
  };

  this.getCurrentTrack = function () {
    return currentPlayer.getCurrentTrack();
  };

// NOTE this manager var should be assigned to `this`. (PlayerManager obj)
// Because Youtube's iframe api calls this callbacks with changed context.
// After this, `this` will lose our context. (maybe it will be null)
  var manager = this;
  this.setPlayCallbacks({
    onReady: function (event) {
      currentStatus = manager.STATUS.STOPPED;
    },
    onPlay: function (track) {
      currentStatus = manager.STATUS.PLAYING;
    },
    onPause: function () {
      currentStatus = manager.STATUS.PAUSED;
    },
    onFinish: function () {
      currentStatus = manager.STATUS.STOPPED;
    },
  });

  currentStatus = this.STATUS.NOT_STARTED;
};

// NOTE returning `new PlayerManager()` constructs each different object
// when we import this module multiple times. Because it breaks `player`
// module's consistency, we made it to singletone and provide
// as factory method.
var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new PlayerManager();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance;

});
