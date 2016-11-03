'use strict';

define(function () {

/**
 * Track object implementation.
 */

function Track (uid, name, source) {
  this.uid = uid;
  this.name = name;
  this.source = source;
};

Track.prototype = {
};

return Track;

});
