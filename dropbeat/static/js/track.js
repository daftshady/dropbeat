'use strict';

define(function () {

/**
 * Track object.
 */

function Track (uid, name, source) {
  // Unique id which is used to identify track in each service
  this.uid = uid;

  // Track name from streaming sources
  this.name = name;

  // Streaming sources such as youtube
  this.source = source;
};

return Track;

});
