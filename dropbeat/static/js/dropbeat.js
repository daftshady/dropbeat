'use strict';

define([
  'jquery', 'playerevent', 'search'
], function ($, playerEvent, search) {

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
  }
};

return new Dropbeat();

});
