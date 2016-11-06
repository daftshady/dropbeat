'use strict';

define([
  'jquery', 'playlist', 'auth', 'api'
], function ($, Playlist, auth, api) {

/**
 * Playlist manager object.
 * It manages users' playlist (and tracks) addition/deletion/modifications.
 */

function PlaylistManager () {
  var that = this,
      // `reservedList` limit creating multiple playlists at once.
      reservedList = null,
      playlistCallback = null,

  loadPlaylist = function (uid) {
    $.get(api.Router.getPath('playlist'), {uid: uid})

      .done(function (resp) {
        if (resp.success) {
          var playlist = new Playlist(resp.playlist.uid,
                                      resp.playlist.name,
                                      resp.playlist.tracks);
          that.playlists.push(playlist);

          if (playlistCallback !== null) {
            playlistCallback(playlist);
          }
        }
      });
  },

  loadPlaylistUids = function () {
    $.get(api.Router.getPath('playlistList'))

      .done(function (resp) {
        if (resp.success) {
          for (var i=0; i<resp.list.length; i+=1) {
            loadPlaylist(resp.list[i]);
          }
        }
      });
  };

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

  this.onGetPlaylist = function (callback) {
    for (var i=0; i<that.playlists.length; i+=1) {
      callback(that.playlists[i]);
    }

    playlistCallback = callback;
  };

  this.playlists = [];

  auth.onLogin(loadPlaylistUids);
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

return getInstance;

});
