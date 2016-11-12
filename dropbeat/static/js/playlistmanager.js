'use strict';

define([
  'jquery', 'playlist', 'api'
], function ($, Playlist, api) {

/**
 * Track queue management helper.
 * It helps shuffle when users play their playlist.
 */

function TrackQueue () {

  this.init = function (playlist) {
  };

  this.shuffle = function () {
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
      playlistCallback = null,

  loadPlaylist = function (uid) {
    $.get(api.Router.getPath('playlist'), {uid: uid})
      .done(function (resp) {
        if (resp.success) {
          var playlist = new Playlist(resp.playlist.uid,
                                      resp.playlist.name,
                                      resp.playlist.tracks);

          if (that.playlists.length === 0) {
            that.callbacks.onFirstPlaylistLoaded(playlist);
          }

          that.playlists.push(playlist);
        }
      });
  };

  this.loadAllPlaylists = function () {
    $.get(api.Router.getPath('playlistList'))
      .done(function (resp) {
        if (resp.success) {
          for (var i = 0; i < resp.list.length; i += 1) {
            loadPlaylist(resp.list[i]);
          }
        }
      });
  };

  this.currentPlaylist = null;
  this.playlists = [];
  this.callbacks = {
    onFirstPlaylistLoaded: null,
    onTrackAdded: null,
  };

  this.setPlaylistCallbacks = function (callbacks) {
    for (var key in callbacks) {
      if (callbacks.hasOwnProperty(key) && key in that.callbacks) {
        that.callbacks[key] = callbacks[key];

        if (key === 'onFirstPlaylistLoaded' && that.playlists.length > 0) {
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

  this.addNewTrack = function (track) {
    var playlist = that.currentPlaylist,
        data = {
          uid: track.uid,
          name: track.name,
          playlist_uid: playlist.uid
        };

    $.ajax({
      url: api.Router.getPath('track'),
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json; charset=utf-8',
    }).done(function (resp) {
      if (resp.success) {
        playlist.push(resp.track);
        that.callbacks.onTrackAdded(resp.track);
      }
    });
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

return getInstance;

});
