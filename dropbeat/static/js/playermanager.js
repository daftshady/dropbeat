'use strict';

define([
  'api', 'playercallback'
], function (api, playerCallback) {

/**
 * Basic Player APIs.
 *
 * All notImplemented functions are just abstraction
 * and should be implemented in its real implementation.
 */

var PLAYER_STATUS = {
  NOT_STARTED: -1,
  STOPPED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

function PlayerBase () {
  function notImplemented () {
    throw 'NotImplementedError';
  };

  this.type = undefined;
  this.ready = false;
  this.currentStatus = PLAYER_STATUS.NOT_STARTED;

  this.init = notImplemented;
  this.play = notImplemented;
  this.pause = notImplemented;
  this.stop = notImplemented;

  this.seek = notImplemented;

  this.getCurrentTrack = notImplemented;

  this.getCurrentPosition = notImplemented;
  this.getDuration = notImplemented;

  this.getBuffer = notImplemented;

  this.getStatus = function () {
    return this.currentStatus;
  };

  this.roundPercentage = function (fraction) {
    var buffer = 0;

    if (fraction) {
      buffer = fraction * 100;
      buffer = buffer > 100 ? 100 : buffer;
      buffer = buffer < 0 ? 0 : buffer;
    }

    return buffer;
  };
};

/*
 * Youtube Player APIs.
 *
 * It has YT.Player object that plays Youtube Videos.
 * see `https://developers.google.com/youtube/iframe_api_reference`.
 */

function YoutubePlayer () {
  var that = this, playerImpl, currentTrack;

  var onStateChange = function (event) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        playerCallback.onPlay(currentTrack);
        that.currentStatus = PLAYER_STATUS.PLAYING;
        break;
      case YT.PlayerState.PAUSED:
        playerCallback.onPause();
        that.currentStatus = PLAYER_STATUS.PAUSED;
        break;
      case YT.PlayerState.ENDED:
        playerCallback.onFinish();
        that.currentStatus = PLAYER_STATUS.STOPPED;
        break;
      case YT.PlayerState.UNSTARTED:
// NOTE Youtube iframe player firstly send this after loading.
      case YT.PlayerState.CUED:
// TODO Implement onLoad functionality.
      case YT.PlayerState.BUFFERING:
        that.currentStatus = PLAYER_STATUS.BUFFERING;
        break;
      default:
        throw 'No such event ' + event.data;
    }
  };

  this.type = api.playerTypes.youtube;

  this.init = function () {
    playerImpl = new YT.Player('youtube-player', {
      videoId: 'x',
      playerVars: {},
      events: {
        onReady: playerCallback.onReady,
        onStateChange: onStateChange,
        onPlaybackQualityChange: null,
        onPlaybackRateChange: null,
        onError: null,
        onApiChange: null,
      },
    });

    this.ready = true;
  };

  this.getCurrentTrack = function () {
    return currentTrack;
  };

  this.play = function (track) {
    if (!(playerImpl !== undefined && this.ready)) {
      throw 'Youtube player is not initialized';
    }

    if (track !== undefined) {
      currentTrack = track;
      playerImpl.loadVideoById(track.uid);
    }
  };

  this.resume = function () {
    playerImpl.playVideo();
  }

  this.pause = function () {
    if (playerImpl !== undefined) {
      playerImpl.pauseVideo();
    }
  };

  this.stop = function () {
  };

  this.seek = function (pos) {
    if (currentTrack !== null) {
      playerImpl.seekTo(pos, true);
    }
  };

  this.getCurrentPosition = function () {
    return playerImpl.getCurrentTime();
  };

  this.getDuration = function () {
    if (currentTrack !== null) {
      return playerImpl.getDuration();
    }
  };

  this.getBuffer = function () {
    return this.roundPercentage(playerImpl.getVideoLoadedFraction());
  };
};

/*
 * SoundCloud Player APIs.
 *
 */

function SoundCloudPlayer () {
  this.init = function () {
  };
};


YoutubePlayer.prototype = new PlayerBase();
SoundCloudPlayer.prototype = new PlayerBase();

/**
 * Player Manager APIs.
 * As player implementation varies by streaming sources, we need manager
 * to control multiple players in a single interface.
 */

function PlayerManager () {

  this.players = [
    new YoutubePlayer(),
    new SoundCloudPlayer()
  ];

  this.currentPlayer = this.players.YoutubePlayer;

  this.init = function () {
    for (var i = 0; i < this.players.length; i += 1) {
      this.players[i].init();
    }
  };

  this.play = function (track) {
    if (track === undefined) {
      throw 'Do not play with unspecified track.';
    }

    // Source value for youtube: 0
    // Source value for soundcloud: 1
    this.currentPlayer = this.players[Number(track.source)];
    this.currentPlayer.play(track);
  };

  this.resume = function () {
    if (this.isPaused()) {
      this.currentPlayer.resume();
    }
  };

  this.pause = function () {
    this.currentPlayer.pause();
  };

  this.seek = function (pos) {
    this.currentPlayer.seek(pos);
  }

  this.getStatus = function () {
    return this.currentPlayer.currentStatus;
  };

  this.getDuration = function () {
    return this.currentPlayer.getDuration();
  };

  this.getBuffer = function () {
    return this.currentPlayer.getBuffer();
  };

  this.getCurrentPosition = function () {
    return this.currentPlayer.getCurrentPosition();
  };

  this.getCurrentPlayer = function () {
    return this.currentPlayer;
  };

  this.getCurrentTrack = function () {
    return this.currentPlayer.getCurrentTrack();
  };

  this.isNotStarted = function () {
    return this.getStatus() === PLAYER_STATUS.NOT_STARTED;
  };

  this.isPlaying = function () {
    return this.getStatus() === PLAYER_STATUS.PLAYING;
  };

  this.isPaused = function () {
    return this.getStatus() === PLAYER_STATUS.PAUSED;
  };

  this.isStopped = function () {
    return this.getStatus() === PLAYER_STATUS.STOPPED;
  };
};

// Manager object needs to be singleton.
var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new PlayerManager();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance();

});
