'use strict';

define([
  'jquery', 'handlebars', 'track',
  'playlist', 'api', 'auth',
  'playlistmanager', 'playermanager'
], function ($, hb, Track, Playlist, api, auth,
             getPlaylistManager, getPlayerManager) {

var playerManager = getPlayerManager(),
    playlistManager = getPlaylistManager();

/**
 * It binds user actions for playlist manipulation.
 */

function PlaylistEventListener () {
  var that = this;

  this.playlists = [];

  // this obj represents playlist created by `this.newPlaylist`
  // but not submitted to server.
  // Use this for limit creating multiple playlists at once.
  this.preparedList = null;

  // Open my playlists view.
  this.openPlaylist = function () {
    that.elems.myPlaylists.empty();
    that.elems.root.show();

    var template = hb.compile(that.elems.playlistTmpl),
        children = $(template(that)).appendTo(that.elems.myPlaylists);

    that.bindEvents(children);
  };

  this.newPlaylist = function () {
    if (that.preparedList !== null) {
      return;
    }

    // NOTE uid should be assigned after ajax call.
    // (server will assign uid)
    var emptyList = new Playlist(null, '', []);
    emptyList.editing = true;

    that.preparedList = emptyList;

    // To use same temaplate for `playlists` and `playlist`,
    // this container obj should wrap a playlist.
    var container = {playlists: [emptyList]},
        template = hb.compile(that.elems.playlistTmpl),
        child = $(template(container)).appendTo(that.elems.myPlaylists);

    that.bindEvents(child);
  };

  this.bindEvents = function (elems) {
    var editButton = '.nonedit-mode-view .menus .rename-button',
        removeButton = '.nonedit-mode-view .menus .remove-button',
        submitButton = '.edit-mode-view .menus .apply-edit-button',
        cancelButton = '.edit-mode-view .menus .cancel-edit-button',
        editContainer = '.edit-mode-view .title-input-field',
        editValue = '.edit-mode-view form input[type=text]',
        title = '.nonedit-mode-view .title';

    // select playlist.
    elems.find(title).click(function () {
      var uid = $(this).closest('.playlist').attr('data-uid'),
          uids = that.playlists.map(function (playlist) {
                   return playlist.uid
                 }),
          idx = uids.indexOf(uid);

      tracksListener.changePlaylist(that.playlists[idx]);
      that.elems.root.hide();
    });

    // edit playlist's name
    elems.find(editButton).click(function () {
      $(this).closest('.playlist').addClass('edit-mode');
    });

    // cancel renaming playlist
    elems.find(cancelButton).click(function () {
      var list = $(this).closest('.playlist')
      list.removeClass('edit-mode');
      list.find(editValue).closest().removeClass('warning');

      if (list.attr('data-uid').length === 0) {
        list.remove();
        that.preparedList = null;
      }
    });

    // remove playlist
    elems.find(removeButton).click(function () {
      var list = $(this).closest('.playlist'),
          uid = list.attr('data-uid'),
          remove = function (path, params) {
            return $.ajax({
              url: path,
              type: 'DELETE',
              data: JSON.stringify(params)
            });
          };

      // FIXME Does playlist-uid have a fixed length?
      if (uid.length !== 0) {
        remove(api.Router.getPath('playlist'), {uid: uid})
          .always(function () {
            var uids = that.playlists.map(function (playlist) {
                         return playlist.uid
                       }),
                idx = uids.indexOf(uid);

            that.playlists.splice(idx, 1);
            list.remove();
          });
      }
    });

    // apply creation or renaming playlist.
    elems.find(submitButton).click(function () {
      var list = $(this).closest('.playlist'),
          uid = list.attr('data-uid'),
          name = list.find(editValue).val(),
          method = $.post;

      if (uid.length !== 0) {
        // Because there is no `$.put`
        method = function (path, params) {
          return $.ajax({
            url: path,
            type: 'PUT',
            data: JSON.stringify(params)
          });
        };
      }

      method(api.Router.getPath('playlist'), {name: name, uid: uid})
        .done(function (resp) {
          if (!resp.success) {
            list.find(editValue).closest(editContainer).addClass('warning');
            return;
          }

          list.removeClass('edit-mode');
          list.find('.nonedit-mode-view .title').text(name);
          list.find(editValue).closest(editContainer).removeClass('warning');

          if (list.attr('data-uid').length === 0) {
            list.attr('data-uid', resp.playlist.uid);

            that.preparedList.uid = resp.playlist.uid;
            that.preparedList.name = name;
            that.playlists.push(that.preparedList);

            that.preparedList = null;
          } else {
            var uids = that.playlists.map(function (playlist) {
                         return playlist.uid
                       }),
                idx = uids.indexOf(uid);

            that.playlists[idx].name = name;
          }
        });
    });
  };

  this.init = function () {
    var root = $('#dropbeat').find('.play-controls .my-playlist');
    that.elems = {
      root: root,
      closeButton: root.find('.close-button'),
      createList: root.find('.create-new-playlist-button'),
      myPlaylists: root.find('.playlists-wrapper .playlists'),
      playlistTmpl: $('#playlist-template').html()
    };

    that.elems.closeButton.click(function () {
      that.elems.root.hide();
    });

    that.elems.createList.click(function () {
      that.newPlaylist();
    });
  };

};

/**
 * It binds user actions for tracks in playlist.
 */

function PlaylistTracksEventListener () {
  var that = this,
      baseQuery = '.playlist-track .playlist-track-inner ',
      trackTitleQuery = baseQuery + '.track-title-wrapper',
      trackRemoveQuery = baseQuery + '.menus .track-remove',
      currentPlaylist = null,

  // To bold & unbold tracks it should be calculated
  // every time when it called.
  // Because many tracks attached & detached.
  boldCurrentTrack = function () {
    var track = playerManager.getCurrentTrack(),
        elem = $(baseQuery);

    elem.parent().removeClass('on');

    elem = elem.filter('[data-uid="' + track.uid + '"]');
    elem.parent().addClass('on');
  },

  unboldCurrentTrack = function () {
    var track = playerManager.getCurrentTrack(),
        elem = $(baseQuery)
          .filter('[data-uid="' + track.uid + '"]');

    elem.parent().removeClass('on');
  };

  this.changePlaylist = function (playlist) {
    if (playlist === currentPlaylist) {
      return;
    }

    var template = hb.compile(that.elems.playlistTmpl.html());

    if (currentPlaylist !== null) {
      currentPlaylist.selected = false;
    }

    playlist.selected = true;

    currentPlaylist = playlist;
    that.elems.playlistName.text(playlist.name);
    that.elems.playlistInner.html(template(playlist));

    that.elems.playlistInner.find(trackTitleQuery)
      .click(function (event) {
        var elem = $(this),
            title = elem.find('.track-title').text(),
            uid = elem.parent().attr('data-uid'),
            source = elem.parent().attr('data-source');

        playerManager.play(new Track(uid, title, source));
      });
  };

  this.init = function () {
    var root = $('#dropbeat').find('.play-controls .playlist-section');

    that.elems = {
      playlistName: root.find('.playlist-name'),
      playlistSearch: root.find('.playlist-search'),
      addByUrl: root.find('.add-by-url-section'),
      playlistInner: root.find('.playlist .playlist-inner'),
      openPlaylist: root.find('.playlist-footer .my-playlist-button'),
      playlistTmpl: $('#playlist-track-template')
    };

    playlistManager.onGetPlaylist(function (playlist) {
      if (currentPlaylist === null) {
        that.changePlaylist(playlist);
      }
      playlistListener.playlists.push(playlist);
    });

    that.elems.openPlaylist.click(function () {
      if (auth.currentUser !== null) {
        playlistListener.openPlaylist();
      }
    });
  };

  playerManager.setPlayCallbacks({
    onPlay: function () {
      boldCurrentTrack();
    },
    onFinish: function () {
      unboldCurrentTrack();
    }
  });
};

var playlistListener = new PlaylistEventListener(),
    tracksListener = new PlaylistTracksEventListener();

return {
  init: function () {
    tracksListener.init();
    playlistListener.init();
  }
};

});
