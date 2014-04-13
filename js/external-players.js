/* External player declarations */

function BaseExternalPlayer() {
    var self = this;
    self.type = undefined;
    self.initialized = false;

    self.init = function(callback) {
        throw 'NotImplementedError';
    };

    self.hide = function() {
        throw 'NotImplementedError';
    };

    self.show = function() {
        throw 'NotImplementedError';
    };

    self.play = function(music) {
        throw 'NotImplementedError';
    };

    self.stop = function() {
        throw 'NotImplementedError';
    };

    self.pause = function() {
        throw 'NotImplementedError';
    };

    self.seekTo = function(time) {
        throw 'NotImplementedError';
    };

    self.getCurrentPlaybackTime = function() {
        throw 'NotImplementedError';
    };

    self.getTotalPlaybackTime = function() {
        throw 'NotImplementedError';
    };

    self.getBuffer = function(fraction) {
        var buffer = 0;
        if (fraction) {
            buffer = fraction * 100;
            buffer = buffer > 100 ? 100 : buffer;
            buffer = buffer < 0 ? 0 : buffer;
        }
        return buffer;
    };

    // State change listeners
    self.onLoading = function() {
        unboldPlaylistTitle();
        PlayerMessageControl.setLoading();
    };

    self.onFinish = function() {
        unboldPlaylistTitle();
        playerManager.onMusicEnd();
        // XXX: Music end should be watched global observer (not here.)
        var music = null;
        if (RepeatControl.state == RepeatState.noRepeat) {
            if (ShuffleControl.isShuffle()) {
                ShuffleControl.shuffle(musicQ.q);
            }
            music = musicQ.pop();
            if (music == queueEOL) {
                return;
            }
        } else if (RepeatControl.state == RepeatState.repeatPlaylist) {
            if (ShuffleControl.isShuffle()) {
                ShuffleControl.shuffle(musicQ.q);
            }

            music = musicQ.pop();
            if (music == queueEOL) {
                return;
            }
            if (music == null) {
                var playlist =
                    playlistManager.getLocalPlaylist(
                        playlistManager.playingLocalSeq);
                if (ShuffleControl.isShuffle()) {
                    musicQ.init(ShuffleControl.shuffle(playlist.raw()));
                } else {
                    musicQ.init(playlist.raw());
                }
                music = musicQ.pop();
            }
        } else if (RepeatControl.state == RepeatState.repeatOne) {
            music = playerManager.getCurrentMusic();
        }

        if (music != null) {
            playerManager.onPlayMusic(music);
        }
    };

    self.onPlaying = function() {
        var title = playerManager.currentMusic.title;
        if(playlistManager.playingLocalSeq == playlistManager.getCurrentPlaylistIdx())
            boldPlaylistTitle(title);
        PlayerMessageControl.setTitle(title);
    };
}

function YoutubePlayer() {
    var self = this;
    this.prototype = new BaseExternalPlayer();
    self.player = null;
    self.view = null;
    self.type = 'youtube';
    self.playerWidth = $('#external-player').width();
    self.playerHeight = $('#external-player').height();
    self.playing = false;
    self.isSafariHack = false;
    self.safariHackDone = false;
    self.currentVideo = null;

    // Constructor
    self.init = function() {
        self.isSafariHack = isSafari();

        initWidth = self.playerWidth
        initHeight = self.playerHeight

        /*
        Fucking safari blocks flash plugin automatically after `mavericks`.
        (Because of fucking low energy policy)
        There may be two hacks for this problem.
        1. Emulate automatic mouse click to force use of flash plugin in safari
        No initialize time is needed in next run of dropbeat in this solution.
        2. When youtube frame size is large enough, youtube automatically
        acquires flash plugin permission from safari.
        Therefore, we make `500, 500` size frame to acquire flash plugin
        permission, and hide it to left by `-(widthSize - 1)`.
        If we fully hide youtube frame in this step, the whole youtube
        javascript api crashes and is not initialized. So we leave just 1px.
        */

        // We choose second magical hack to fucking safari workaround.
        if (self.isSafariHack) {
            initWidth = 500;
            initHeight = 500;
            var options = {'autoplay': 1, 'controls': 0};
        } else {
            var options = {'autoplay': 0, 'controls': 0};
            self.hide();
        }

        var videoId = 'sUGWyrx-gCc';
        self.player = new YT.Player('youtube-player', {
                width: initWidth,
                height: initHeight,
                videoId: videoId,
                enablejsapi: 1,
                modestbranding: 1,
                playerVars: options,
                events: {
                    'onReady' : function(data) {
                        self.initialized = true;
                        self.view = $('#youtube-player');
                        data.target.addEventListener(
                            'onStateChange', self.onStateChange);
                    }
                }
            }
        );
    };

    self.hide = function() {
        $('#dropbeat .external-player-section').css('left', '-539px');
    };

    self.show = function() {
        $('#dropbeat .external-player-section').css('left', '0px');
    };

    self.onStateChange = function(state) {
        if (state == null) {
            return;
        }
        switch (state.data) {
            case YT.PlayerState.ENDED:
                self.prototype.onFinish();
                break;
            case YT.PlayerState.PLAYING:
                if (self.isSafariHack) {
                    self.stop();
                    self.isSafariHack = false;
                    self.view.height(self.playerHeight);
                    self.view.width(self.playerWidth);
                    self.hide();
                } else {
                    self.prototype.onPlaying();
                }
                break;
            case YT.PlayerState.PAUSED:
                break;
            case YT.PlayerState.BUFFERING:
                break;
            case YT.PlayerState.CUED:
                break;
            case YT.PlayerState.UNSTARTED:
                if (self.currentVideo != null) {
                    self.prototype.onLoading();
                }
                break;
            default:
                break;
        }
    };

    self.play = function(video) {
        var quality = 'hd720';
        if (video) {
            self.currentVideo = video;
            self.player.loadVideoById(video.id, 0, quality);
        } else {
            self.player.playVideo();
        }
    };

    self.stop = function() {
        if (self.player) {
            self.player.stopVideo();
            self.currentVideo = null;
        }
    };

    self.pause = function() {
        if (self.player) {
            self.player.pauseVideo();
        }
    }
    self.seekTo = function(time) {
        if (self.currentVideo) {
            self.player.seekTo(time, true);
        }
    };

    /* Returns the current playback position in seconds */
    self.getCurrentPlaybackTime = function() {
        if (self.currentVideo) {
            return self.player.getCurrentTime();
        }
        return 0;
    };

    /* Returns the length of the video in seconds */
    self.getTotalPlaybackTime = function() {
        if (self.currentVideo) {
            return self.player.getDuration();
        }
        return 0;
    };

    self.getBuffer = function() {
        if (self.player) {
            return self.prototype.getBuffer(
                self.player.getVideoLoadedFraction());
        } else {
            return 0;
        }
    };
}

