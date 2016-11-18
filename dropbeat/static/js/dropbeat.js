'use strict';

define([
  'jquery', 'search', 'auth', 'view',
  'playerevent', 'playlistevent', 'playermanager', 'playordercontrol'
], function (
  $, search, auth, view,
  playerEvent, playlistEvent, playerManager, playOrderControl) {

/**
 * The core Dropbeat client
 *
 * @this {Dropbeat}
 */
return {
  init: function () {
    view.init();
    auth.init();
    search.init();
    playerEvent.init();
    playlistEvent.playlist.init();
    playlistEvent.tracks.init();
    playerManager.init();
    playOrderControl.init();
  },
  debug: true
}

});
