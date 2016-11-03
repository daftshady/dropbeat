'use strict';

define([
  'jquery', 'search', 'auth',
  'playerevent', 'playlistevent'
], function ($, search, auth, playerEvent, playlistEvent) {

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
    auth.init();
    search.init();
    playerEvent.init();
    playlistEvent.init();
  }
};

return new Dropbeat();

});
