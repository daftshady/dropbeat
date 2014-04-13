/* This variable wraps `localStorage` in HTML5 */
var LocalStorage = {
    localHashKey: 'key',
    playlistKey: 'playlist',
    visitedKey: 'first',
    migratedKey: 'migrated',

    getPlaylist: function(idx, old) {
        // XXX: This method do not follow strong OOP.
        idx = idx == null ? 0 : idx;
        raw = localStorage.getItem(LocalStorage.localPlaylistKey(idx));
        // TODO: We don't need to migrate after first migration.
        if (old) {
            raw = localStorage.getItem(LocalStorage.playlistKey);
        }
        if (raw != null) {
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
        if (idx != null) {
            key = key + idx;
        }
        return key;
    },

    flushPlaylist: function(idx) {
        localStorage.setItem(LocalStorage.localPlaylistKey(idx), '[]');
    },

    initLocalHash: function() {
        return generateKey();
    },

    getLocalHash: function(existings) {
        hash = localStorage.getItem(LocalStorage.localHashKey);
        if (hash != null) {
            return hash;
        }

        if (existings) {
            while(true) {
                hash = LocalStorage.initLocalHash();
                if (jQuery.inArray(hash, existings) == -1) {
                    LocalStorage.setLocalHash(hash);
                    break;
                }
            }
        } else {
            hash = LocalStorage.initLocalHash();
            LocalStorage.setLocalHash(hash);
        }
        return hash;
    },

    hasLocalHash: function() {
        return localStorage.getItem(LocalStorage.localHashKey) != null;
    },

    setLocalHash: function(hash) {
        localStorage.setItem(LocalStorage.localHashKey, hash);
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
