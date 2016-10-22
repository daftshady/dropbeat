/*global YT*/
'use strict';

define(function () {

/**
 * Basic Player APIs.
 *
 * All notImplemented functions are just abstraction
 * and should be implemented in its real implementation.
 */

function PlayerBase () {
  function notImplemented () {
    throw 'NotImplementedError';
  };

  this.type = undefined;
  this.ready = false;

  this.init = notImplemented;

  this.play = notImplemented;
  this.pause = notImplemented;
  this.stop = notImplemented;

  this.seek = notImplemented;

  this.getCurrentTrack = notImplemented;

  this.getCurrentPosition = notImplemented;
  this.getDuration = notImplemented;

  this.getBuffer = notImplemented;

  this.roundPercentage = function (fraction) {
    var buffer = 0;

    if (fraction) {
      buffer = fraction * 100;
      buffer = buffer > 100 ? 100 : buffer;
      buffer = buffer < 0 ? 0 : buffer;
    }

    return buffer;
  };

  this.setPlayCallbacks = function () {
  };

  this.onPlay = function () {
  };

  this.onPause = function () {
  }

  this.onFinish = function() {
  };
};

/*
 * Youtube Player APIs.
 *
 * It has YT.Player object that plays Youtube Videos.
 * see `https://developers.google.com/youtube/iframe_api_reference`.
 */

function YoutubePlayer () {
  var id = 'youtube-player',
      playerImpl,
      playCallbacks = {
        onPlay: [],
        onPause: [],
        onFinish: [],
      };

  var onReady = function (event) {

  },

  onPlay = function (track) {
    var key;
    for (key in playCallbacks.onPlay) {
      if (playCallbacks.onPlay.hasOwnProperty(key)) {
        playCallbacks.onPlay[key](track);
      }
    }
  },

  onPause = function () {
    var key;
    for (key in playCallbacks.onPlay) {
      if (playCallbacks.onPause.hasOwnProperty(key)) {
        playCallbacks.onPause[key]();
      }
    }
  },

  onFinish = function () {
  },

  onStateChange = function (event) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        onPlay(currentTrack);
        break;
      case YT.PlayerState.PAUSED:
        onPause();
        break;
      case YT.PlayerState.ENDED:
        onFinish();
        break;
      case YT.PlayerState.UNSTARTED:
// NOTE Youtube iframe player firstly send this after loading.
      case YT.PlayerState.CUED:
// TODO Implement onLoad functionality.
      case YT.PlayerState.BUFFERING:
        break;
      default:
        throw 'No such event ' + event.data;
    }
  };


// TODO remove below `currentVideo` after implementing search.
  var currentTrack = {
    id: '-dya3o2HjAY',
    type: 'youtube',
    title: 'ZHU - automatic',
  };

  this.setPlayCallbacks = function (callbacks) {
    var key;
    for (key in callbacks) {
      if (callbacks.hasOwnProperty(key) && key in playCallbacks) {
        playCallbacks[key].push(callbacks[key]);
      }
    }
  }

  this.type = 'youtube';

  this.init = function () {
    playerImpl = new YT.Player(id, {
// TODO remove below line after search is implemented.
      videoId: '-dya3o2HjAY',
      playerVars: {},
      events: {
        onReady: onReady,
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
    if (!(playerImpl && this.ready)) {
      throw 'Youtube player is not initialized';
    }

    if (track) {
      this.currentVideo = track;
      playerImpl.loadVideoById(track.id, 0);
    } else {
      playerImpl.playVideo();
    }
  };

  this.pause = function () {
    if (playerImpl) {
      playerImpl.pauseVideo();
    }
  };

  this.stop = function () {
  };

  this.seek = function () {
  };

  this.getCurrentPosition = function () {
  };

  this.getDuration = function () {
  };

  this.getBuffer = function () {
  };
};

/*
 * SoundCloud Player APIs.
 *
 */

function SoundCloudPlayer () {
};

YoutubePlayer.prototype = new PlayerBase();
SoundCloudPlayer.prototype = new PlayerBase();

return {
  YoutubePlayer: new YoutubePlayer(),
  SoundCloudPlayer: new SoundCloudPlayer()
};

});