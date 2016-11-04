'use strict';

define([
  'jquery', 'handlebars', 'track',
  'playlistmanager', 'playermanager'
], function ($, hb, Track, playlistManager, getPlayerManager) {

var playerManager = getPlayerManager();

/**
 * It binds user actions for playlist.
 */
function PlaylistEventListener () {
  var that = this,
      baseQuery = '.playlist-track .playlist-track-inner ',
      trackTitleQuery = baseQuery + '.track-title-wrapper',
      trackRemoveQuery = baseQuery + '.menus .track-remove',
      currentPlaylist = null,

  changePlaylist = function (playlist) {
    var template = hb.compile(that.elems.playlistTmpl.html());

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
  },

  boldCurrentTrack = function () {
    var track = playerManager.getCurrentTrack(),
        elem = $(baseQuery)
          .filter('[data-uid="' + track.uid + '"]');

    elem.parent().addClass('on');
  },

  unboldCurrentTrack = function () {
    var track = playerManager.getCurrentTrack(),
        elem = $(baseQuery)
          .filter('[data-uid="' + track.uid + '"]');

    elem.parent().removeClass('on');
  };

  this.init = function () {
    var root = $('#dropbeat').find('.play-controls .playlist-section');

    that.elems = {
      playlistName: root.find('.playlist-name'),
      playlistSearch: root.find('.playlist-search'),
      addByUrl: root.find('.add-by-url-section'),
      playlistInner: root.find('.playlist .playlist-inner'),
      playlistTmpl: $('#playlist-track-template')
    };

    playlistManager.onGetPlaylist(function (playlist) {
      if (currentPlaylist === null) {
        changePlaylist(playlist);
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

return new PlaylistEventListener();

});
