function PlaylistManager() {
    var self = this;
    // This object has `k,v` of `playlist name, playlist.
    self.playlists = {}
    self.localKey = 'local';
    // Instant key for shared playlist.
    self.shareKey = 'share';
    self.generateType = {'artist':0};
    self.maxLocalPlaylist = 3;
    self.playingLocalSeq = 0;

    self.elems = {
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
    self.init = function() {
        self.delegateTriggers();
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
            self.autogen(self.generateType.artist, autogenKey);
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
            self.loadLocal(initialIdx);
        }
    };

    self.add = function(key, playlist) {
        // XXX: playlist type validation
        self.playlists[key] = playlist;
    };

    self.remove = function(key) {
        delete self.playlists[key];
    };

    self.loadLocal = function(idx) {
        var playlist = LocalStorage.getPlaylist(idx);

        self.playlists[self.localKey+idx] = playlist;
        self.updatePlaylistView(self.localKey+idx);
    };

    self.updatePlaylistView = function(key) {
        // Temporal method.
        // We do not support multiple playlist yet.
        if (key) {
            var playlist = self.playlists[key];
            if (playlist) {
                playlist.toTable(true);
            }
        } else {
            self.getCurrentPlaylist().toTable(true);
        }
    };

    self.getCurrentPlaylist = function() {
        // Temporally returns local playlist.
        var idx = PlaylistTabs.currentIdx();
        return self.shareKey in self.playlists ?
            self.playlists[self.shareKey] : self.playlists[self.localKey+idx];
    };

    self.getCurrentPlaylistIdx = function() {
        return PlaylistTabs.currentIdx();
    };

    self.getPlaylistWithIdx = function(idx) {
        if (idx < 0)
            return [];
        return self.shareKey in self.playlists ?
            self.playlists[self.shareKey] : self.playlists[self.localKey+idx];
    };

    self.getCurrentLocalPlaylist = function() {
        var current =
            LocalStorage.getPlaylist(PlaylistTabs.currentIdx());
        if (current) {
            return current.raw();
        }
    };

    self.getLocalPlaylist = function(idx) {
        if (self.shareKey in self.playlists) {
            return self.playlists[self.shareKey];
        }
        return LocalStorage.getPlaylist(idx);
    };

    self.changeCurrentPlaylist = function() {
    };

    self.maxPlaylist = function() {
        return self.maxLocalPlaylist;
    };

    self.delegateTriggers = function(){
        // Flush previous trigger bindings for the purpose of preventing
        // multiple binding on same parent elem.
        $(self.elems.playlistInner).on(
            "click", self.elems.musicPlayBtn, function() {
            var $musicContainer = $(this).parents(self.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            playerManager.onMusicClicked(new Music(musicData), true);
        });

        $(self.elems.playlistInner).on(
            "click", self.elems.musicRemoveBtn, function() {
            var $musicContainer = $(this).parents(self.elems.musicContainer);
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

        $(self.elems.playlistInner).on(
            "mouseenter", self.elems.musicPlayBtn, function(){
            var e = self.elems.playlistInner;
            var $marquee = $(this).find(self.elems.musicTitleScroller);
            var $title = $(this).find(self.elems.musicTitle);
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

        $(self.elems.playlistInner).on(
            "mouseleave", self.elems.musicPlayBtn, function(){
            var $title = $(this).find(".music-title");
            $title.unbind('marquee');
            $title.clearQueue();
            $title.stop();
            $title.css({left:0});
        });
    };
    self.autogen = function(generate_type, key) {
        if (self.generateType.artist === generate_type) {
            return self.genFromArtist(key);
        }
        // Raise for NotImplemented
    };
    self.genFromArtist = function(artist) {
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
