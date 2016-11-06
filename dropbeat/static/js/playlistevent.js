'use strict';

define([
  'jquery', 'handlebars', 'track',
  'playlist', 'api',
  'playlistmanager', 'playermanager'
], function ($, hb, Track, Playlist, api,
             getPlaylistManager, getPlayerManager) {

var playerManager = getPlayerManager(),
    playlistManager = getPlaylistManager();

/**
 * It binds user actions for playlist manipulation.
 */

function PlaylistEventListener () {
  var that = this,
      root = $('#dropbeat').find('.play-controls .my-playlist');

  this.elems = {
    root: root,
    closeButton: root.find('.close-button'),
    createList: root.find('.create-new-playlist-button'),
    myPlaylists: root.find('.playlists-wrapper .playlists'),
    playlistTmpl: $('#playlist-template').html()
  };

  // Open my playlists view.
  this.openPlaylistView = function () {
    that.elems.myPlaylists.empty();
    that.elems.root.show();

    var template = hb.compile(that.elems.playlistTmpl),
        children = $(template(playlistManager));

    children.appendTo(that.elems.myPlaylists);
    that.bindEvents(children);
  };

  this.openPlaylistCreationView = function () {
    if (playlistManager.prepared()) {
      return;
    }

    var emptyList = playlistManager.prepare();

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
        editValue = '.edit-mode-view form input[type=text]',
        playlistTitle = '.nonedit-mode-view .title';

    // select playlist.
    elems.find(playlistTitle).click(function () {
      var uid = $(this).closest('.playlist').attr('data-uid'),
          selectedList = playlistManager.getPlaylist(uid);

      if (selectedList !== null) {
        tracksListener.loadTracksView(selectedList);
      }

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
        playlistManager.commit({cancel: true});
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
            playlistManager.removePlaylist(uid);
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
          var editContainer = '.edit-mode-view .title-input-field';

          if (!resp.success) {
            list.find(editValue).closest(editContainer).addClass('warning');
            return;
          }

          list.removeClass('edit-mode');
          list.find(playlistTitle).text(name);
          list.find(editValue).closest(editContainer).removeClass('warning');

          if (list.attr('data-uid').length === 0) {

            list.attr('data-uid', resp.playlist.uid);
            playlistManager.commit(resp.playlist);

          } else {
            var playlist = playlistManager.getPlaylist(uid);
            playlist.name = name;
          }
        });
    });
  };

  this.init = function () {
    this.elems.closeButton.click(function () {
      that.elems.root.hide();
    });

    this.elems.createList.click(function () {
      that.openPlaylistCreationView();
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

  // Contrary to tracks' queries, this elements need not to fetched twice.
  // So pre-fetched elements are more efficient.
  var root = $('#dropbeat').find('.play-controls .playlist-section');
  this.elems = {
    playlistName: root.find('.playlist-name'),
    playlistSearch: root.find('.playlist-search'),
    addByUrl: root.find('.add-by-url-section'),
    playlistInner: root.find('.playlist .playlist-inner'),
    openPlaylist: root.find('.playlist-footer .my-playlist-button'),
    playlistTmpl: $('#playlist-track-template').html()
  };

  this.loadTracksView = function (playlist) {
    if (playlist === currentPlaylist) {
      return;
    }

    var template = hb.compile(that.elems.playlistTmpl);

    if (currentPlaylist !== null) {
      currentPlaylist.selected = false;
    }

    playlist.selected = true;

    currentPlaylist = playlist;
    that.elems.playlistName.text(playlist.name);
    that.elems.playlistInner.html(template(playlist));

    that.elems.playlistInner.find(trackTitleQuery)
      .click(function () {
        var elem = $(this),
            title = elem.find('.track-title').text(),
            uid = elem.parent().attr('data-uid'),
            source = elem.parent().attr('data-source');

        playerManager.play(new Track(uid, title, source));
      });
  };

  this.init = function () {
    playlistManager.onGetPlaylist(function (playlist) {
      if (currentPlaylist === null) {
        that.loadTracksView(playlist);
      }
    });

    that.elems.openPlaylist.click(playlistListener.openPlaylistView);
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
