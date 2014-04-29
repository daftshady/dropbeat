var PlaylistTabs = {
    elems: {
        playlists:'#playlists',
    },
    init: function() {
        var lists = $(PlaylistTabs.elems.playlists).children();

        if (onSharedList) {
            // We don't need to make tabs clickable.
            $.each(lists, function(idx) {
                if (idx !== 0) {
                    $(this).remove();
                }
            });
            return;
        }

        $.each(lists, function(idx) {
            $(this).click(function() {
                playlistManager.getCurrentPlaylist().sync();

                var highlight = 'playlist-tab-on';
                lists.removeClass(highlight);
                $(this).addClass(highlight);
                playlistManager.loadLocal(idx);
            });
        });
    },
    currentIdx: function() {
        var playlistIdx;
        $.each($(PlaylistTabs.elems.playlists).children(), function(idx) {
            if ($(this).hasClass('playlist-tab-on')) {
                playlistIdx = idx;
            }
        });
        return playlistIdx;
    }
};

var PlaylistControl = {
    elems: {
        sharePlaylistBtn:".playlist-section .share-playlist-button",
        clearPlaylistBtn:".playlist-section .clear-playlist-button",
        playlistFilterInput:".playlist-section #search-playlist-input"
    },
    init: function() {
        if (onSharedList) {
            $(PlaylistControl.elems.sharePlaylistBtn).remove();
        }

        $(this.elems.sharePlaylistBtn).click(function() {
            var playlist = playlistManager.getCurrentPlaylist();
            if (playlist.empty()) {
                NotifyManager.sharePlaylist(false);
                return;
            }

            // There's a possible collision, but it doesn't matter.
            var uuid = Math.uuid(8);
            $.ajax({
                type: "POST",
                url: API_PLAYLIST_URL,
                data: {
                    'key' : uuid,
                    'playlist' : playlist.toJsonStr(true)
                },
                crossDomain: true
            });

            NotifyManager.sharePlaylist(true, fullHost + '/?playlist=' + uuid);

            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat === "object" && dropbeat.logApiAction) {
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
                typeof window.dropbeat === "object" && dropbeat.logApiAction) {
                dropbeat.logApiAction("dropbeat", "playlist-manage/clear");
            }
        });

        $(this.elems.playlistFilterInput).
            bind("propertychange keyup input paste", function(event) {
            clearTimeout(PlaylistControl.filterTimer);
            var that = $(this);
            PlaylistControl.filterTimer = setTimeout(function () {
                PlaylistControl.filter(that.val().toLowerCase());
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
                if (m.title.toLowerCase().indexOf(keyword) !== -1) {
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
        // `playlistCallback` is executed later.
        $.ajax({
            url: API_PLAYLIST_URL,
            data: {'key': key, 'type': 'jsonp'},
            dataType: 'jsonp'
        });

        // Logging
        if (window.dropbeat &&
            typeof window.dropbeat === "object" && dropbeat.logApiAction) {
            dropbeat.logApiAction("dropbeat", "playlist-manage/load");
        }
    },
    generate: function(key, id) {
        if (!id) {
            id = Math.floor((1 + Math.random()) * 0x10000).
                toString(16).substring(1);
            playlistManager.add(
                playlistManager.shareKey, new Playlist());
        }

        // Will call `relayPoll`
        $.ajax({
            url: API_PLAYLIST_AUTOGEN,
            data: decodeURIComponent(
                $.param({
                    'key': key,
                    'id': id,
                    'type': 'jsonp'
                })),
            dataType: 'jsonp',
            timeout: 15000
        });
    }
};

function relayPoll(data) {
    if (data) {
        data = data[0];
        playlistManager.getCurrentPlaylist().add(new Music(data), true);
        if (data.remains > 0) {
            PlaylistControl.generate(data.key, data.poll_id);
        }
    }
}

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
        alert('Invalid access');
        location.href = fullHost;
    }
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
            if (!url ||
                (url.indexOf('youtube.com') === -1
                    && url.indexOf('youtu.be') === -1
                    && url.indexOf('soundcloud.com') === -1)) {
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
                data: {'url': url, 'type': 'jsonp'},
            });
        }

        // Logging
        if (window.dropbeat &&
            typeof window.dropbeat === "object" && dropbeat.logApiAction) {
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
    if (data) {
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
