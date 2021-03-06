'use strict';

define([
], function () {

/**
 * Playlist object
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

  // Public field for ui template.
  this.editing = false;
  this.selected = false;

  // Returns index of track having given uid.
  // Tracks are regarded to be equal if both have the same uid.
  this.index = function (uid) {
    for (var i = 0; i < this.tracks.length; i += 1) {
      if (this.tracks[i].uid === uid) {
        return i;
      }
    }

    return -1;
  };

  // Adds track to the playlist and returns success boolean.
  this.add = function (track) {
    var idx = this.index(track.uid);

    if (idx !== -1) {
      // Fails if the track already exists.
      return false;
    }

    this.tracks.push(track);
    return true;
  };

  // Removes track from the playlist and returns success boolean.
  this.remove = function (uid) {
    var idx = this.index(uid);

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

  this.push = function (track) {
    this.tracks.push(track);
  };
};

return Playlist;

});
