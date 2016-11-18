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
    var editValue = '.edit-mode-view form input[type=text]';

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
          $.ajax({
            url: api.Router.getPath('playlist'),
            type: 'DELETE',
            data: JSON.stringify({uid: uid}),
            contentType: 'application/json; charset=utf-8'
          }).done(function () {
            playlistManager.removePlaylist(uid);
            list.remove();
          });
        }
      });

    // apply creation or renaming playlist.
    elems.find('.edit-mode-view .menus .apply-edit-button').click(function () {
      var list = $(this).closest('.playlist'),
          uid = list.attr('data-uid'),
          name = list.find(editValue).val(),
          data = {name: name, uid: uid},
          method = uid.length === 0 ? 'POST' : 'PUT';

      $.ajax({
        url: api.Router.getPath('playlist'),
        type: method,
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8'
      }).done(function (resp) {
        var editContainer = '.edit-mode-view .title-input-field';

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

        list.removeClass('edit-mode');
        list.find('.nonedit-mode-view .title').text(name);

        if (list.attr('data-uid').length === 0) {

          list.attr('data-uid', resp.playlist.uid);
          playlistManager.commit(resp.playlist);

        } else {
          var playlist = playlistManager.getPlaylist(uid);
          playlist.name = name;
        }
      });
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

  this.loadTracksView = function (playlist) {
    var currentPlaylist = playlistManager.currentPlaylist,
        template = hb.compile(that.elems.playlistTmpl);

    if (currentPlaylist !== null) {
      currentPlaylist.selected = false;
    }

    playlist.selected = true;

    playlistManager.currentPlaylist = playlist;
    that.elems.playlistName.text(playlist.name);

    var children = that.elems.playlistInner.html(template(playlist));

    this.bindEvents(children);

    playOrderControl.reloadQueue();
  };

  this.addNewTrack = function (track) {
    var playlist = playlistManager.currentPlaylist,
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
        notify.onTrackAdded();
        playlist.push(resp.track);
        that.loadTracksView(playlist);
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
          uid = elem.closest('.playlist-track-inner').attr('data-uid'),
          playlist = playlistManager.currentPlaylist,
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
          that.loadTracksView(playlist);
        }
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
