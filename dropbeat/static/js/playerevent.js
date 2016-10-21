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
      onPlay: function (track) {
        setTitle(track.title);
        setPlay();
      },
      onPause: function () {
        setStatus('PAUSED');
        setPaused();
      },
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
