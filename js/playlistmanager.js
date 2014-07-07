/*jslint browser: true*/
/*global $*/
var DROPBEAT = (function (module) {
    'use strict';

    function PlaylistManager() {
        var that = this;

        that.playlists = {}; // This object has `k,v` of `playlist name, playlist.
        that.localKey = 'local';
        that.shareKey = 'share';
        that.generateType = {'artist': 0};
        that.maxLocalPlaylist = 3;
        that.playingLocalSeq = 0;

        that.elems = {
            playlist: ".playlist",
            playlistInner: ".playlist-section .playlist .playlist-inner",
            playlistRowTemplate: "#tmpl-playlist-row",
            playlistMusicContainer: ".a-playlist-music",
            musicPlayBtn: ".music-title-wrapper",
            musicRemoveBtn: ".music-remove",
            playlistMusicCount: ".playlist-section .playlist-footer .music-count",
            musicTitleScroller: ".music-title-scroll-wrapper",
            musicTitle: ".music-title"
        };

        that.init = function () {
            that.delegateTriggers();
            // Load playlist in uri.
            var shareKey =
                module.shareManager.keyFromUri(module.constants.shareUriKey),
                autogenKey,
                isLogined;

            if (shareKey) {
                module.s.playlistBase.load(shareKey);
                module.s.notifyManager.inSharedPlaylist();
                // We don't want to load original local playlist when
                // user accessed with shared uri.

                return;
            }

            autogenKey =
                module.shareManager.keyFromUri(module.constants.autogenUriKey);
            if (autogenKey) {
                that.autogen(that.generateType.artist, autogenKey);
                module.s.notifyManager.inSharedPlaylist();
                return;
            }

            isLogined = false;
            if (isLogined) {
                throw "NotImplemented";
            } else {
// Load local playlist.
                if (!module.s.localStorage.getVisited()) {
                    module.s.localStorage.setVisited();
                    if (module.s.localStorage.getPlaylist().empty()) {
// Initialize initial playlist to newcomer here.
                        throw "CurrentlyDisabled";
                    }
                }

// `loadLocal` takes `initialIndex` params (which is `0` here)
                that.loadLocal(0);
            }
        };

        that.add = function (key, playlist) {
            // XXX: playlist type validation
            that.playlists[key] = playlist;
        };

        that.remove = function (key) {
            delete that.playlists[key];
        };

        that.loadLocal = function (idx) {
            var playlist = module.s.localStorage.getPlaylist(idx);

            that.playlists[that.localKey + idx] = playlist;
            that.updatePlaylistView(that.localKey + idx);
        };

        that.updatePlaylistView = function (key) {
            var playlist = that.playlists[key];

            if (key) {
                if (playlist) {
                    playlist.toTable(true);
                }
            } else {
                that.getCurrentPlaylist().toTable(true);
            }
        };

        that.getCurrentPlaylist = function () {
            var idx = module.s.playlistTabs.currentIdx();

            return that.playlists.hasOwnProperty(that.shareKey) ?
                    that.playlists[that.shareKey] : that.playlists[that.localKey + idx];
        };

        that.getCurrentPlaylistIdx = function () {
            return module.s.playlistTabs.currentIdx();
        };

        that.getPlaylistWithIdx = function (idx) {
            if (idx < 0) {
                return [];
            }
            return that.playlists.hasOwnProperty(that.shareKey) ?
                    that.playlists[that.shareKey] : that.playlists[that.localKey + idx];
        };

        that.getCurrentLocalPlaylist = function () {
            var current =
                module.s.localStorage.getPlaylist(
                    module.s.playlistTabs.currentIdx()
                );

            if (current) {
                return current.raw();
            }
        };

        that.getLocalPlaylist = function (idx) {
            if (that.playlists.hasOwnProperty(that.shareKey)) {
                return that.playlists[that.shareKey];
            }
            return module.s.localStorage.getPlaylist(idx);
        };

        that.changeCurrentPlaylist = function () {
        };

        that.maxPlaylist = function () {
            return that.maxLocalPlaylist;
        };

        that.delegateTriggers = function () {
// Flush previous trigger bindings for the purpose of preventing
// multiple binding on same parent elem.
            $(that.elems.playlistInner).on(
                "click",
                that.elems.musicPlayBtn,
                function () {
                    var self = this,
                        $musicContainer = $(self).parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        };

                    module.playerManager.onMusicClicked(
                        new module.s.Music(musicData),
                        true
                    );
                }
            );

            $(that.elems.playlistInner).on(
                "click",
                that.elems.musicRemoveBtn,
                function () {
                    var self = this,
                        $musicContainer = $(self).parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        },
                        playlist = module.playlistManager.getCurrentPlaylist();

                    playlist.remove(new module.s.Music(musicData), true);
                    module.playlistManager.getCurrentPlaylist().sync();
                }
            );

            $(that.elems.playlistInner).on(
                "mouseenter",
                that.elems.musicPlayBtn,
                function () {
                    var self = this,
                        e = that.elems.playlistInner,
                        $marquee = $(self).find(that.elems.musicTitleScroller),
                        $title = $(self).find(that.elems.musicTitle),
                        speed,
                        animPeriod;

                    if ($title.width() <= $marquee.width()) {
                        return;
                    }

                    speed = 20;
                    animPeriod = speed * $title.width();
                    $title.css({left: 0});
                    $title.animate(
                        {left: -$title.width()},
                        animPeriod,
                        'linear',
                        function () {
                            $title.trigger('marquee');
                        }
                    );
                    $title.bind(
                        'marquee',
                        function () {
                            var contentsWidth = $(self).width(),
                                frameWidth = $marquee.width(),
                                animPeriod = speed * (frameWidth + contentsWidth);
                            $(self).css({left: frameWidth});
                            $(self).animate(
                                {left: -contentsWidth},
                                animPeriod,
                                'linear',
                                function () {
                                    $(self).trigger('marquee');
                                }
                            );
                        }
                    );
                }
            );

            $(that.elems.playlistInner).on(
                "mouseleave",
                that.elems.musicPlayBtn,
                function () {
                    var self = this,
                        $title = $(self).find(".music-title");
                    $title.unbind('marquee');
                    $title.clearQueue();
                    $title.stop();
                    $title.css({left: 0});
                }
            );
        };

        that.autogen = function (generate_type, key) {
            if (that.generateType.artist === generate_type) {
                return that.genFromArtist(key);
            }
        };

        that.genFromArtist = function (artist) {
            module.s.playlistBase.generate(artist);
        };
    }

    module.playlistManager = new PlaylistManager();

    function ShareManager() {
        var that = this;

        that.keyFromUri = function (key) {
            var uri = location.search;
            if (uri.indexOf(key) !== -1) {
                return uri.slice(key.length);
            }
            return false;
        };

        that.onSharedList = function () {
            return that.keyFromUri(module.constants.shareUriKey)
                || that.keyFromUri(module.constants.autogenUriKey);
        };
    }

    module.shareManager = new ShareManager();

    return module;
}(DROPBEAT));
