/*jslint browser: true*/
/*global $*/
var DROPBEAT = (function (module) {
    'use strict';

    var youtubeType = 'youtube',
        soundcloudType = 'soundcloud';

    function PlayerManager() {
        var that = this;

        that.players = {
            objs: {},
            get: function (k) {
                var that = this;

                return that.objs[k];
            },
            set: function (k, v) {
                var that = this;

                that.objs[k] = v;
            },
            pop: function (k) {
                var that = this,
                    v = that.objs[k];

                delete that.objs[k];
                return v;
            }
        };

        that.playing = false;
        that.moving = false;
        that.currentPlayer = null;
        that.currentMusic = null;
        that.currentMusicLength = 0;

        that.elems = {
            loadingFilter: ".play-controls .player-initialize-filter"
        };

        that.init = function () {
            var youtubePlayer,
                soundcloudPlayer,
                buttonControl;

            if ($(that.elems.loadingFilter).is(":hidden")) {
                $(that.elems.loadingFilter).show();
            }

            if (!module.state.youtubeApiReady) {
                setTimeout(function () {
                    that.init();
                }, 1000);
                return;
            }

            youtubePlayer = module.player.create(youtubeType);
            soundcloudPlayer = module.player.create(soundcloudType);
            youtubePlayer.init();
            soundcloudPlayer.init();
            that.players.set(youtubeType, youtubePlayer);
            that.players.set(soundcloudType, soundcloudPlayer);

            if (module.compatibility.isSafari) {
                setTimeout(function () {
                    $(that.elems.loadingFilter).hide();
                    module.state.dropbeatReady = true;
                }, 5000);
                return;
            }

            setTimeout(function () {
                module.state.dropbeatReady = true;
                $(that.elems.loadingFilter).hide();
            }, 1000);
        };

        that.play = function (music) {
            if (!music) {
                if (that.currentPlayer) {
                    that.currentPlayer.play(music);
                } else {
                    throw 'UndefinedError';
                }
            } else {
                module.log("dropbeat", "player/play",
                    {title: music.title, id: music.id, type: music.type});

                if (that.currentPlayer && !that.playing) {
                    if (that.currentPlayer.type !== music.type) {
                        that.currentPlayer = that.players.get(music.type);
                    }
                    if (that.isSameMusic(music)) {
                        that.currentPlayer.play();
                        return;
                    }

                    that.currentPlayer.stop();
                    module.s.playerButton.setPause();
                    that.currentMusic = music;
                    module.s.progress.reset();
                    that.currentPlayer.play(music);
                    return;
                }

                that.currentPlayer = that.players.get(music.type);
                if (!that.currentPlayer) {
                    // raise for Unsupported player
                    return;
                }

                // Let's play new music.
                module.s.playerButton.setPause();
                that.currentMusic = music;
                module.s.progress.reset();
                if (!that.currentPlayer.initialized) {
                    that.currentPlayer.init(function () {
                        that.play(music);
                    });
                } else {
                    that.currentPlayer.play(music);
                }
            }
        };

        that.pause = function () {
            if (that.currentPlayer && that.playing) {
                that.currentPlayer.pause();
            }
        };

        that.onPlayMusic = function (music) {
            if (that.currentPlayer && that.playing) {
// Pause the music here.
                that.pause();
                module.s.progress.stop();
                that.playing = false;
                return;
            }

            if (!that.playing) {
                if (!music) {
                    if (!that.currentMusic) {
                        return;
                    }
                    music = that.currentMusic;
                }
                that.play(music);
                module.s.progress.start();
                that.playing = true;
                return;
            }
        };

// Method for `music` row on the playlist.
        that.onMusicClicked = function (music, onPlaylist) {
// For safari hack. (Do not play music before init!)
            if (!module.state.dropbeatReady) {
                return;
            }

            if (that.isSameMusic(music) && that.playing) {
                return;
            }

            that.onPlayMusic(music);

// In the case that another music is already playing.
            if (!that.playing) {
                that.play(music);
                module.s.progress.start();
                that.playing = true;
            }

// Music queue should be ordered.
            if (onPlaylist) {
                var playlist;

// For not updating playlistManager.playingLocalSeq
// on Prev or Next click
                if (that.moving) {
                    playlist = module.playlistManager
                        .getLocalPlaylist(
                            module.playlistManager.playingLocalSeq
                        );
                } else {
                    playlist = module.playlistManager.getCurrentPlaylist();
                    module.playlistManager.playingLocalSeq =
                        module.s.playlistTabs.currentIdx();
                }
                if (playlist) {
                    if (module.s.shuffleControl.isShuffle()) {
                        module.s.musicQ.init(
                            module.s.shuffleControl.shuffle(
                                playlist.raw()
                            )
                        );
                    } else {
                        module.s.musicQ.init(
                            playlist.slicePlaylist(music.id)
                        );
                    }
                }
            } else {
                module.s.musicQ.init();
                module.s.musicQ.pushEOL();
            }

// Make prevNext clickable here again.
            module.s.playerBase.updateButton(onPlaylist
                    && module.s.repeatControl.state
                        !== module.s.repeatState.repeatOne);
        };

        that.onMusicEnd = function () {
            that.playing = false;
        };

        that.back = function () {
            return that.move(false);
        };

        that.forth = function () {
            return that.move(true);
        };

        that.move = function (forward) {
            var playlist =
                    module.playlistManager.getLocalPlaylist(
                        module.playlistManager.playingLocalSeq
                    ),
                current,
                next,
                pos;

            if (playlist && that.currentMusic) {

// XXX : If we handle shuffle on move btn clicked like this way,
// random queue will be the size of current playlist
// everytime we click move btn.
// But it may not matter in current use-case.

                current = playlist.findIdx(that.currentMusic.id);
                if (current === -1) {
                    return;
                }

                if (!module.s.shuffleControl.isShuffle()) {
                    if (forward) {
                        pos = current + 1 ===
                            playlist.length() ? current : current + 1;
                    } else {
                        pos = current > 0 ? current - 1 : current;
                    }

                    if (current === pos) {
                        if (forward) {
                            if (module.s.repeatControl.state
                                    === module.s.repeatState.noRepeat
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
                    next = that.getFakeNext(playlist, that.currentMusic.id);
                }
                that.moving = true;
                that.onMusicClicked(next, true);
                that.moving = false;
            } else {
                // Warn for null playlist
                throw "NullPlaylistError";
            }
        };

        that.getFakeNext = function (playlist, current) {
            var fakePlaylist = playlist.raw().slice(0),
                next = null;

            module.m.shuffeControl.shuffle(fakePlaylist);
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
        };

        that.getCurrentPlaybackTime = function () {
            if (that.currentPlayer && that.playing) {
                return that.currentPlayer.getCurrentPlaybackTime();
            }
            return 0;
        };

        that.getTotalPlaybackTime = function () {
            if (that.currentPlayer && that.playing) {
                return that.currentPlayer.getTotalPlaybackTime();
            }
            return 0;
        };

        that.getBuffer = function () {
            if (that.currentPlayer && that.playing) {
                return that.currentPlayer.getBuffer();
            }
            return 0;
        };

        that.seekTo = function (pos) {
            if (that.currentPlayer) {
                that.currentPlayer.seekTo(pos);
            }
        };

        that.getCurrentMusic = function () {
            return that.currentMusic;
        };

        // Private methods
        that.isSameMusic = function (music) {
            return that.currentMusic && music.id === that.currentMusic.id;
        };
    }

    module.playerManager = new PlayerManager();

    return module;
}(DROPBEAT));
