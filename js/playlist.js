function Playlist() {
    var self = this;
    // Change in local playlist should be pushed into server.
    self.playlist = [];
    self.renderPlaylistRow = function(music, idx){
        if (!music.id)
            return "";
        if (!self.rowTemplate)
            self.rowTemplate =
                _.template($(playlistManager.elems.playlistRowTemplate).html());
        return self.rowTemplate({music:music, idx:idx});
    };
    self.init = function(params) {
        // `params` should be Array of music.
        if (params instanceof Array) {
            self.playlist = self.playlist.concat(params);
        }
    };

    self.getWithIdx = function(idx) {
        if (idx < self.playlist.length) {
            return self.playlist[idx];
        }
    };

    self.add = function(music, updateView) {
        var idx = self.findIdx(music.id);
        if (idx !== -1) {
            // Already exists
            return false;
        }
        self.playlist.push(music);
        if (updateView) {
            self.toTable(true);
        }

        if (playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {
            musicQ.push(music);
        }
        return true;
    };

    self.remove = function(music, updateView) {
        var idx = self.findIdx(music.id);
        if (idx > -1) {
            self.playlist.splice(idx, 1);
        }
        if (updateView) {
            self.toTable(true);
        }

        if (playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {

            musicQ.removeWithId(music.id);
        }

    };

    self.slicePlaylist = function(musicId) {
        // find idx
        var idx = self.findIdx(musicId);
        return self.playlist.slice(idx+1);
    };

    self.findIdx = function(musicId) {
        var idx = -1;
        for (var i=0; i<self.playlist.length; i++) {
            if (self.playlist[i].id === musicId) {
                idx = i;
            }
        }
        return idx;
    };

    self.sync = function() {
        // We don't sync if we are on shared Playlist!
        if (onSharedList) {
            return;
        }
        self.localSync();
    };

    self.localSync = function() {
        // Sync all local playlists.
        var idx = PlaylistTabs.currentIdx();
        LocalStorage.setPlaylist(JSON.stringify(self.playlist), idx);
    };

    // Sync this playlist with server.
    self.remoteSync = function() {
    };

    self.toTable = function(clean) {
        // Convertes `Playlist` to Table in HTML.
        // var table = document.creatElement('table'); doesn't work.

        var playlistView = $(playlistManager.elems.playlistInner);

        if (clean) {
            var playlistRow =
                $(playlistManager.elems.playlistMusicContainer, playlistView);
            playlistRow.remove();
        }
        for (var i=0; i<self.playlist.length; i++) {
            playlistView.append(self.renderPlaylistRow(self.playlist[i], i+1));
        }
        ViewControl.resizePlaylistRow();
        $(playlistManager.elems.playlistMusicCount).text(self.playlist.length);

        // Is bold needed for filter?

        // Re-bold current music if playing.
        if (playerManager.currentMusic
            && playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {
            var title = playerManager.currentMusic.title;
            boldPlaylistTitle(title);
        }
    };

    self.raw = function() {
        return self.playlist;
    };

    self.toJsonStr = function(reverse_quote) {
        for (var i=0; i<self.playlist.length; i++) {
            m = self.playlist[i];
            if (reverse_quote) {
                m.title = m.title.replace(/'/g, "`");
                m.title = m.title.replace(/"/g, "`");
            } else {
                m.title = m.title.replace(/`/g, "'");
            }
        }
        raw = JSON.stringify(self.playlist);
        return raw;
    };

    self.clear = function(updateView) {
        self.playlist = []
        if (updateView) {
            self.toTable(true);
        }
    };

    self.length = function() {
        return self.playlist.length;
    };

    self.empty = function() {
        return self.length() === 0;
    };
}

function boldPlaylistTitle (title) {
    // XXX: Should bold with `id` (not `title`) later.
    var $rows = $('.playlist-section .playlist .a-playlist-music');
    $.each($rows, function(idx) {
        if ($(".music-title", $(this)).text() === title) {
            $(this).addClass("on");
        }
    });
}

function unboldPlaylistTitle() {
    var $rows = $('.playlist-section .playlist .a-playlist-music');
    $rows.removeClass("on");
}

function initialPlaylistToNewComer() {
    // Returns initial playlist containing 5 tracks.
    // XXX: Why initial playlist is in js? Should move them to our database.

    var initial = [];
    m = new Music(
        {
            'id':'rLMas3USFbA',
            'title':'Bassjackers - Mush Mush (Original Mix)',
            'type':'youtube'
        }
    );
    initial.push(m);
    m = new Music(
        {
            'id':'id5NQwWX5zM',
            'title':'Dominik Eulberg - Opel Tantra (Original Mix)',
            'type':'youtube'
        }
    );
    initial.push(m);

    m = new Music(
        {
            'id':'82523324',
            'title':'Alesso Vs OneRepublic - If I Lose Myself (Alesso Remix)',
            'type':'soundcloud'
        }
    );
    initial.push(m);

    m = new Music(
        {
            'id':'5RcSht6kiQw',
            'title':'Julian Jeweil - Techno Corner (Original Mix)',
            'type':'youtube'
        }
    );
    initial.push(m);

    m = new Music(
        {
            'id':'uaY81jB93S8',
            'title':'Nicky Romero, Sunnery James & Ryan Marciano' +
            '- Jack To The Sound Of The Underground (Original Mix)',
            'type':'youtube'
        }
    );
    initial.push(m);

    m = new Music(
        {
            'id':'V9BJSixyqcQ',
            'title':'Julian Calor - Storm [OUT NOW!]',
            'type':'youtube'
        }
    );
    initial.push(m);

    var initialPlaylist = new Playlist();
    initialPlaylist.init(initial);
    initialPlaylist.sync();
}
