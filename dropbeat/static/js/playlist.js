'use strict';

define([
], function () {

/**
 * Playlist Constructor.
 */

function Playlist (uid, name, tracks) {
  this.name = name;
  this.uid = uid;
  this.tracks = tracks || [];

  this.get = function (idx) {
    if (idx < this.tracks.length) {
      return this.tracks[idx];
    }
  };

  // Returns index of the given track.
  // Tracks are regarded to be equal if both have the same uid.
  this.index = function (track) {
    for (var i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i].uid === track.uid) {
        return i;
      }
    }

    return -1;
  };

  // Adds track to the playlist and returns success boolean.
  this.add = function (track) {
    var idx = this.index(track);

    if (idx !== -1) {
      // Fails if the track already exists.
      return false;
    }

    this.tracks.push(track);
    return true;
  };

  // Removes track from the playlist and returns success boolean.
  this.remove = function (track) {
    var idx = this.index(track);

    if (idx === -1) {
      // Cannot remove non-exist track.
      return false;
    }

    this.tracks.splice(idx, 1);
    return true;
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
