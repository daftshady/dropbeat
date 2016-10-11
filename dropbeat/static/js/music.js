'use strict';

define([
], function () {

/*
 * Music object implementation.
 */

function Music (id, title, type) {
  this.id = id;
  this.title = title;
  this.type = type;
};

Music.prototype = {
};

return Music;

});
