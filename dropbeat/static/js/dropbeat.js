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

    this.initMainView();
  },
  initMainView: function () {
    // Event for main dropbeat logo.
    $('.ic-logo').click(function () {
      window.location.href = '/';
    });
  },
  debug: true
}

});
