/*jslint browser: true*/
/*jslint nomen: true*/
/*global $, _*/
var DROPBEAT = (function (module) {
    'use strict';

    module.playlist = {};

    module.playlist.Playlist = function () {
        var that = this;

        that.playlist = [];
        that.renderPlaylistRow = function (music, idx) {
            if (!music.id) {
                return "";
            }
            if (!that.rowTemplate) {
                that.rowTemplate =
                    _.template(
                        $(module.playlistManager.elems.playlistRowTemplate).html()
                    );
            }
            return that.rowTemplate({music: music, idx: idx});
        };
        that.init = function (params) {
            if (params instanceof Array) {
                that.playlist = that.playlist.concat(params);
            }
        };

        that.getWithIdx = function (idx) {
            if (idx < that.playlist.length) {
                return that.playlist[idx];
            }
        };

        that.add = function (music, updateView) {
            var idx = that.findIdx(music.id),
                elems;

            if (idx !== -1) {
                return false;
            }
            that.playlist.push(music);
            if (updateView) {
                that.toTable(true);
                elems = module.playlistManager.elems;
                $(elems.playlist).stop();
                $(elems.playlist).animate({
                    scrollTop: 100 * that.length()
                }, '1000');
            }

            if (module.playlistManager.playingLocalSeq
                    === module.s.playlistTabs.currentIdx()) {
                module.s.musicQ.push(music);
            }
            return true;
        };

        that.remove = function (music, updateView) {
            var idx = that.findIdx(music.id);

            if (idx > -1) {
                that.playlist.splice(idx, 1);
            }
            if (updateView) {
                that.toTable(true);
            }

            if (module.playlistManager.playingLocalSeq
                    === module.s.playlistTabs.currentIdx()) {
                module.s.musicQ.removeWithId(music.id);
            }

        };

        that.slicePlaylist = function (musicId) {
            var idx = that.findIdx(musicId);

            return that.playlist.slice(idx + 1);
        };

        that.findIdx = function (musicId) {
            var idx = -1,
                i;

            for (i = 0; i < that.playlist.length; i += 1) {
                if (that.playlist[i].id === musicId) {
                    idx = i;
                }
            }
            return idx;
        };

        that.sync = function () {
// We don't sync if we are on shared Playlist!
            if (module.shareManager.onSharedList()) {
                return;
            }
            that.localSync();
        };

        that.localSync = function () {
            // Sync all local playlists.
            var idx = module.s.playlistTabs.currentIdx();
            module.s.localStorage.setPlaylist(JSON.stringify(that.playlist), idx);
        };

        that.remoteSync = function () {
            throw "NotImplemented";
        };

        that.toTable = function (clean) {
// Convertes `Playlist` to Table in HTML.

            var playlistManager = module.playlistManager,
                playerManager = module.playerManager,
                playlistView = $(playlistManager.elems.playlistInner),
                playlistRow =
                    $(playlistManager.elems.playlistMusicContainer, playlistView),
                title,
                i;

            if (clean) {
                playlistRow.remove();
            }
            for (i = 0; i < that.playlist.length; i += 1) {
                playlistView.append(that.renderPlaylistRow(that.playlist[i], i + 1));
            }
            module.s.viewControl.resizePlaylistRow();
            $(playlistManager.elems.playlistMusicCount).text(that.playlist.length);

// Re-bold current music if playing.
            if (playerManager.currentMusic
                    && playlistManager.playingLocalSeq
                        === module.s.playlistTabs.currentIdx()) {
                title = playerManager.currentMusic.title;
                module.s.boldTitle(title);
            }
        };

        that.raw = function () {
            return that.playlist;
        };

        that.toJsonStr = function (reverse_quote) {
            var i,
                m;

            for (i = 0; i < that.playlist.length; i += 1) {
                m = that.playlist[i];
                if (reverse_quote) {
                    m.title = m.title.replace(/'/g, "`");
                    m.title = m.title.replace(/"/g, "`");
                } else {
                    m.title = m.title.replace(/`/g, "'");
                }
            }
            return JSON.stringify(that.playlist);
        };

        that.clear = function (updateView) {
            that.playlist = [];
            if (updateView) {
                that.toTable(true);
            }
        };

        that.length = function () {
            return that.playlist.length;
        };

        that.empty = function () {
            return that.length() === 0;
        };
    };

    module.playlist.boldTitle = function (title) {
        var elem = $('.playlist-section .playlist .a-playlist-music');
        $.each(elem, function (idx) {
            var that = this;

            if ($(".music-title", that).text() === title) {
                $(that).addClass("on");
            }
        });
    };

    module.playlist.unboldTitle = function () {
        $('.playlist-section .playlist .a-playlist-music').
            removeClass('on');
    };

    return module;
}(DROPBEAT));
