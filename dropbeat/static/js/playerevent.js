'use strict';

define([
  'jquery', 'playermanager', 'playlistmanager', 'playercallback'
], function ($, playerManager, playlistManager, playerCallback) {

/**
 * Progress is in player and is responsible for
 * updating progress (when playing) and handling player's seek actions.
 */

function ProgressHandler () {
  var root = $('#player').find('.progress'),

      buffer = root.find('.progress-bar .buffer'),
      bullet = root.find('.progress-bar .bullet'),

      marker = root.find('.progress-handle'),

      currentTime = root.find('.curr-play-time'),
      totalPlayTime = root.find('.total-play-time'),

      progressWidth = root.find('.progress-bar').width(),
      dragging = false,
      bulletUpdate = null,
      bufferUpdate = null,

  formatTime = function (second) {
    var min = Math.floor(second / 60),
        sec = Math.floor(second % 60);

    if (min < 10) { min = '0' + min; }
    if (sec < 10) { sec = '0' + sec; }

    return min + ':' + sec;
  },

  onProgress = function () {
    if (dragging) {
      return;
    }

    var total = playerManager.getDuration(),
        position = playerManager.getCurrentPosition(),
        width = position / total * progressWidth;

    bullet.width(width);
    marker.css('left', width);

    currentTime.text(formatTime(position));
    totalPlayTime.text(formatTime(total));
  },

  onBuffered = function () {
    buffer.width(playerManager.getBuffer() / 100 * progressWidth);
  },

  seek = function (event) {
    if (playerManager.isNotStarted() ||
        (playerManager.isStopped() &&
         playerManager.getCurrentPlayer() === undefined)) {
      return;
    }

    var dx = event.pageX - bullet.offset().left,
        duration = playerManager.getDuration();

    if (dx < 0) {
      dx = 0;
    }

    if (dx > progressWidth) {
      dx = progressWidth;
    }

    bullet.width(dx);
    marker.css('left', dx);

    var currentPosition = dx / progressWidth * duration;
    currentTime.text(formatTime(currentPosition));

    if (!dragging) {
      playerManager.seek(currentPosition);
    }
  },

  startDrag = function () {
    dragging = true;
    $(window).mousemove(seek);
    $(window).mouseup(stopDrag);
  },

  stopDrag = function (event) {
    dragging = false;
    seek(event);
    $(window).off('mousemove');
    $(window).off('mouseup');
  };

  this.start = function () {
    bulletUpdate = setInterval(onProgress, 100);
    bufferUpdate = setInterval(onBuffered, 1000);
  };

  this.stop = function () {
    clearInterval(bulletUpdate);
    clearInterval(bufferUpdate);
  };

  this.init = function () {
// To implement both click & dragging, we are not implement `$.click`.
// Instead, we implement click handling through `$.mousedown` and `$.mouseup`.
    root.find('.progress-bar').mousedown(startDrag);
    marker.mousedown(startDrag);
  };
};

/**
 * Player Controller.
 * This controller is responsible for user's interactions.
 */

function PlayerEventListener () {
  var that = this;

  this.init = function () {
    var root = $('#player'),
        progress = new ProgressHandler();

    that.playToggleButton = root.find('.ctrl.ctrl-play');

    that.playerStatus = {
      stat: root.find('.status'),
      title: root.find('.title')
    };

    that.playToggleButton.click(function () {
      if (playerManager.isPlaying()) {
        playerManager.pause();
      } else if (playerManager.isPaused()) {
        playerManager.resume();
      }
    });

    playerCallback.addCallbacks({
      onReady: function () {
        setStatus('READY');
        setTitle('CHOOSE TRACK FROM PLAYLIST');
      },
      onPlay: function (track) {
        setTitle(track.name);
        setPlay();
        progress.start();
      },
      onPause: function () {
        setStatus('PAUSED');
        setPaused();
        progress.stop();
      },
      onFinish: function () {
        setStatus('FINISHED');
        setPlay();
        progress.stop();
      }
    });

    progress.init();
  };

/**
 * Helper functions for UI.
 * They focus on css manipulations.
 */

// Play button
  var setPlay = function () {
    that.playToggleButton.addClass('pause');
    setStatus('PLAYING');
  },

  setPaused = function () {
    that.playToggleButton.removeClass('pause');
    setStatus('PAUSED');
  },

// Title & status text.
  setTitle = function (title) {
    that.playerStatus.title.text(title);
  },

  setStatus = function (playstat) {
    that.playerStatus.stat.text(playstat);
  },

// Repeat & shuffle.
  setShuffle = function (shuffled) {
  },

  setRepeat = function (repeated) {
  };
};

return new PlayerEventListener();

});
