'use strict';

define([
  'jquery', 'playlist', 'api', 'notification', 'playercallback'
], function ($, Playlist, api, notify, playerCallback) {

/**
 * Playlist manager object.
 */

function PlaylistManager () {
  var that = this,
      // `reservedList` limit creating multiple playlists at once.
      reservedList = null,
      playlistCallback = null;

  // TODO: Move methods related to playlist loading to `playlistevent`.
  this.loadPlaylist = function (uid, updateView) {
    $.get(api.Router.getPath('playlist'), {uid: uid})
      .done(function (resp) {
        var playlist = that.getPlaylist(uid);

        if (resp.success) {
          playlist.tracks = resp.playlist.tracks;

          if (updateView) {
            that.callbacks.onPlaylistChange(playlist);
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

  this.setPlaylistCallbacks = function (callbacks) {
    for (var key in callbacks) {
      if (callbacks.hasOwnProperty(key) && key in that.callbacks) {
        that.callbacks[key] = callbacks[key];

        if (key === 'onPlaylistChange' && that.playlists.length > 0) {
          callbacks[key](that.playlists[0]);
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
