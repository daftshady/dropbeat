'use strict';

define([
    'player'
], function (players) {

/*
 * Player Manager APIs.
 * This manager work for managing playlist, play callbacks and etc.
 */

function PlayerManager () {
  this.getCurrentPlayer = function () {
    return null;
  }

  this.playCallbacks = {
    'onPlay': null,
    'onFinish': null,
  };
};

return new PlayerManager();

});