function SoundCloudPlayer() {
    var self = this;
    this.prototype = new BaseExternalPlayer();
    self.streamApiBase = 'https://api.soundcloud.com/tracks/';
    self.developerKey = 'd5249ae899d7b26e6c6af608d876d12c';
    self.currentMusic = null;
    self.validationTimer = null;
    self.titleHack = false;
    self.type = 'soundcloud';

    self.playing = false;

    self.init = function(callback) {
        self.initialized = true;

        soundManager.onready(function() {
            soundManagerReady = true;
            if (callback) {
                setTimeout(function() {
                    callback();
                }, 1000);
            }
        });
    };

    self.hide = function() {
        $('soundcloud-player').css('left', '-10000px');
    };

    self.show = function() {
        $('soundcloud-player').css('left', '0px');
    };

    self.play = function(music) {
        if (music) {
            self.titleHack = true;
            clearTimeout(self.validationTimer);
            // This `playing` variable is only used to
            self.playing = false;
            var streamUrl = self.streamApiBase + music.id +
                    '/stream?consumer_key=' + self.developerKey;
            soundManager.createSound({
                id: music.id,
                url: streamUrl,
                volume: 100,
                onload: self.onStateChange,
                onplay: self.onStateChange,
                onfinish: self.prototype.onFinish
            });
            soundManager.play(music.id);
            self.currentMusic = music;
        } else {
            soundManager.play(self.currentMusic.id);
        }
    };

    self.stop = function() {
        soundManager.stopAll();
        if (self.currentMusic) {
            soundManager.destroySound(self.currentMusic.id);
        }
        self.currentMusic = null;
    };

    self.pause = function() {
        if (self.currentMusic) {
            soundManager.pause(self.currentMusic.id);
        }
    };

    self.seekTo = function(time) {
        if (self.currentMusic) {
            soundManager.setPosition(self.currentMusic.id, time*1000);
        }
    };

    self.getCurrentPlaybackTime = function() {
        var time = 0;
        if (self.currentMusic) {
            var sound = soundManager.getSoundById(self.currentMusic.id);
            if (sound) {
                time = sound.position / 1000.0;
            }
        }

        if (self.titleHack && time > 0) {
            if(playlistManager.playingLocalSeq
                == playlistManager.getCurrentPlaylistIdx())
                boldPlaylistTitle(self.currentMusic.title);
            PlayerMessageControl.setTitle(self.currentMusic.title);
            self.titleHack = false;
        }
        return time;
    };

    self.getTotalPlaybackTime = function() {
        var time = 0;
        if (self.currentMusic) {
            var sound = soundManager.getSoundById(self.currentMusic.id);
            if (sound) {
                time = sound.durationEstimate / 1000.0;
            }
        }
        return time;
    };

    self.getBuffer = function() {
        if (self.currentMusic == null)
            return 0;

        var sound = soundManager.getSoundById(self.currentMusic.id);

        if (sound) {
            return self.prototype.getBuffer(
                sound.bytesLoaded / sound.bytesTotal);
        } else {
            return 0;
        }
    };

    self.onStateChange = function(success) {
        if (success != null && !success) {
            var current = playerManager.getCurrentMusic()
            if (current != null && current.type == 'youtube') {
                return;
            }

            NotifyManager.notPlayable(current.title);
            if (playerManager.forth() == -1) {
                var playlist = playlistManager.getCurrentPlaylist();
                if (playlist.empty()) {
                    return;
                }
                var onPlaylist = false;
                for (var i=0; i<playlist.length(); i++) {
                    if (playlist.raw()[i].id == current.id) {
                        onPlaylist = true;
                    }
                }
                if (onPlaylist && playlist.raw()[0].id != current.id) {
                    playerManager.onMusicClicked(playlist.raw()[0], true);
                }
            }

        }
        if (!self.playing) {
            self.prototype.onLoading();
            self.playing = true;
        } else {
            self.prototype.onPlaying();
        }
    };
}
