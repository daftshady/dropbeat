'use strict';

define([
  'jquery', 'playlist', 'auth', 'api'
], function ($, Playlist, auth, api) {

/**
 * Playlist manager object.
 * It manages users' playlist (and tracks) addition/deletion/modifications.
 */

function PlaylistManager () {
  var playlists = [],
      onGetPlaylist = null,

  getPlaylist = function (uid) {
    $.get(api.Router.getPath('playlist'), {uid: uid})

      .done(function (resp) {
        if (resp.success) {
          var playlist = new Playlist(resp.playlist.uid,
                                      resp.playlist.name,
                                      resp.playlist.tracks);
          playlists.push(playlist);

          if (onGetPlaylist !== null) {
            onGetPlaylist(playlist);
          }
        }
      });
  },

  initPlaylistUids = function () {
    $.get(api.Router.getPath('playlistList'))

      .done(function (resp) {
        if (resp.success) {
          for (var i=0; i<resp.list.length; i+=1) {
            getPlaylist(resp.list[i]);
          }
        }
      });
  };

  this.onGetPlaylist = function (callback) {
    for (var i=0; i<playlists.length; i+=1) {
      callback(playlists[i]);
    }

    onGetPlaylist = callback;
  };

  auth.onLogin(initPlaylistUids);
};

return new PlaylistManager();

});
