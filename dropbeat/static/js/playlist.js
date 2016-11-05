'use strict';

define([
], function () {

/**
 * Playlist Constructor.
 */

function Playlist (uid, name, tracks) {
  this.uid = uid || null;
  this.name = name || '';
  this.tracks = tracks || [];

  this.get = function (idx) {
    if (idx < this.tracks.length) {
      return this.tracks[idx];
    }
  };

  this.index = function (track) {
    var i, len = this.tracks.length;

    for (i = 0; i < len; i += 1) {
      if (this.tracks[i].uid === track.uid) {
        return i;
      }
    }

    return -1;
  };

  this.add = function (track) {
    var idx = this.index(track);

    if (idx !== -1) {
      return false;
    }

    this.tracks.push(track);
    return true;
  };

  this.remove = function (track) {
    var idx = this.index(track);

    if (idx === -1) {
      return false;
    }

    this.tracks.splice(idx, 1);
  };

  this.toArray = function () {
    return this.tracks;
  };

  this.clear = function () {
    this.tracks = [];
  };

  this.size = function () {
    return this.tracks.length;
  };

  this.isEmpty = function () {
    return this.tracks.length === 0;
  };
};

return Playlist;

});
