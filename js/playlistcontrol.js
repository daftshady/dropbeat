/*jslint browser: true*/
/*global $, alert*/
var DROPBEAT = (function (module) {
    'use strict';

    var control;

    module.playlist.control = {};
    control = module.playlist.control;

    control.tabs = {
        elems: {
            playlists: '#playlists'
        },
        init: function () {
            var that = this,
                lists = $(that.elems.playlists).children();

            if (module.shareManager.onSharedList()) {
// We don't need to make tabs clickable if on shared playlist.
                $.each(lists, function (idx) {
                    var that = this;

                    if (idx !== 0) {
                        $(that).remove();
                    }
                });
                return;
            }

            $.each(lists, function (idx) {
                var that = this;

                $(that).click(function () {
                    var highlight = 'playlist-tab-on';

                    module.playlistManager.getCurrentPlaylist().sync();
                    lists.removeClass(highlight);
                    $(that).addClass(highlight);
                    module.playlistManager.loadLocal(idx);
                });
            });
        },

        currentIdx: function () {
            var that = this,
                playlistIdx;

            $.each($(that.elems.playlists).children(), function (idx) {
                var that = this;

                if ($(that).hasClass('playlist-tab-on')) {
                    playlistIdx = idx;
                }
            });
            return playlistIdx;
        }
    };

    control.base = {
        elems: {
            sharePlaylistBtn: ".playlist-section .share-playlist-button",
            clearPlaylistBtn: ".playlist-section .clear-playlist-button",
            playlistFilterInput: ".playlist-section #search-playlist-input"
        },

        init: function () {
            var that = this;

            if (module.shareManager.onSharedList()) {
                $(that.elems.sharePlaylistBtn).remove();
            }

            $(that.elems.sharePlaylistBtn).click(function () {
                var playlist = module.playlistManager.getCurrentPlaylist(),
                    uuid,
                    url;

                if (playlist.empty()) {
                    module.s.notifyManager.sharePlaylist(false);
                    return;
                }

// There's a possible collision in uuid, but it doesn't matter.
                uuid = Math.uuid(8);
                $.ajax({
                    type: "POST",
                    url: module.api.playlistUrl,
                    data: {
                        'key' : uuid,
                        'playlist' : playlist.toJsonStr(true)
                    },
                    crossDomain: true
                });

                url = module.host + '/?playlist=' + uuid;
                module.s.notifyManager.sharePlaylist(true, url);
                module.s.notifyManager.onclick(
                    '.playlist-section',
                    function () {
                        window.open(url);
                    }
                );
            });

            $(that.elems.clearPlaylistBtn).click(function () {
                var playlist = module.playlistManager.getCurrentPlaylist();

                playlist.clear(true);
                playlist.sync();
                module.s.notifyManager.playlistCleared();
            });

            $(that.elems.playlistFilterInput).bind(
                "propertychange keyup input paste",
                function (event) {
                    clearTimeout(that.filterTimer);
                    that.filterTimer = setTimeout(function () {
                        that.filter(
                            $(that.elems.playlistFilterInput).
                                val().toLowerCase()
                        );
                    }, 800);
                }
            );
        },

        filterTimer: null,

        filter: function (keyword) {
            var temp = new module.s.Playlist(),
                current = module.playlistManager.getCurrentPlaylist(),
                i,
                m;

            if (keyword) {
                for (i = 0; i < current.length(); i += 1) {
                    m = current.getWithIdx(i);
                    if (m.title.toLowerCase().indexOf(keyword) !== -1) {
                        temp.raw().push(m);
                    }
                }
                temp.toTable(true);
            } else {
                module.playlistManager.getCurrentPlaylist().toTable(true);
            }
        },

        load: function (key) {
            var that = this;

            $.ajax({
                url: module.api.playlistUrl,
                data: {'key': key, 'type': 'jsonp'},
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function (data) {
                    that.loadCallback(data);
                }
            });
        },

        loadCallback: function (data) {
            var playlist,
                i;

            if (data) {
                playlist = new module.s.Playlist();
                for (i = 0; i < data.length; i += 1) {
                    playlist.add(new module.s.Music(data[i]));
                }

                module.playlistManager.add(
                    module.playlistManager.shareKey,
                    playlist
                );
                module.playlistManager.updatePlaylistView();
                module.s.notifyManager.playlistLoaded();
            } else {
                alert('Invalid access');
                location.href = module.host;
            }
        },

        generate: function (key, id) {
            var that = this,
                playlistManager = module.playlistManager;

            if (!id) {
                id = Math.floor((1 + Math.random()) * 0x10000).
                    toString(16).substring(1);
                playlistManager.add(
                    playlistManager.shareKey,
                    new module.s.Playlist()
                );
            }

            $.ajax({
                url: module.api.playlistAutogenUrl,
                data: decodeURIComponent(
                    $.param({
                        'key': key,
                        'id': id,
                        'type': 'jsonp'
                    })
                ),
                dataType: 'jsonp',
                success: function (data) {
                    that.generateCallback(data);
                },
                timeout: 15000
            });
        },

        generateCallback: function (data) {
            var that = this,
                noMorePoll =
                    $.grep(
                        data,
                        function (e) {
                            return !e.remains;
                        }
                    ).length !== 0,
                wrapper,
                i;

            if (data) {
                wrapper = function (obj, j) {
                    setTimeout(function () {
                        module.playlistManager.
                            getCurrentPlaylist().
                                add(new module.s.Music(obj), true);
                    }, 100 * j);
                };

                if (data.length > 1 && noMorePoll) {
                    for (i = 0; i < data.length; i += 1) {
                        wrapper(data[i], i);
                    }
                    return;
                }

                for (i = 0; i < data.length; i += 1) {
                    if (data[i].id) {
                        module.playlistManager.getCurrentPlaylist().add(
                            new module.s.Music(data[i]),
                            true
                        );
                    }
                }
                if (!noMorePoll) {
                    that.generate(data[0].key, data[0].poll_id);
                }

            }

        }
    };

    return module;
}(DROPBEAT));
