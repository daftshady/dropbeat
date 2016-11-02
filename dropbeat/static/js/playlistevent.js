'use strict';

define([
  'handlebars', 'playlistmanager'
], function (hb, playlistManager) {

/**
 * It binds user actions for playlist.
 */
function PlaylistEventListener () {
  var that = this,
      playlists = [],
      currentPlaylist = null,

  changePlaylist = function (list) {
    var template = hb.compile(that.elems.playlistTmpl.html());

    currentPlaylist = list;
    that.elems.playlistName.text(list.name);
    that.elems.playlistInner.html(template(list));
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

    playlistManager.onGetPlaylist(function (list) {
      if (playlists.length === 0) {
        changePlaylist(list);
      }

      playlists.push(list);
    });
  };
};

return new PlaylistEventListener();

});
