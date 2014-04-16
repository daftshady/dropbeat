function PlaylistManager() {
    var self = this;
    // This object has `k,v` of `playlist name, playlist.
    self.playlists = {}
    self.localKey = 'local';
    // Instant key for shared playlist.
    self.shareKey = 'share';
    self.maxLocalPlaylist = 3;
    self.playingLocalSeq = 0;

    self.elems = {
        playlist:".playlist-section .playlist .playlist-inner",
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
        var uriKey = keyFromUri();
        if (uriKey) {
            PlaylistControl.load(uriKey);
            NotifyManager.inSharedPlaylist();
            /*
            We don't want to load original local playlist when
            user accessed with shared uri.
            */
            return;
        }

        var isLogined = false;
        if (isLogined) {
            // Merge local playlist with server playlist and load it.
        } else {
            // Load local playlist.
            if (LocalStorage.getVisited() == null) {
                LocalStorage.setVisited();
                if (LocalStorage.getPlaylist().empty()) {
                    initialPlaylistToNewComer();
                }
            }

            // Temporal migration for old user.
            var initialIdx = 0;
            if (LocalStorage.getMigrated() == null) {
                var oldPlaylist = LocalStorage.getPlaylist(initialIdx, true);
                var firstPlaylist = LocalStorage.getPlaylist(initialIdx);
                if (!oldPlaylist.empty()) {
                    firstPlaylist.playlist = oldPlaylist.raw();
                }
                firstPlaylist.sync();
                LocalStorage.setMigrated();
            }
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
        // params migrate: Temporal migration variable.
        var playlist = LocalStorage.getPlaylist(idx);

        self.playlists[self.localKey+idx] = playlist;
        self.updatePlaylistView(self.localKey+idx);
    };

    self.updatePlaylistView = function(key) {
        // Temporal method.
        // We do not support multiple playlist yet.
        if (key) {
            var playlist = self.playlists[key];
            if (playlist != null) {
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
        if(idx < 0)
            return [];
        return self.shareKey in self.playlists ?
            self.playlists[self.shareKey] : self.playlists[self.localKey+idx];
    };

    self.getCurrentLocalPlaylist = function() {
        var current =
            LocalStorage.getPlaylist(PlaylistTabs.currentIdx());
        if (current != null) {
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
        $(self.elems.playlist).on(
            "click", self.elems.musicPlayBtn, function() {
            var $musicContainer = $(this).parents(self.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            playerManager.onMusicClicked(new Music(musicData), true);
        });

        $(self.elems.playlist).on(
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

        $(self.elems.playlist).on(
            "mouseenter", self.elems.musicPlayBtn, function(){
            var e = self.elems.playlist;
            var $marquee = $(this).find(self.elems.musicTitleScroller);
            var $title = $(this).find(self.elems.musicTitle);
            if($title.width() <= $marquee.width())
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

        $(self.elems.playlist).on(
            "mouseleave", self.elems.musicPlayBtn, function(){
            var $title = $(this).find(".music-title");
            $title.unbind('marquee');
            $title.clearQueue();
            $title.stop();
            $title.css({left:0});
        });
    };
}

function getidsCallback(data) {
    if (!data) {
        var localHash = LocalStorage.getLocalHash();
        return;
    }
    var localHash = LocalStorage.getLocalHash(data);
};

var PlaylistControl = {
    elems: {
        sharePlaylistBtn:".playlist-section .share-playlist-button",
        clearPlaylistBtn:".playlist-section .clear-playlist-button",
        playlistFilterInput:".playlist-section #search-playlist-input"
    },
    init: function() {
        if (!LocalStorage.hasLocalHash()) {
            $.ajax({
                type: "GET",
                url: API_PLAYLIST_URL,
                data: {'type':'jsonp'},
            });
        }

        if (onSharedList) {
            $(PlaylistControl.elems.sharePlaylistBtn).remove();
        }

        // XXX: Acutally, we don't need to make it clickable
        // when user is on shared list.
        $(this.elems.sharePlaylistBtn).click(function() {
            var localHash = LocalStorage.getLocalHash();
            var playlist = playlistManager.getCurrentPlaylist();
            $.ajax({
                type: "POST",
                url: API_PLAYLIST_URL,
                data: {
                    'key' : localHash,
                    'playlist' : playlist.toJsonStr(true)
                },
                crossDomain: true
            });

            // XXX: Notify key to user.
            NotifyManager.playlistShared(fullHost + '/?playlist=' + localHash);

            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat=="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction("dropbeat", "playlist-manage/share");
            }
        });

        $(this.elems.clearPlaylistBtn).click(function() {
            var playlist = playlistManager.getCurrentPlaylist();
            playlist.clear(true);
            playlist.sync();
            NotifyManager.playlistCleared();

            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat=="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction("dropbeat", "playlist-manage/clear");
            }
        });

        $(this.elems.playlistFilterInput).
            bind("propertychange keyup input paste", function(event) {
            clearTimeout(PlaylistControl.filterTimer);
            PlaylistControl.filterTimer = setTimeout(function () {
                PlaylistControl.filter($(this).val().toLowerCase());
            }, 800);
        });
    },
    filterTimer: null,
    filter: function(keyword) {
        var tempPlaylist = new Playlist();
        var current = playlistManager.getCurrentPlaylist();
        if (keyword) {
            for (var i=0; i<current.length(); i++) {
                var m = current.getWithIdx(i);
                if (m.title.toLowerCase().indexOf(keyword) != -1) {
                    // XXX: Avoid public access to `playlist`!
                    tempPlaylist.playlist.push(m);
                }
                tempPlaylist.toTable(true);
            }
        } else {
            playlistManager.getCurrentPlaylist().toTable(true);
        }
    },
    load: function(key) {
        $.ajax({
            url: API_PLAYLIST_URL,
            data: "key=" +  key+ "&type=jsonp",
        });

        // Logging
        if (window.dropbeat &&
            typeof window.dropbeat=="object" && dropbeat.logApiAction) {
            dropbeat.logApiAction("dropbeat", "playlist-manage/load");
        }
    }
};

function playlistCallback(data) {
    if (data) {
        var playlist = new Playlist();
        for (var i=0; i<data.length; i++) {
            m = new Music(data[i]);
            playlist.add(m);
        }

        playlistManager.add(
            playlistManager.shareKey, playlist);
        playlistManager.updatePlaylistView();
        NotifyManager.playlistLoaded();
    } else {
        // XXX: Warn for invalid key
        NotifyManager.invalidPlaylistKey();
        alert('Playlist not exists');
        location.href = fullHost;
    }
};

// Temporally, key generation is done in js.
// Because knowing other's key has nothing to do with security.
var words = [
    'Apple', 'Apricot', 'Avocado', 'Banana', 'Breadfruit', 'Bilberry',
    'Blackberry', 'Blueberry', 'Cantaloupe', 'Currant', 'Cherry',
    'Cherimoya', 'Cloudberry', 'Coconut', 'Cranberry', 'Cucumber',
    'Damson', 'Date', 'Durian', 'Eggplant', 'Elderberry', 'Feijoa',
    'Fig', 'Gojiberry', 'Gooseberry', 'Grape', 'Raisin', 'Grapefruit',
    'Guava', 'Honeydew', 'Jackfruit', 'Jambul', 'Jujube', 'Kiwifruit',
    'Kumquat', 'Lemon', 'Lime', 'Loquat', 'Lychee', 'Mango', 'Melon',
    'Cantaloupe', 'Honeydew', 'Watermelon', 'Mulberry', 'Nectarine',
    'Nut', 'Olive', 'Orange', 'Clementine', 'Mandarine', 'BloodOrange',
    'Tangerine', 'Pamelo', 'Papaya', 'Passionfruit', 'Peach', 'Pepper',
    'ChiliPepper', 'BellPepper', 'Pear', 'Persimmon', 'Physalis', 'Pineapple',
    'Pomelo', 'Quince', 'Raspberry', 'Rambutan', 'Redcurrant', 'Satsuma', 'Strawberry'
];

function generateKey() {
    var word = words[Math.floor(Math.random() * words.length)];
    var num = Math.floor(Math.random() * 9000) + 1000;
    return word + num;

};

var UrlAdder = {
    elems:{
        urlAddField:".add-by-url-section .url-input-field-wrapper",
        urlAddInput:".add-by-url-section #add-by-url-input",
        urlAddButton:".add-by-url-section .add-button",
        loadingSpinner:".add-by-url-section .loading-spinner"
    },
    init: function() {
        var that = this;
        $(this.elems.urlAddButton).click(function() {
            url = $(that.elems.urlAddInput).val();
            if (url == null ||
                (url.indexOf('youtube.com') == -1
                    && url.indexOf('youtu.be') == -1
                    && url.indexOf('soundcloud.com') == -1)) {
                NotifyManager.invalidAdderUrl();
            } else {
                UrlAdder.onSubmit(url);
            }
        });
    },
    adding: false,
    onSubmit: function(url) {
        if (!UrlAdder.adding) {
            UrlAdder.hideAll();
            UrlAdder.adding = true;
            $.ajax({
                url: API_RESOLVE_URL,
                data: "url=" + url + "&type=jsonp",
            });
        }

        // Logging
        if(window.dropbeat &&
            typeof window.dropbeat=="object" && dropbeat.logApiAction) {
            dropbeat.logApiAction("dropbeat", "playlist-manage/load-from-url");
        }
    },
    showAll: function() {
        $(this.elems.urlAddField).show();
        $(this.elems.loadingSpinner).hide();
    },
    hideAll: function() {
        $(this.elems.urlAddField).hide();
        $(this.elems.loadingSpinner).show();
    },
    clearInput: function(){
        $(this.elems.urlAddInput).val("");
    }
};

function urlAddCallback(data) {
    // Add to current playlist
    if (data != null) {
        var playlist = playlistManager.getCurrentPlaylist();
        data.title = titleEscape(data.title);
        var success = playlist.add(new Music(data), true);
        if (success) {
            playlistManager.getCurrentPlaylist().sync();
        }
        NotifyManager.playlistChangeNotify(success);

        UrlAdder.adding = false;
    } else {
        // Notify failure
        NotifyManager.invalidAdderUrl();
    }
    UrlAdder.showAll();
    UrlAdder.clearInput();
}

function keyFromUri() {
    var uri = location.search;
    var sap = '?playlist=';
    if (uri.indexOf(sap) != -1) {
        return uri.slice(sap.length);
    }
    return false;
}
