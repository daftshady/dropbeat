'use strict';

define([
    'player'
], function (players) {

/**
 * Player Manager APIs.
 * This manager work for managing playlist, play callbacks and etc.
 */

function PlayerManager () {
  var manager = this;
  var currentTrack, currentPlayer, currentStatus;

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
    if (!track && currentTrack) {

// resume paused track.
      currentPlayer.play();

    } else if (!track) {
      throw 'Do not play with unspecified track.';

    } else {
      currentTrack = track;
      currentPlayer = players[this.TYPES[track.type]];

      if (!currentPlayer) {
        throw 'Player type ' + track.type + ' is not supported.';
      }

      currentPlayer.play(track);
    }
  };

  this.pause = function () {
    if (currentPlayer && currentStatus === this.STATUS.PLAYING) {
      currentPlayer.pause();
    }
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

// TODO Fix this status & track info after implementing search.
  currentStatus = this.STATUS.PAUSED;
  currentTrack = {
    id: '-aJH5WhyLro',
    type: 'youtube',
    title: 'Furture house yearmix 2016',
  };

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
