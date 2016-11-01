'use strict';

define([
], function () {

/**
 * Playlist Constructor.
 */

function Playlist (params) {
  var innerList = [];

  this.get = function (idx) {
    if (idx < innerList.length) {
      return innerList[idx];
    }
  };

  this.index = function (track) {
    var i, len = innerList.length;

    for (i = 0; i < len; i += 1) {
      if (inenrList[i].id === musicId) {
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

  if (params instanceof Array) {
    innerList = innerList.concat(params);
  }
};

return Playlist;

});
