'use strict';

define([
    'player'
], function (players) {

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
    youtube: 'YoutubePlayer',
    soundcloud: 'SoundCloudPlayer'
  }

  this.play = function (track) {
    if (!track) {
      throw 'Do not play with unspecified track.';
    }

    currentPlayer = players[this.TYPES[track.type]];
    if (!currentPlayer) {
      throw 'Player type ' + track.type + ' is not supported.';
    }

    currentPlayer.play(track);
  };

  this.resume = function () {
    if (!currentPlayer || !currentPlayer.getCurrentTrack()) {
      throw 'Cannot resume without playing any tracks.';
    }
    currentPlayer.play();
  };

  this.pause = function () {
    currentPlayer.pause();
  };

  this.getStatus = function () {
    return currentStatus;
  };

  this.setPlayCallbacks = function (callbacks) {
    var key;
    for (key in players) {
      if (players.hasOwnProperty(key)) {
        players[key].setPlayCallbacks(callbacks);
      }
    }
  }

// TODO Fix this status after implementing search.
  currentStatus = this.STATUS.PAUSED;

// NOTE this manager var should be assigned to `this`. (PlayerManager obj)
// Because Youtube's iframe api calls this callbacks with changed context.
// After this, `this` will lose our context. (maybe it will be null)
  var manager = this;
  this.setPlayCallbacks({
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

  currentPlayer = players.YoutubePlayer;
};

return new PlayerManager();

});
