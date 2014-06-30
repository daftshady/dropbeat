function PlaylistManager() {
    var that = this;
    // This object has `k,v` of `playlist name, playlist.
    that.playlists = {}
    that.localKey = 'local';
    // Instant key for shared playlist.
    that.shareKey = 'share';
    that.generateType = {'artist':0};
    that.maxLocalPlaylist = 3;
    that.playingLocalSeq = 0;

    that.elems = {
        playlist: ".playlist",
        playlistInner:".playlist-section .playlist .playlist-inner",
        playlistRowTemplate:"#tmpl-playlist-row",
        playlistMusicContainer:".a-playlist-music",
        musicPlayBtn:".music-title-wrapper",
        musicRemoveBtn:".music-remove",
        playlistMusicCount:".playlist-section .playlist-footer .music-count",
        musicTitleScroller:".music-title-scroll-wrapper",
        musicTitle:".music-title"
    };
    that.init = function() {
        that.delegateTriggers();
        // Load playlist in uri.
        var shareKey = keyFromUri(shareUriKey);
        if (shareKey) {
            PlaylistControl.load(shareKey);
            NotifyManager.inSharedPlaylist();

            // We don't want to load original local playlist when
            // user accessed with shared uri.

            return;
        }

        var autogenKey = keyFromUri(autogenUriKey);
        if (autogenKey) {
            that.autogen(that.generateType.artist, autogenKey);
            NotifyManager.inSharedPlaylist();
            return;
        }

        var isLogined = false;
        if (isLogined) {
            // Merge local playlist with server playlist and load it.
        } else {
            // Load local playlist.
            if (!LocalStorage.getVisited()) {
                LocalStorage.setVisited();
                if (LocalStorage.getPlaylist().empty()) {
                    initialPlaylistToNewComer();
                }
            }

            var initialIdx = 0;
            that.loadLocal(initialIdx);
        }
    };

    that.add = function(key, playlist) {
        // XXX: playlist type validation
        that.playlists[key] = playlist;
    };

    that.remove = function(key) {
        delete that.playlists[key];
    };

    that.loadLocal = function(idx) {
        var playlist = LocalStorage.getPlaylist(idx);

        that.playlists[that.localKey+idx] = playlist;
        that.updatePlaylistView(that.localKey+idx);
    };

    that.updatePlaylistView = function(key) {
        // Temporal method.
        // We do not support multiple playlist yet.
        if (key) {
            var playlist = that.playlists[key];
            if (playlist) {
                playlist.toTable(true);
            }
        } else {
            that.getCurrentPlaylist().toTable(true);
        }
    };

    that.getCurrentPlaylist = function() {
        // Temporally returns local playlist.
        var idx = PlaylistTabs.currentIdx();
        return that.shareKey in that.playlists ?
            that.playlists[that.shareKey] : that.playlists[that.localKey+idx];
    };

    that.getCurrentPlaylistIdx = function() {
        return PlaylistTabs.currentIdx();
    };

    that.getPlaylistWithIdx = function(idx) {
        if (idx < 0)
            return [];
        return that.shareKey in that.playlists ?
            that.playlists[that.shareKey] : that.playlists[that.localKey+idx];
    };

    that.getCurrentLocalPlaylist = function() {
        var current =
            LocalStorage.getPlaylist(PlaylistTabs.currentIdx());
        if (current) {
            return current.raw();
        }
    };

    that.getLocalPlaylist = function(idx) {
        if (that.shareKey in that.playlists) {
            return that.playlists[that.shareKey];
        }
        return LocalStorage.getPlaylist(idx);
    };

    that.changeCurrentPlaylist = function() {
    };

    that.maxPlaylist = function() {
        return that.maxLocalPlaylist;
    };

    that.delegateTriggers = function(){
        // Flush previous trigger bindings for the purpose of preventing
        // multiple binding on same parent elem.
        $(that.elems.playlistInner).on(
            "click", that.elems.musicPlayBtn, function() {
            var $musicContainer = $(this).parents(that.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            playerManager.onMusicClicked(new Music(musicData), true);
        });

        $(that.elems.playlistInner).on(
            "click", that.elems.musicRemoveBtn, function() {
            var $musicContainer = $(this).parents(that.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            var playlist = playlistManager.getCurrentPlaylist();
            playlist.remove(new Music(musicData), true);

            if (syncImmediately) {
                playlistManager.getCurrentPlaylist().sync();
            }
        });

        $(that.elems.playlistInner).on(
            "mouseenter", that.elems.musicPlayBtn, function(){
            var e = that.elems.playlistInner;
            var $marquee = $(this).find(that.elems.musicTitleScroller);
            var $title = $(this).find(that.elems.musicTitle);
            if ($title.width() <= $marquee.width())
                return;
            var speed = 20;
            var animPeriod = speed * $title.width();
            $title.css({ left: 0 });
            $title.animate(
                {left: -$title.width()},
                animPeriod, 'linear', function() {
                $title.trigger('marquee');
            });
            $title.bind('marquee', function(){
                var contentsWidth = $(this).width();
                var frameWidth = $marquee.width();
                var animPeriod = speed * (frameWidth + contentsWidth);
                $(this).css({left:frameWidth});
                $(this).animate(
                    {left:-contentsWidth},
                    animPeriod, 'linear', function(){
                    $(this).trigger('marquee');
                });
            });
        });

        $(that.elems.playlistInner).on(
            "mouseleave", that.elems.musicPlayBtn, function(){
            var $title = $(this).find(".music-title");
            $title.unbind('marquee');
            $title.clearQueue();
            $title.stop();
            $title.css({left:0});
        });
    };
    that.autogen = function(generate_type, key) {
        if (that.generateType.artist === generate_type) {
            return that.genFromArtist(key);
        }
        // Raise for NotImplemented
    };
    that.genFromArtist = function(artist) {
        PlaylistControl.generate(artist);
    };
}

var shareUriKey = '?playlist=';
var autogenUriKey = '?artist=';
function keyFromUri(key) {
    var uri = location.search;
    if (uri.indexOf(key) !== -1) {
        return uri.slice(key.length);
    }
    return false;
}
