'use strict';

define([
  'jquery', 'playlist', 'track', 'api', 'notification', 'playercallback'
], function ($, Playlist, Track, api, notify, playerCallback) {

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
 * Playlist manager object.
 */

function PlaylistManager () {
  var that = this,
      // `reservedList` limit creating multiple playlists at once.
      reservedList = null;

  // TODO: Move methods related to playlist loading to `playlistevent`.
  this.loadPlaylist = function (uid, updateView) {
    $.get(api.Router.getPath('playlist'), {uid: uid})
      .done(function (resp) {
        var playlist = that.getPlaylist(uid);

        if (resp.success) {
          playlist.tracks = resp.playlist.tracks;

          if (updateView) {
            if (that.currentPlaylist !== null) {
              that.currentPlaylist.selected = false;
            }

            that.currentPlaylist = playlist;
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

  this.setPlaylistCallbacks = function (callbacks) {
    for (var key in callbacks) {
      if (callbacks.hasOwnProperty(key) && key in that.callbacks) {
        that.callbacks[key] = callbacks[key];

        if (key === 'onPlaylistChange' && that.playlists.length > 0) {
          that.currentPlaylist = that.playlists[0];
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

  this.createPlaylist = function (name, updateView) {
    var data = {name: name};

    $.ajax({
      url: api.Router.getPath('playlist'),
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json; charset=utf-8'
    }).done(function (resp) {
      if (!resp.success) {
        switch(resp.error) {
          case api.ErrorCodes.duplicatedPlaylistName:
            notify.duplicatedPlaylistName();
            break;
          default:
            break;
        }
        return;
      }

      that.commit(resp.playlist);
      updateView(resp.playlist);
    });
  };

  this.removePlaylist = function (uid, updateView) {
    $.ajax({
      url: api.Router.getPath('playlist'),
      type: 'DELETE',
      data: JSON.stringify({uid: uid}),
      contentType: 'application/json; charset=utf-8'
    }).done(function (resp) {
      var uids = that.playlists.map(function (playlist) {
            return playlist.uid;
          }),
          idx = uids.indexOf(uid);

      if (idx !== -1) {
        that.playlists.splice(idx, 1);
        updateView();
      }
    });
  };

  this.renamePlaylist = function (uid, name, updateView) {
    var data = {uid: uid, name: name};

    $.ajax({
      url: api.Router.getPath('playlist'),
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json; charset=utf-8'
    }).done(function (resp) {
      if (!resp.success) {
        switch(resp.error) {
          case api.ErrorCodes.duplicatedPlaylistName:
            notify.duplicatedPlaylistName();
            break;
          default:
            break;
        }
        return;
      }

      var playlist = that.getPlaylist(uid);
      playlist.name = name;

      updateView();
    });
  };

  // Add new track into current playlist.
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
        var track = new Track(resp.track.uid,
                              resp.track.name,
                              resp.track.source);

        that.callbacks.onTrackAdded(track);
        playlist.push(track);
        notify.onTrackAdded();
      } else {
        switch (resp.error) {
          case api.ErrorCodes.trackAlreadyExist:
            notify.trackExists();
            break;
          default:
            // Unexpected error code.
            break;
        }
      }
    });
  };

  // Remove a track in current playlist.
  this.removeTrack = function (uid, updateView) {
    var playlist = that.currentPlaylist,
        data = {uid: uid, playlist_uid: playlist.uid};

    $.ajax({
      url: api.Router.getPath('track'),
      type: 'DELETE',
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    }).done(function (resp) {
      if (resp.success) {
        notify.onTrackRemoved();
        playlist.remove(uid);
        updateView(playlist);
      }
    });
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
