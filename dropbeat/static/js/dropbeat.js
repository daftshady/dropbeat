'use strict';

define([
  'jquery', 'playerevent', 'search', 'auth',
  'playlistevent'
], function ($, playerEvent, search, auth, playlistEvent) {

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
    playlistEvent.init();
  }
};

return new Dropbeat();

});
