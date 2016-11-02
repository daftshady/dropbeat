'use strict';

define([
], function () {

/**
 * Playlist Constructor.
 */

function Playlist (uid, tracks) {
  var innerList = [];

  this.uid = uid;

  this.get = function (idx) {
    if (idx < innerList.length) {
      return innerList[idx];
    }
  };

  this.index = function (track) {
    var i, len = innerList.length;

    for (i = 0; i < len; i += 1) {
      if (innerList[i].id === track.uid) {
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

    innerList.push(track);
    return true;
  };

  this.remove = function (track) {
    var idx = this.index(track);

    if (idx === -1) {
      return false;
    }

    innerList.splice(idx, 1);
  };

  this.toArray = function () {
    return innerList;
  };

  this.clear = function () {
    innerList = [];
  };

  this.size = function () {
    return innerList.length;
  };

  this.isEmpty = function () {
    return innerList.length === 0;
  };

  if (tracks instanceof Array) {
    innerList = innerList.concat(tracks);
  }
};

return Playlist;

});
