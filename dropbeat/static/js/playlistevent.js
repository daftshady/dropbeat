'use strict';

define([
  'jquery', 'handlebars', 'track',
  'api', 'auth', 'notification',
  'playlistmanager', 'playermanager',
  'playercallback', 'playordercontrol'
], function ($, hb, Track, api, auth, notify,
             playlistManager, playerManager, playerCallback,
             playOrderControl) {

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
    // select playlist.
    elems.find('.nonedit-mode-view .title').click(function () {
      var uid = $(this).closest('.playlist').attr('data-uid'),
          selectedList = playlistManager.getPlaylist(uid);

      if (selectedList !== null) {
        playlistManager.loadPlaylist(uid, true);
      }

      that.elems.root.hide();
    });

    // edit playlist's name
    elems.find('.nonedit-mode-view .menus .rename-button')
      .click(function () {
        $(this).closest('.playlist').addClass('edit-mode');
      });

    // cancel renaming playlist
    elems.find('.edit-mode-view .menus .cancel-edit-button')
      .click(function () {
        var list = $(this).closest('.playlist')
        list.removeClass('edit-mode');

        if (list.attr('data-uid').length === 0) {
          list.remove();
          playlistManager.commit({cancel: true});
        }
      });

    // remove playlist
    elems.find('.nonedit-mode-view .menus .remove-button')
      .click(function () {
        var list = $(this).closest('.playlist'),
            uid = list.attr('data-uid');

        if (uid.length !== 0) {
          playlistManager.removePlaylist(uid, function () {
            list.remove();
          });
        }
      });

    // apply creation or renaming playlist.
    elems.find('.edit-mode-view .menus .apply-edit-button').click(function () {
      var list = $(this).closest('.playlist'),
          uid = list.attr('data-uid'),
          name = list.find('.edit-mode-view form input[type=text]').val();

      if (uid.length === 0) {
        playlistManager.createPlaylist(name, function (playlist) {
          list.removeClass('edit-mode');
          list.find('.nonedit-mode-view .title').text(name);
          list.attr('data-uid', playlist.uid);
        });
      } else {
        playlistManager.renamePlaylist(uid, name, function () {
          list.removeClass('edit-mode');
          list.find('.nonedit-mode-view .title').text(name);
        });
      }
    });

    elems.find('.edit-mode-view .title-input-field form')
      .on('submit', function (event) {
        $(event.currentTarget).closest('.edit-mode-view')
          .find('.menus .apply-edit-button').click();
        return false;
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
      baseQuery = '.playlist-track-inner ',
      trackTitleQuery = baseQuery + '.track-title-wrapper',
      trackRemoveQuery = baseQuery + '.menus .track-remove',

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

  // Render a playlist in playlist view.
  // It will be called when playlist is changed or
  // a track is removed. (to number tracks correctly)
  this.loadTracksView = function (playlist) {
    var currentPlaylist = playlistManager.currentPlaylist,
        template = hb.compile(that.elems.playlistTmpl);

    if (currentPlaylist !== null) {
      currentPlaylist.selected = false;
    }

    playlist.selected = true;

    that.elems.playlistName.text(playlist.name);

    var children = that.elems.playlistInner.html(template(playlist));

    that.bindEvents(children);

    playOrderControl.reloadQueue();
  };

  // Render & Add new track in playlist view.
  this.loadNewTrack = function (track) {
    // To render template with index of the track,
    // `idx` attribute should be set.
    // see beat.html#playlist-track-template.
    track.idx = playlistManager.currentPlaylist.size();

    var template = hb.compile(that.elems.playlistTmpl),
        child = $(template({tracks: [track]}))
          .appendTo(that.elems.playlistInner);

    that.bindEvents(child);
  };

  this.bindEvents = function (elems) {
    elems.find(trackTitleQuery).click(function () {
      var elem = $(this),
          title = elem.find('.track-title').text(),
          uid = elem.parent().attr('data-uid'),
          source = elem.parent().attr('data-source');

      playerManager.play(new Track(uid, title, source));
    });

    elems.find(trackRemoveQuery).click(function () {
      var elem = $(this),
          uid = elem.closest('.playlist-track-inner').attr('data-uid');

      playlistManager.removeTrack(uid, function (playlist) {
        that.loadTracksView(playlist);
      });
    });
  };

  this.init = function () {
    that.elems.openPlaylist.click(function () {
      if (auth.currentUser !== null) {
        playlistListener.openPlaylistView();
      } else {
        notify.signinRequired();
      }
    });

    // Search filter event.
    var clearButton = that.elems.playlistSearch.find('.clear-filter'),
        clearFilter = function () {
          playlistManager.filter.revoke(that.loadTracksView);
          $(this).val('');

          clearButton.hide();
          clearButton.off('click');
        };

    // In order to catch `deletion` in an input field,
    // 'keyup' event is used but not 'keypress'.
    that.elems.playlistSearch.find('#search-playlist-input')
      .on('keyup', function (event) {
        var pattern = $(this).val();

        // clear search result & restore original playlist
        if (pattern.length === 0) {
          clearFilter();
          return;
        }

        // only search tracks in playlist when press enter
        if (event.keyCode !== 13 ||
            playlistManager.currentPlaylist === null) {
          return;
        }

        playlistManager.filter.query(pattern, that.loadTracksView);
        clearButton.show();
        clearButton.on('click', clearFilter.bind(this));
      });

    playlistManager.setPlaylistCallbacks({
      onPlaylistChange: function (playlist) {
        that.loadTracksView(playlist);
      },
      onTrackAdded: function (track) {
        that.loadNewTrack(track);
      }
    });

    playerCallback.addCallbacks({
      onPlay: function () {
        boldCurrentTrack();
      },
      onFinish: function () {
        unboldCurrentTrack();
      }
    });
  };
};

var playlistListener = new PlaylistEventListener(),
    tracksListener = new PlaylistTracksEventListener();

return {
  playlist: playlistListener,
  tracks: tracksListener
};

});
