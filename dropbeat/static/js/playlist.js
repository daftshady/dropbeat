'use strict';

define([
], function () {

/**
 * Playlist Constructor.
 */

function Playlist (uid, name, tracks) {
  var that = this;

  this.name = name;
  this.uid = uid;
  this.tracks = tracks || [];

  this.get = function (idx) {
    if (idx < that.tracks.length) {
      return that.tracks[idx];
    }
  };

  this.index = function (track) {
    var i, len = that.tracks.length;

    for (i = 0; i < len; i += 1) {
      if (that.tracks[i].id === track.uid) {
        return i;
      }
    }

    return -1;
  };

  this.add = function (track) {
    var idx = that.index(track);

    if (idx !== -1) {
      return false;
    }

    that.tracks.push(track);
    return true;
  };

  this.remove = function (track) {
    var idx = that.index(track);

    if (idx === -1) {
      return false;
    }

    that.tracks.splice(idx, 1);
  };

  this.toArray = function () {
    return that.tracks;
  };

  this.clear = function () {
    that.tracks = [];
  };

  this.size = function () {
    return that.tracks.length;
  };

  this.isEmpty = function () {
    return that.tracks.length === 0;
  };
};

return Playlist;

});
