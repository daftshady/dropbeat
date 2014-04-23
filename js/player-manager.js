function PlayerManager() {
    var self = this;
    function Players() {
        var self = this;
        var _players = {};
        self.pop = function(k) {
            v = _players[k];
            delete _players[k];
            return v;
        };
        self.get = function(k) {
            return _players[k];
        };
        self.set = function(k, v) {
            _players[k] = v;
        };

    };
    self.players = new Players();
    self.isPlaying = false;
    self.currentPlayer = null;
    self.currentMusic = null;
    self.currentMusicLength = 0;
    self.moving = false;
    self.elems = {
        loadingFilter:".play-controls .player-initialize-filter"
    }

    self.init = function() {
        if ($(self.elems.loadingFilter).is(":hidden")) {
            $(self.elems.loadingFilter).show();
        }
        // Push all available players to `players`.
        // XXX: Should get player type from each player object.
        if (!youtubeApiReady) {
            setTimeout(function() {
                self.init();
            }, 1000);
            return;
        }
        var youtubePlayer = new YoutubePlayer();
        var soundcloudPlayer = new SoundCloudPlayer();
        youtubePlayer.init();
        soundcloudPlayer.init();
        self.players.set('youtube', youtubePlayer);
        self.players.set('soundcloud', soundcloudPlayer);

        if (isSafari()) {
            setTimeout(function() {
                $(self.elems.loadingFilter).hide();
                dropbeatReady = true;
            }, 5000);
            return;
        }

        setTimeout(function() {
            dropbeatReady = true;
            $(self.elems.loadingFilter).hide();
        }, 1000);
    };

    self.play = function(music) {
        if (!music) {
            if (self.currentPlayer) {
                self.currentPlayer.play(music);
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

            if (self.currentPlayer && !self.isPlaying) {
                if (self.currentPlayer.type !== music.type) {
                    self.currentPlayer = self.players.get(music.type);
                }
                if (self.isSameMusic(music)) {
                    self.currentPlayer.play();
                    return;
                } else {
                    self.currentPlayer.stop();
                }
                PlayerButtonViewControl.setPause();
                self.currentMusic = music;
                Progress.reset();
                self.currentPlayer.play(music);
                return;
            }

            self.currentPlayer = self.players.get(music.type);
            if (!self.currentPlayer) {
                // raise for Unsupported player
                return;
            }

            // Let's play new music.
            PlayerButtonViewControl.setPause();
            self.currentMusic = music;
            Progress.reset();
            if (!self.currentPlayer.initialized) {
                self.currentPlayer.init(
                    function() {
                        self.play(music);
                    }
                    );
                return;
            } else {
                self.currentPlayer.play(music);
            }
        }
    };

    self.pause = function() {
        if (self.currentPlayer && self.isPlaying) {
            self.currentPlayer.pause();
        }
    };

    // Method for `play button` on the control panel.
    self.onPlayMusic = function(music) {
        if (self.currentPlayer && self.isPlaying) {
            // Pause the music.
            self.pause();
            Progress.stop();
            self.isPlaying = false;
            return;
        }

        if (!self.isPlaying) {
            if (!music) {
                if (!self.currentMusic) {
                    return;
                }
                music = self.currentMusic;
            }
            self.play(music);
            Progress.start();
            self.isPlaying = true;
            return;
        }
    };

    // Method for `music` row on the playlist.
    self.onMusicClicked = function(music, onPlaylist) {
        // For safari hack. (Do not play music before init!)
        if (!dropbeatReady) {
            return;
        }

        if (self.isSameMusic(music) && self.isPlaying) {
            return;
        }

        self.onPlayMusic(music);
        // In the case that another music is already playing.
        if (!self.isPlaying) {
            self.play(music);
            Progress.start();
            self.isPlaying = true;
        }

        // reorder queue
        if (onPlaylist) {
            var playlist;
            // For not updating playlistManager.playingLocalSeq
            // on Prev or Next click
            if (self.moving){
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

    self.onMusicEnd = function() {
        self.isPlaying = false;
    };

    // XXX: Remove code duplication between `back` and `forth`.
    self.back = function() {
        return self.move(false);
    };

    self.forth = function() {
        return self.move(true);
    };

    self.move = function(forward) {
        var playlist =
            playlistManager.getLocalPlaylist(playlistManager.playingLocalSeq);
        if (playlist && self.currentMusic) {
            /*
            XXX : If we handle shuffle on move btn clicked like this way,
            random queue will be the size of current playlist
            everytime we click move btn.
            But it may not matter in current use-case.
            */
            var current = playlist.findIdx(self.currentMusic.id);
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
                next = getFakeNext(playlist, self.currentMusic.id);
            }
            self.moving = true;
            self.onMusicClicked(next, true);
            self.moving = false;
        } else {
            // Warn for null playlist
        }
    };

    self.getCurrentPlaybackTime = function() {
        if (self.currentPlayer && self.isPlaying) {
            return self.currentPlayer.getCurrentPlaybackTime();
        }
        return 0;
    };

    self.getTotalPlaybackTime = function() {
        if (self.currentPlayer && self.isPlaying) {
            return self.currentPlayer.getTotalPlaybackTime();
        }
        return 0;
    };

    self.getBuffer = function() {
        if (self.currentPlayer && self.isPlaying) {
            return self.currentPlayer.getBuffer();
        }
        return 0;
    };

    self.seekTo = function(pos) {
        if (self.currentPlayer) {
            self.currentPlayer.seekTo(pos);
        }
    };

    self.getCurrentMusic = function() {
        return self.currentMusic;
    };

    // Private methods
    self.isSameMusic = function(music) {
        return self.currentMusic && music.id === self.currentMusic.id;
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
