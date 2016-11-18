'use strict';

define([
  'jquery', 'playermanager', 'playlistmanager', 'playercallback'
], function ($, playerManager, playlistManager, playerCallback) {

/**
 * This controller manages what to be played next.
 */
function PlayOrderControl () {
  var RepeatStatus = {
    noRepeat: 0,
    repeatPlaylist: 1,
    repeatOne: 2
  };

  var ShuffleStatus = {
    noShuffle: 0,
    shuffle: 1
  }

  this.playQueue = [];

  this.repeatStatus = RepeatStatus.noRepeat;

  this.shuffleStatus = ShuffleStatus.noShuffle;

  // Play order related buttons.
  this.buttons = {
    prev: $('.controls .ctrl-prev'),
    next: $('.controls .ctrl-next'),
    repeat: $('.controls .ctrl-repeat'),
    shuffle: $('.controls .ctrl-shuffle')
  };

  this.init = function () {
    var that = this;

    that.buttons.prev.click(function () {
    });

    that.buttons.next.click(function () {
      var nextTrack = that.popNext(playerManager.getCurrentTrack());
      if (nextTrack !== null) {
        playerManager.play(nextTrack);
      }
    });

    that.buttons.repeat.click(function () {
      that.onRepeatClicked();
    });

    that.buttons.shuffle.click(function () {
      that.onShuffleClicked();
    });

    // Add player callback so that this module picks next track
    // when the track finished.
    playerCallback.addCallbacks({
      onFinish: function () {
        var nextTrack = that.popNext(playerManager.getCurrentTrack());
        if (nextTrack !== null) {
          playerManager.play(nextTrack);
        }
      }
    })
  };

  this.onRepeatClicked = function () {
    this.repeatStatus = (this.repeatStatus + 1) % 3;

    switch (this.repeatStatus) {
      case RepeatStatus.noRepeat:
        this.buttons.repeat.removeClass('repeat-one');
        break;
      case RepeatStatus.repeatPlaylist:
        this.buttons.repeat.addClass('repeat');
        break;
      case RepeatStatus.repeatOne:
        this.buttons.repeat.removeClass('repeat');
        this.buttons.repeat.addClass('repeat-one');
        break;
    }
  };

  this.onShuffleClicked = function () {
    this.shuffleStatus = (this.shuffleStatus + 1) % 2;
    this.reloadQueue();

    switch (this.shuffleStatus) {
      case ShuffleStatus.noShuffle:
        this.shuffleBtn.removeClass('shuffle');
        break;
      case ShuffleStatus.shuffle:
        this.shuffleBtn.addClass('shuffle');
        break;
    }
  };

  this.reloadQueue = function () {
    var playlistTracks = playlistManager.currentPlaylist.tracks;
    if (this.shuffleStatus === ShuffleStatus.shuffle) {
      var i, j, temp;
      for (i = playlistTracks.length - 1; i > 0; i -= 1) {
        // Shuffle array.
        j = Math.floor(Math.random() * (i + 1));
        temp = playlistTracks[i];
        playlistTracks[i] = playlistTracks[j];
        playlistTracks[j] = temp;
      }
    }
    this.playQueue = playlistTracks;
  };

  this.getCurPosition = function (track) {
    for (var i = 0; i < this.playQueue.length; i += 1) {
      if (this.playQueue[i].uid === track.uid) {
        return i;
      }
    }
  };

  this.popNext = function (curTrack) {
    if (this.repeatStatus === RepeatStatus.repeatOne) {
      // Should repeat current music regardless of shuffle status.
      return curTrack;
    } else {
      // Pick next.
      var pos = this.getCurPosition(curTrack);
      if (pos < this.playQueue.length - 1) {
        // If there is remaining track, play it.
        return this.playQueue[pos + 1];
      } else {
        // No remaining track.
        if (this.repeatStatus === RepeatStatus.repeatPlaylist) {
          // Fill the queue again and returns first track.
          this.reloadQueue();
          if (this.playQueue.length > 0) {
            return this.playQueue[0];
          }
        }
        return null;
      }
    }
  };
};


var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new PlayOrderControl();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance();

});
