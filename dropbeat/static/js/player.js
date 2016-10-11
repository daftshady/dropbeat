'use strict';

define([
    'jquery'
], function ($) {

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

function YoutubePlayer () {
};

function SoundCloudPlayer () {
};

YoutubePlayer.prototype = new PlayerBase();
SoundCloudPlayer.prototype = new PlayerBase();

return {
  YoutubePlayer: new YoutubePlayer(),
  SoundCloudPlayer: new SoundCloudPlayer()
};

});
