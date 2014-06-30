function Playlist() {
    var that = this;
    // Change in local playlist should be pushed into server.
    that.playlist = [];
    that.renderPlaylistRow = function(music, idx){
        if (!music.id)
            return "";
        if (!that.rowTemplate)
            that.rowTemplate =
                _.template($(playlistManager.elems.playlistRowTemplate).html());
        return that.rowTemplate({music:music, idx:idx});
    };
    that.init = function(params) {
        // `params` should be Array of music.
        if (params instanceof Array) {
            that.playlist = that.playlist.concat(params);
        }
    };

    that.getWithIdx = function(idx) {
        if (idx < that.playlist.length) {
            return that.playlist[idx];
        }
    };

    that.add = function(music, updateView) {
        var idx = that.findIdx(music.id);
        if (idx !== -1) {
            // Already exists
            return false;
        }
        that.playlist.push(music);
        if (updateView) {
            that.toTable(true);
            var elems = playlistManager.elems;
            $(elems.playlist).stop();
            $(elems.playlist).animate({
                scrollTop: 100 * that.length()
            }, '1000');
        }

        if (playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {
            musicQ.push(music);
        }
        return true;
    };

    that.remove = function(music, updateView) {
        var idx = that.findIdx(music.id);
        if (idx > -1) {
            that.playlist.splice(idx, 1);
        }
        if (updateView) {
            that.toTable(true);
        }

        if (playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {

            musicQ.removeWithId(music.id);
        }

    };

    that.slicePlaylist = function(musicId) {
        // find idx
        var idx = that.findIdx(musicId);
        return that.playlist.slice(idx+1);
    };

    that.findIdx = function(musicId) {
        var idx = -1;
        for (var i=0; i<that.playlist.length; i++) {
            if (that.playlist[i].id === musicId) {
                idx = i;
            }
        }
        return idx;
    };

    that.sync = function() {
        // We don't sync if we are on shared Playlist!
        if (onSharedList) {
            return;
        }
        that.localSync();
    };

    that.localSync = function() {
        // Sync all local playlists.
        var idx = PlaylistTabs.currentIdx();
        LocalStorage.setPlaylist(JSON.stringify(that.playlist), idx);
    };

    // Sync this playlist with server.
    that.remoteSync = function() {
    };

    that.toTable = function(clean) {
        // Convertes `Playlist` to Table in HTML.
        // var table = document.creatElement('table'); doesn't work.

        var playlistView = $(playlistManager.elems.playlistInner);

        if (clean) {
            var playlistRow =
                $(playlistManager.elems.playlistMusicContainer, playlistView);
            playlistRow.remove();
        }
        for (var i=0; i<that.playlist.length; i++) {
            playlistView.append(that.renderPlaylistRow(that.playlist[i], i+1));
        }
        ViewControl.resizePlaylistRow();
        $(playlistManager.elems.playlistMusicCount).text(that.playlist.length);

        // Re-bold current music if playing.
        if (playerManager.currentMusic
            && playlistManager.playingLocalSeq === PlaylistTabs.currentIdx()) {
            var title = playerManager.currentMusic.title;
            boldPlaylistTitle(title);
        }
    };

    that.raw = function() {
        return that.playlist;
    };

    that.toJsonStr = function(reverse_quote) {
        for (var i=0; i<that.playlist.length; i++) {
            m = that.playlist[i];
            if (reverse_quote) {
                m.title = m.title.replace(/'/g, "`");
                m.title = m.title.replace(/"/g, "`");
            } else {
                m.title = m.title.replace(/`/g, "'");
            }
        }
        raw = JSON.stringify(that.playlist);
        return raw;
    };

    that.clear = function(updateView) {
        that.playlist = []
        if (updateView) {
            that.toTable(true);
        }
    };

    that.length = function() {
        return that.playlist.length;
    };

    that.empty = function() {
        return that.length() === 0;
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
