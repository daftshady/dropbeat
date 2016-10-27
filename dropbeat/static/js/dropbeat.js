'use strict';

define([
  'jquery', 'playerevent', 'search', 'auth'
], function ($, playerEvent, search, auth) {

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
  }
};

return new Dropbeat();

});
