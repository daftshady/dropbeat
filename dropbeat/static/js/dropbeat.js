'use strict';

define([
  'jquery', 'search', 'auth', 'view',
  'playerevent', 'playlistevent'
], function ($, search, auth, view, playerEvent, playlistEvent) {

function Dropbeat () {
};

/**
 * The core Dropbeat client
 *
 * @this {Dropbeat}
 */

Dropbeat.prototype = {
  debug: true,

  init: function () {
    view.init();
    auth.init();
    search.init();
    playerEvent.init();
    playlistEvent.playlist.init();
    playlistEvent.tracks.init();
  }
};

return new Dropbeat();

});
