/*jslint browser: true*/
var DROPBEAT = (function (module) {
    'use strict';

    module.storage = {};

    module.storage.localStorage = {
// Defines wrapper for HTML5 localStorage.
        playlistKey: 'playlist',
        visitedKey: 'first',
        getPlaylist: function (idx, old) {
            var that = this,
                raw,
                playlist,
                i,
                m;

            idx = !idx ? 0 : idx;
            raw = localStorage.getItem(that.localPlaylistKey(idx));
            if (old) {
                raw = localStorage.getItem(that.playlistKey);
            }
            if (raw) {
                playlist = new module.s.Playlist();
                raw = JSON.parse(raw);
                for (i = 0; i < raw.length; i += 1) {
                    m = new module.s.Music(raw[i]);
                    playlist.add(m);
                }
            } else {
                playlist = new module.s.Playlist();
            }
            return playlist;
        },

        setPlaylist: function (playlist, idx) {
            var that = this;

            localStorage.setItem(that.localPlaylistKey(idx), playlist);
        },

        localPlaylistKey: function (idx) {
            var that = this,
                key = that.playlistKey;

            if (idx) {
                key = key + idx;
            }
            return key;
        },

        flushPlaylist: function (idx) {
            var that = this;

            localStorage.setItem(that.localPlaylistKey(idx), '[]');
        },

        getVisited: function () {
            var that = this;

            return localStorage.getItem(that.visitedKey);
        },

        setVisited: function () {
            var that = this;

            localStorage.setItem(that.visitedKey, true);
        }
    };

    return module;
}(DROPBEAT));
