'use strict';

define([
  'jquery', 'playercontrol'
], function ($, controller) {

function Dropbeat () {
};

/*
 * The core Dropbeat client
 *
 * @this {Dropbeat}
 */

Dropbeat.prototype = {
  debug: true,

  initialize: function () {
    controller.init();
  }
};

return new Dropbeat();

});
