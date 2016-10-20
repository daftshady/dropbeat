'use strict';

define([
  'jquery', 'playerevent'
], function ($, playerEvent) {

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
  }
};

return new Dropbeat();

});
