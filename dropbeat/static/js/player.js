/*global YT*/
'use strict';

define(function () {

/*
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

  this.hide = notImplemented;
  this.show = notImplemented;

  this.play = notImplemented;
  this.pause = notImplemented;
  this.stop = notImplemented;

  this.seek = notImplemented;

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

  this.onLoading = function () {
  };

  this.onPlay = function () {
  };

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
      playerImpl;

  this.type = 'youtube';

  this.init = function () {
    playerImpl = new YT.Player(id, {
// TODO remove below line after search is implemented.
      videoId: 'BB5ydxD9GAo',
      playerVars: {},
      events: {
        'onReady': function(e) {e.target.playVideo();},
        'onStateChange': null,
        'onPlaybackQualityChange': null,
        'onPlaybackRateChange': null,
        'onError': null,
        'onApiChange': null,
      }
    });

    this.ready = true;
  };

  this.hide = function () {
  };

  this.show = function () {
  };

  this.play = function (video) {
    if (!(playerImpl && this.ready)) {
      throw 'Youtube player is not initialized';
    }

    if (video) {
      this.currentVideo = video;
      playerImpl.loadVideoById(video.id, 0);
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
