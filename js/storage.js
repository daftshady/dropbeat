/* This variable wraps `localStorage` in HTML5 */
var LocalStorage = {
    playlistKey: 'playlist',
    visitedKey: 'first',
    migratedKey: 'migrated',

    getPlaylist: function(idx, old) {
        // XXX: This method do not follow strong OOP.
        idx = !idx ? 0 : idx;
        raw = localStorage.getItem(LocalStorage.localPlaylistKey(idx));
        // TODO: We don't need to migrate after first migration.
        if (old) {
            raw = localStorage.getItem(LocalStorage.playlistKey);
        }
        if (raw) {
            playlist = new Playlist();
            raw = JSON.parse(raw);
            for (var i=0; i<raw.length; i++) {
                m = new Music(raw[i]);
                playlist.add(m);
            }
            return playlist;
        } else {
            playlist = new Playlist();
            return playlist;
        }
    },

    setPlaylist: function(playlist, idx) {
        localStorage.setItem(
            LocalStorage.localPlaylistKey(idx), playlist);
    },

    localPlaylistKey: function(idx) {
        var key = LocalStorage.playlistKey;
        if (idx) {
            key = key + idx;
        }
        return key;
    },

    flushPlaylist: function(idx) {
        localStorage.setItem(LocalStorage.localPlaylistKey(idx), '[]');
    },

    getVisited: function() {
        return localStorage.getItem(LocalStorage.visitedKey);
    },

    setVisited: function() {
        localStorage.setItem(LocalStorage.visitedKey, true);
    },

    getMigrated: function() {
        return localStorage.getItem(LocalStorage.migratedKey);
    },

    setMigrated: function() {
        localStorage.setItem(LocalStorage.migratedKey, true);
    }
};
