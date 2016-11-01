'use strict';

define([
  'jquery', 'playerevent', 'search', 'auth',
  'playlistmanager'
], function ($, playerEvent, search, auth, playlistManager) {

function Dropbeat () {
};

/**
 * The core Dropbeat client
 *
 * @this {Dropbeat}
 */

Dropbeat.prototype = {
  debug: true,

  initialize: function () {
    playerEvent.init();
    search.init();
    auth.init();
    playlistManager.init();
  }
};

return new Dropbeat();

});
