var NotifyManager = {
    init: function() {},

    playlistChangeNotify: function(success) {
        if (success) {
            $.notify(
                getMsg('added'),
                {
                    position: 'top right',
                    className: 'success',
                    autoHide: 'true'
                }
            );
        } else {
            $.notify(
                getMsg('alreadyOnPlaylist'),
                {
                    position: 'top right',
                    className: 'warn',
                    autoHide: 'true'
                }
            );
        }
    },

    sharePlaylist: function(success, uuid) {
        var msg = success ? getMsg('shared') + uuid : getMsg('cannotShare');
        var style = success ? 'success' : 'warn';
        $('.playlist-section .playlist-footer').notify(
            msg,
            {
                position: 'top left',
                className: style,
                autoHide: true,
                autoHideDelay: 10000,
                clickToHide: false
            }
        );
    },

    playlistLoaded: function() {
        if (!notifyReady) {
            delayNotify(NotifyManager.playlistLoaded);
            return;
        }
        $.notify(
            getMsg('loaded'),
            {
                position: 'top right',
                className: 'success',
                autoHide: true
            }
        );
    },

    playlistCleared: function() {
        $('.clear-playlist-button').notify(
            getMsg('cleared'),
            {
                position: 'top right',
                className: 'success',
                autoHide: true
            }
        );
    },

    invalidPlaylistKey: function() {
        $.notify(
            getMsg('invalidKey'),
            {
                position: 'top right',
                className: 'error',
                autoHide: true
            }
        );
    },

    invalidAdderUrl: function() {
        $('#add-by-url-input').notify(
            getMsg('invalidUrl'),
            {
                position: 'bottom left',
                className: 'error',
                autoHide: true
            }
        );
    },

    inSharedPlaylist: function() {
        // XXX: Temporal way to delay msg.
        // Should fix the way to handle delaying.
        if (!notifyReady) {
            delayNotify(NotifyManager.inSharedPlaylist);
            return;
        }

        $.notify(
            getMsg('inSharedPlaylist'),
            {
                position: 'bottom left',
                className: 'success',
                clickToHide: true,
                autoHide: false
            }
        );
    },

    notPlayable: function(title) {
        $.notify(
            getMsg('notPlayable') + title.slice(0, 40) + '...',
            {
                position: 'top right',
                className: 'error',
                clickToHide: true,
                autoHide: true,
                autoHideDelay: 10000
            }
        );
    }
};

function delayNotify(method) {
    setTimeout(function() {
        method();
    }, 1000);
    return;
}

function onNotifyReady() {
    notifyReady = true;
};
