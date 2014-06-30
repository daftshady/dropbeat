function PlayerManager() {
    var that = this;
    function Players() {
        var that = this;
        var _players = {};
        that.pop = function(k) {
            v = _players[k];
            delete _players[k];
            return v;
        };
        that.get = function(k) {
            return _players[k];
        };
        that.set = function(k, v) {
            _players[k] = v;
        };

    };
    that.players = new Players();
    that.isPlaying = false;
    that.currentPlayer = null;
    that.currentMusic = null;
    that.currentMusicLength = 0;
    that.moving = false;
    that.elems = {
        loadingFilter:".play-controls .player-initialize-filter"
    }

    that.init = function() {
        if ($(that.elems.loadingFilter).is(":hidden")) {
            $(that.elems.loadingFilter).show();
        }
        // Push all available players to `players`.
        // XXX: Should get player type from each player object.
        if (!youtubeApiReady) {
            setTimeout(function() {
                that.init();
            }, 1000);
            return;
        }
        var youtubePlayer = new YoutubePlayer();
        var soundcloudPlayer = new SoundCloudPlayer();
        youtubePlayer.init();
        soundcloudPlayer.init();
        that.players.set('youtube', youtubePlayer);
        that.players.set('soundcloud', soundcloudPlayer);

        if (isSafari()) {
            setTimeout(function() {
                $(that.elems.loadingFilter).hide();
                dropbeatReady = true;
            }, 5000);
            return;
        }

        setTimeout(function() {
            dropbeatReady = true;
            $(that.elems.loadingFilter).hide();
        }, 1000);
    };

    that.play = function(music) {
        if (!music) {
            if (that.currentPlayer) {
                that.currentPlayer.play(music);
            } else {
                // raise error
            }
        } else {
            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat === "object" && dropbeat.logApiAction) {
                dropbeat.logApiAction("dropbeat", "player/play",
                    {title:music.title, id:music.id, type:music.type});
            }

            if (that.currentPlayer && !that.isPlaying) {
                if (that.currentPlayer.type !== music.type) {
                    that.currentPlayer = that.players.get(music.type);
                }
                if (that.isSameMusic(music)) {
                    that.currentPlayer.play();
                    return;
                } else {
                    that.currentPlayer.stop();
                }
                PlayerButtonViewControl.setPause();
                that.currentMusic = music;
                Progress.reset();
                that.currentPlayer.play(music);
                return;
            }

            that.currentPlayer = that.players.get(music.type);
            if (!that.currentPlayer) {
                // raise for Unsupported player
                return;
            }

            // Let's play new music.
            PlayerButtonViewControl.setPause();
            that.currentMusic = music;
            Progress.reset();
            if (!that.currentPlayer.initialized) {
                that.currentPlayer.init(
                    function() {
                        that.play(music);
                    }
                    );
                return;
            } else {
                that.currentPlayer.play(music);
            }
        }
    };

    that.pause = function() {
        if (that.currentPlayer && that.isPlaying) {
            that.currentPlayer.pause();
        }
    };

    // Method for `play button` on the control panel.
    that.onPlayMusic = function(music) {
        if (that.currentPlayer && that.isPlaying) {
            // Pause the music.
            that.pause();
            Progress.stop();
            that.isPlaying = false;
            return;
        }

        if (!that.isPlaying) {
            if (!music) {
                if (!that.currentMusic) {
                    return;
                }
                music = that.currentMusic;
            }
            that.play(music);
            Progress.start();
            that.isPlaying = true;
            return;
        }
    };

    // Method for `music` row on the playlist.
    that.onMusicClicked = function(music, onPlaylist) {
        // For safari hack. (Do not play music before init!)
        if (!dropbeatReady) {
            return;
        }

        if (that.isSameMusic(music) && that.isPlaying) {
            return;
        }

        that.onPlayMusic(music);
        // In the case that another music is already playing.
        if (!that.isPlaying) {
            that.play(music);
            Progress.start();
            that.isPlaying = true;
        }

        // reorder queue
        if (onPlaylist) {
            var playlist;
            // For not updating playlistManager.playingLocalSeq
            // on Prev or Next click
            if (that.moving){
                playlist = playlistManager
                    .getLocalPlaylist(playlistManager.playingLocalSeq);
            } else{
                playlist = playlistManager.getCurrentPlaylist();
                playlistManager.playingLocalSeq = PlaylistTabs.currentIdx();
            }
            if (playlist) {
                if (ShuffleControl.isShuffle()) {
                    musicQ.init(
                        ShuffleControl.shuffle(playlist.raw()));
                } else {
                    musicQ.init(playlist.slicePlaylist(music.id));
                }
            }
        } else {
            musicQ.init();
            musicQ.pushEOL();
        }

        // Make prevNext clickable
        PlayerControl.updateButton(onPlaylist
                && RepeatControl.state !== RepeatState.repeatOne);
    };

    that.onMusicEnd = function() {
        that.isPlaying = false;
    };

    // XXX: Remove code duplication between `back` and `forth`.
    that.back = function() {
        return that.move(false);
    };

    that.forth = function() {
        return that.move(true);
    };

    that.move = function(forward) {
        var playlist =
            playlistManager.getLocalPlaylist(playlistManager.playingLocalSeq);
        if (playlist && that.currentMusic) {

            // XXX : If we handle shuffle on move btn clicked like this way,
            // random queue will be the size of current playlist
            // everytime we click move btn.
            // But it may not matter in current use-case.

            var current = playlist.findIdx(that.currentMusic.id);
            var next = null;
            if (current === -1) {
                return;
            }

            if (!ShuffleControl.isShuffle()) {
                var pos;
                if (forward) {
                    pos = current + 1 === playlist.length() ? current : current + 1;
                } else {
                    pos = current > 0 ? current - 1 : current;
                }

                if (current === pos) {
                    if (forward) {
                        if (RepeatControl.state === RepeatState.noRepeat
                            || playlist.length() === 0) {
                            return -1;
                        }
                        pos = 0;
                    } else {
                        return;
                    }
                }
                next = playlist.getWithIdx(pos);
            } else {
                next = getFakeNext(playlist, that.currentMusic.id);
            }
            that.moving = true;
            that.onMusicClicked(next, true);
            that.moving = false;
        } else {
            // Warn for null playlist
        }
    };

    that.getCurrentPlaybackTime = function() {
        if (that.currentPlayer && that.isPlaying) {
            return that.currentPlayer.getCurrentPlaybackTime();
        }
        return 0;
    };

    that.getTotalPlaybackTime = function() {
        if (that.currentPlayer && that.isPlaying) {
            return that.currentPlayer.getTotalPlaybackTime();
        }
        return 0;
    };

    that.getBuffer = function() {
        if (that.currentPlayer && that.isPlaying) {
            return that.currentPlayer.getBuffer();
        }
        return 0;
    };

    that.seekTo = function(pos) {
        if (that.currentPlayer) {
            that.currentPlayer.seekTo(pos);
        }
    };

    that.getCurrentMusic = function() {
        return that.currentMusic;
    };

    // Private methods
    that.isSameMusic = function(music) {
        return that.currentMusic && music.id === that.currentMusic.id;
    };
}

function getFakeNext(playlist, current) {
    var fakePlaylist = playlist.raw().slice(0);
    var next = null;
    ShuffleControl.shuffle(fakePlaylist);
    while (fakePlaylist.length > 0) {
        next = fakePlaylist.shift();
        if (next.id === current) {
            next = null;
        } else {
            break;
        }
    }
    next = !next ? current : next;
    return next;
}
