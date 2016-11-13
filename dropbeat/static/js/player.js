/*global YT*/
'use strict';

define([
  'api', 'playercallbacks'
], function (api, callbacks) {

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
};

/*
 * Youtube Player APIs.
 *
 * It has YT.Player object that plays Youtube Videos.
 * see `https://developers.google.com/youtube/iframe_api_reference`.
 */

function YoutubePlayer () {
  var that = this,
      playerImpl, currentTrack,

  onStateChange = function (event) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        callbacks.onPlay(currentTrack);
        break;
      case YT.PlayerState.PAUSED:
        callbacks.onPause();
        break;
      case YT.PlayerState.ENDED:
        callbacks.onFinish();
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

  this.type = api.playerTypes.youtube;

  this.init = function () {
    playerImpl = new YT.Player('youtube-player', {
      videoId: 'x',
      playerVars: {},
      events: {
        onReady: callbacks.onReady,
        onStateChange: onStateChange,
        onPlaybackQualityChange: null,
        onPlaybackRateChange: null,
        onError: null,
        onApiChange: null,
      },
    });

    this.currentTrack = null;
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
};

YoutubePlayer.prototype = new PlayerBase();
SoundCloudPlayer.prototype = new PlayerBase();

return {
  YoutubePlayer: new YoutubePlayer(),
  SoundCloudPlayer: new SoundCloudPlayer()
};

});
