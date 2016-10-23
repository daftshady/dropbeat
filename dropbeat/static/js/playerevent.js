'use strict';

define([
  'jquery', 'playermanager'
], function ($, manager) {

/**
 * Player Controller.
 * This controller is responsible for user's interactions.
 */

function PlayerEventListener () {
  var root = $('#player'),
      buttons = {
        playToggle: root.find('.ctrl.ctrl-play'),
        prev: root.find('.ctrl.ctrl-prev'),
        next: root.find('.ctrl.ctrl-next'),
        repeat: root.find('.ctrl.ctrl-repeat'),
        shuffle: root.find('.ctrl.ctrl-shuffle')
      },
      playerStatus = {
        stat: root.find('.status'),
        title: root.find('.title')
      };

  var progress = (function () {
    var that = {}, interval = 100, dragging = false,
        bulletUpdate, bufferUpdate;

    var formatTime = function (second) {
      var min = ~~(second / 60),
          sec = ~~(second % 60);

      if (min < 10) {
        min = '0' + min;
      }

      if (sec < 10) {
        sec = '0' + sec;
      }

      return min + ':' + sec;
    };

    var progressWidth = root.find('.progress .progress-bar').width(),
        buffer = root.find('.progress .progress-bar .buffer'),
        bullet = root.find('.progress .progress-bar .bullet'),
        marker = root.find('.progress .progress-handle'),
        currentTime = root.find('.progress .curr-play-time'),
        duration = root.find('.progress .total-play-time');

    var onProgress = function () {
      if (dragging) {
        return;
      }

      var total = manager.getDuration(),
          position = manager.getCurrentPosition(),
          width = position / total * progressWidth;

      bullet.width(width);
      marker.css('left', width);

      currentTime.text(formatTime(position));
      duration.text(formatTime(total));
    },
    onBuffered = function () {
      buffer.width(manager.getBuffer() / 100 * progressWidth);
    };

    that.start = function () {
      bulletUpdate = setInterval(onProgress, interval);
      bufferUpdate = setInterval(onBuffered, interval * 10);
    };

    that.stop = function () {
      clearInterval(bulletUpdate);
      clearInterval(bufferUpdate);
    };

    return that;
  })();

  this.init = function () {
    buttons.playToggle.click(function () {
      var playstat = manager.getStatus();

      switch(playstat) {
        case manager.STATUS.PLAYING:
          manager.pause();
          break;
        case manager.STATUS.PAUSED:
          manager.resume();
          break;
        case manager.STATUS.STOPPED:
          manager.play({
            id: '-dya3o2HjAY',
            type: 'youtube',
            title: 'ZHU - automatic',
          });
          break;
        default:
          break;
      }
    });

    buttons.prev.click(function () {
    });

    buttons.next.click(function () {
    });

    buttons.repeat.click(function () {
    });

    buttons.shuffle.click(function () {
    });

    manager.setPlayCallbacks({
      onReady: function () {
        setStatus('READY');
        setTitle('CHOOSE TRACK FROM PLAYLIST');
        buttons.playToggle.removeClass('disabled');
      },
      onPlay: function (track) {
        setTitle(track.title);
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
  };

/**
 * Helper functions for UI.
 * They focus on css manipulations.
 */

// Play button
  var setPlay = function () {
    buttons.playToggle.addClass('pause');
    setStatus('PLAYING');
  },
  setPaused = function () {
    buttons.playToggle.removeClass('pause');
    setStatus('PAUSED');
  };

// Title & status text.
  var setTitle = function (title) {
    playerStatus.title.text(title);
  },
  setStatus = function (playstat) {
    playerStatus.stat.text(playstat);
  };

// Repeat & shuffle.
};

return new PlayerEventListener();

});
