'use strict';

define(function () {

/*
 * Track object implementation.
 */

function Track (id, title, type) {
  this.id = id;
  this.title = title;
  this.type = type;
};

Track.prototype = {
};

return Track;

});
