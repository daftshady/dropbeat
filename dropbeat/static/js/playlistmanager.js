'use strict';

define([
  'jquery', 'playlist', 'api', 'notification',
  'playermanager', 'playercallback'
], function ($, Playlist, api, notify, playerManager, playerCallback) {

/**
 * Playlist filter.
 *
 * Find tracks by their name.
 * Callbacks should be provided as `function (filteredPlaylist)`.
 */

function PlaylistFilter (playlist) {
  var originalPlaylist = playlist;

  // filter a playlist matching pattern.
  // show only tracks whose name contains pattern.
  this.query = function (pattern, callback) {
    var filteredPlaylist =
      new Playlist(originalPlaylist.uid, originalPlaylist.name, []);

    for (var i=0; i < originalPlaylist.size(); i+=1) {
      var track = originalPlaylist.get(i),
          name = track.name;

      if (name.toLowerCase().indexOf(pattern.toLowerCase()) !== -1) {
        filteredPlaylist.add(track);
      }
    }

    callback(filteredPlaylist);
  };

  // Revoke playlist filterd to originalPlaylist.
  this.revoke = function (callback) {
    callback(originalPlaylist);
  };

};

/**
 * This controller manages what to be played next.
 */
function PlayOrderControl (playlistManager) {
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

  this.repeatBtn = $('.controls .ctrl-repeat');

  this.shuffleBtn = $('.controls .ctrl-shuffle');

  this.init = function () {
    var that = this;

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
        this.repeatBtn.removeClass('repeat-one');
        break;
      case RepeatStatus.repeatPlaylist:
        this.repeatBtn.addClass('repeat');
        break;
      case RepeatStatus.repeatOne:
        this.repeatBtn.removeClass('repeat');
        this.repeatBtn.addClass('repeat-one');
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

/**
 * Playlist manager object.
 * It manages users' playlist (and tracks) addition/deletion/modifications.
 */

function PlaylistManager () {
  var that = this,
      // `reservedList` limit creating multiple playlists at once.
      reservedList = null,
      playlistCallback = null;

  this.loadPlaylist = function (uid, updateView) {
    $.get(api.Router.getPath('playlist'), {uid: uid})
      .done(function (resp) {
        var playlist = that.getPlaylist(uid);

        if (resp.success) {
          playlist.tracks = resp.playlist.tracks;

          if (updateView) {
            that.callbacks.onPlaylistChange(playlist);
            that.filter = new PlaylistFilter(playlist);
          }
        }
      });
  };

  this.loadAllPlaylists = function () {
    $.get(api.Router.getPath('playlistList'))
      .done(function (resp) {
        if (resp.success) {
          for (var i = 0; i < resp.data.length; i += 1) {
            var playlist = new Playlist(resp.data[i].uid, resp.data[i].name);
            that.playlists.push(playlist);

            if (i === 0) {
              that.loadPlaylist(resp.data[0].uid, true);
            }
          }
        }
      });
  };

  this.currentPlaylist = null;

  this.playlists = [];

  this.callbacks = {
    onPlaylistChange: null,
    onTrackAdded: null,
  };

  this.playOrderControl = new PlayOrderControl(this);
  this.playOrderControl.init();

  this.setPlaylistCallbacks = function (callbacks) {
    for (var key in callbacks) {
      if (callbacks.hasOwnProperty(key) && key in that.callbacks) {
        that.callbacks[key] = callbacks[key];

        if (key === 'onPlaylistChange' && that.playlists.length > 0) {
          callbacks[key](that.playlists[0]);
          that.filter = new PlaylistFilter(that.playlists[0]);
        }
      }
    }
  };

  // Prepare a list, which is created by user but not submitted to server.
  // (clicked by `create new playlist`)
  // After create playlist by server, `this.commit` will be invoked.
  this.prepare = function () {
    var list = new Playlist();
    list.editing = true;

    reservedList = list;

    return list;
  };

  this.prepared = function () {
    return reservedList !== null;
  };

  this.commit = function (params) {
    if (params.cancel) {
      reservedList = null;
      return;
    }

    reservedList.uid = params.uid;
    reservedList.name = params.name;
    reservedList.editing = false;

    that.playlists.push(reservedList);
    reservedList = null;
  };

  this.getPlaylist = function (uid) {
    var uids = that.playlists.map(function (playlist) {
          return playlist.uid;
        }),
        idx = uids.indexOf(uid);

    return idx === -1 ? null : that.playlists[idx];
  };

  this.removePlaylist = function (uid) {
    var uids = that.playlists.map(function (playlist) {
          return playlist.uid;
        }),
        idx = uids.indexOf(uid);

    if (idx !== -1) {
      that.playlists.splice(idx, 1);
    }
  };

};


// NOTE Bacause of the same reason of using singleton in `playermanager.js`,
// it also should be used as singleton.
var getInstance = (function (instance) {
  function wrap () {
    if (instance === null) {
      instance = new PlaylistManager();
    }

    return instance;
  };

  return wrap;
})(null);

return getInstance();

});
