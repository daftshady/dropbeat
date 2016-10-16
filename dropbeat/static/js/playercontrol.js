'use strict';

define([
  'jquery', 'playermanager'
], function ($, manager) {

/*
 * Player Controller.
 * This controller is responsible for user's interactions.
 */

function PlayerController () {
  var root = $('#dropbeat'),
      buttons = {
        playToggle: root.find('.ctrl.ctrl-play'),
        prev: root.find('.ctrl.ctrl-prev'),
        next: root.find('.ctrl.ctrl-next'),
        repeat: root.find('.ctrl.ctrl-repeat'),
        shuffle: root.find('.ctrl.ctrl-next')
      };

  this.init = function () {
  };
};

return new PlayerController();

});
