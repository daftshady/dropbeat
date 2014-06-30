function BaseExternalPlayer() {
    var that = this;
    that.type = undefined;
    that.initialized = false;

    that.init = function(callback) {
        throw 'NotImplementedError';
    };

    that.hide = function() {
        throw 'NotImplementedError';
    };

    that.show = function() {
        throw 'NotImplementedError';
    };

    that.play = function(music) {
        throw 'NotImplementedError';
    };

    that.stop = function() {
        throw 'NotImplementedError';
    };

    that.pause = function() {
        throw 'NotImplementedError';
    };

    that.seekTo = function(time) {
        throw 'NotImplementedError';
    };

    that.getCurrentPlaybackTime = function() {
        throw 'NotImplementedError';
    };

    that.getTotalPlaybackTime = function() {
        throw 'NotImplementedError';
    };

    that.getBuffer = function(fraction) {
        var buffer = 0;
        if (fraction) {
            buffer = fraction * 100;
            buffer = buffer > 100 ? 100 : buffer;
            buffer = buffer < 0 ? 0 : buffer;
        }
        return buffer;
    };

    // State change listeners
    that.onLoading = function() {
        unboldPlaylistTitle();
        PlayerMessageControl.setLoading();
    };

    that.onFinish = function() {
        unboldPlaylistTitle();
        playerManager.onMusicEnd();
        // XXX: Music end should be watched global observer (not here.)
        var music = null;
        if (RepeatControl.state === RepeatState.noRepeat) {
            if (ShuffleControl.isShuffle()) {
                ShuffleControl.shuffle(musicQ.q);
            }
            music = musicQ.pop();
            if (music === queueEOL) {
                return;
            }
        } else if (RepeatControl.state === RepeatState.repeatPlaylist) {
            if (ShuffleControl.isShuffle()) {
                ShuffleControl.shuffle(musicQ.q);
            }

            music = musicQ.pop();
            if (music === queueEOL) {
                return;
            }
            if (!music) {
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
        } else if (RepeatControl.state === RepeatState.repeatOne) {
            music = playerManager.getCurrentMusic();
        }

        if (music) {
            playerManager.onPlayMusic(music);
        }
    };

    that.onPlaying = function() {
        var title = playerManager.currentMusic.title;
        if (playlistManager.playingLocalSeq === playlistManager.getCurrentPlaylistIdx())
            boldPlaylistTitle(title);
        PlayerMessageControl.setTitle(title);
    };
}

function YoutubePlayer() {
    var that = this;

    this.prototype = new BaseExternalPlayer();
    that.player = null;
    that.view = null;
    that.type = 'youtube';
    that.playerWidth = $('#external-player').width();
    that.playerHeight = $('#external-player').height();
    that.playing = false;
    that.isSafariHack = false;
    that.safariHackDone = false;
    that.currentVideo = null;

    that.init = function() {
        that.isSafariHack = isSafari();

        initWidth = that.playerWidth
        initHeight = that.playerHeight

        // Fucking safari blocks flash plugin automatically after `mavericks`.
        // (Because of fucking low energy policy)
        // There may be two hacks for this problem.
        // 1. Emulate automatic mouse click to force use of flash plugin in safari
        // No initialize time is needed in next run of dropbeat in this solution.
        // 2. When youtube frame size is large enough, youtube automatically
        // acquires flash plugin permission from safari.
        // Therefore, we make `500, 500` size frame to acquire flash plugin
        // permission, and hide it to left by `-(widthSize - 1)`.
        // If we fully hide youtube frame in this step, the whole youtube
        // javascript api crashes and is not initialized. So we leave just 1px.

        // We choose second magical hack to fucking safari workaround.
        if (that.isSafariHack) {
            initWidth = 500;
            initHeight = 500;
            var options = {'autoplay': 1, 'controls': 0};
        } else {
            var options = {'autoplay': 0, 'controls': 0};
            that.hide();
        }

        var videoId = 'sUGWyrx-gCc';
        that.player = new YT.Player('youtube-player', {
                width: initWidth,
                height: initHeight,
                videoId: videoId,
                enablejsapi: 1,
                modestbranding: 1,
                playerVars: options,
                events: {
                    'onReady' : function(data) {
                        that.initialized = true;
                        that.view = $('#youtube-player');
                        data.target.addEventListener(
                            'onStateChange', that.onStateChange);
                    }
                }
            }
        );
    };

    that.hide = function() {
        $('#dropbeat .external-player-section').css('left', '-539px');
    };

    that.show = function() {
        $('#dropbeat .external-player-section').css('left', '0px');
    };

    that.onStateChange = function(state) {
        if (!state) {
            return;
        }
        switch (state.data) {
            case YT.PlayerState.ENDED:
                that.prototype.onFinish();
                break;
            case YT.PlayerState.PLAYING:
                if (that.isSafariHack) {
                    that.stop();
                    that.isSafariHack = false;
                    that.view.height(that.playerHeight);
                    that.view.width(that.playerWidth);
                    that.hide();
                } else {
                    that.prototype.onPlaying();
                }
                break;
            case YT.PlayerState.PAUSED:
                break;
            case YT.PlayerState.BUFFERING:
                break;
            case YT.PlayerState.CUED:
                break;
            case YT.PlayerState.UNSTARTED:
                if (that.currentVideo) {
                    that.prototype.onLoading();
                }
                break;
            default:
                break;
        }
    };

    that.play = function(video) {
        var quality = 'hd720';
        if (video) {
            that.currentVideo = video;
            that.player.loadVideoById(video.id, 0, quality);
        } else {
            that.player.playVideo();
        }
    };

    that.stop = function() {
        if (that.player) {
            that.player.stopVideo();
            that.currentVideo = null;
        }
    };

    that.pause = function() {
        if (that.player) {
            that.player.pauseVideo();
        }
    }
    that.seekTo = function(time) {
        if (that.currentVideo) {
            that.player.seekTo(time, true);
        }
    };

    // Returns the current playback position in seconds
    that.getCurrentPlaybackTime = function() {
        if (that.currentVideo) {
            return that.player.getCurrentTime();
        }
        return 0;
    };

    // Returns the length of the video in seconds
    that.getTotalPlaybackTime = function() {
        if (that.currentVideo) {
            return that.player.getDuration();
        }
        return 0;
    };

    that.getBuffer = function() {
        if (that.player) {
            return that.prototype.getBuffer(
                that.player.getVideoLoadedFraction());
        } else {
            return 0;
        }
    };
}

function SoundCloudPlayer() {
    var that = this;

    this.prototype = new BaseExternalPlayer();
    that.streamApiBase = 'https://api.soundcloud.com/tracks/';
    that.developerKey = 'd5249ae899d7b26e6c6af608d876d12c';
    that.currentMusic = null;
    that.validationTimer = null;
    that.titleHack = false;
    that.type = 'soundcloud';

    that.playing = false;

    that.init = function(callback) {
        that.initialized = true;

        soundManager.onready(function() {
            soundManagerReady = true;
            if (callback) {
                setTimeout(function() {
                    callback();
                }, 1000);
            }
        });
    };

    that.hide = function() {
        $('soundcloud-player').css('left', '-10000px');
    };

    that.show = function() {
        $('soundcloud-player').css('left', '0px');
    };

    that.play = function(music) {
        if (music) {
            that.titleHack = true;
            clearTimeout(that.validationTimer);
            // This `playing` variable is only used to
            that.playing = false;
            var streamUrl = that.streamApiBase + music.id +
                    '/stream?consumer_key=' + that.developerKey;
            soundManager.createSound({
                id: music.id,
                url: streamUrl,
                volume: 100,
                onload: that.onStateChange,
                onplay: that.onStateChange,
                onfinish: that.prototype.onFinish
            });
            soundManager.play(music.id);
            that.currentMusic = music;
        } else {
            soundManager.play(that.currentMusic.id);
        }
    };

    that.stop = function() {
        soundManager.stopAll();
        if (that.currentMusic) {
            soundManager.destroySound(that.currentMusic.id);
        }
        that.currentMusic = null;
    };

    that.pause = function() {
        if (that.currentMusic) {
            soundManager.pause(that.currentMusic.id);
        }
    };

    that.seekTo = function(time) {
        if (that.currentMusic) {
            soundManager.setPosition(that.currentMusic.id, time*1000);
        }
    };

    that.getCurrentPlaybackTime = function() {
        var time = 0;
        if (that.currentMusic) {
            var sound = soundManager.getSoundById(that.currentMusic.id);
            if (sound) {
                time = sound.position / 1000.0;
            }
        }

        if (that.titleHack && time > 0) {
            if (playlistManager.playingLocalSeq
                === playlistManager.getCurrentPlaylistIdx())
                boldPlaylistTitle(that.currentMusic.title);
            PlayerMessageControl.setTitle(that.currentMusic.title);
            that.titleHack = false;
        }
        return time;
    };

    that.getTotalPlaybackTime = function() {
        var time = 0;
        if (that.currentMusic) {
            var sound = soundManager.getSoundById(that.currentMusic.id);
            if (sound) {
                time = sound.durationEstimate / 1000.0;
            }
        }
        return time;
    };

    that.getBuffer = function() {
        if (!that.currentMusic)
            return 0;

        var sound = soundManager.getSoundById(that.currentMusic.id);

        if (sound) {
            return that.prototype.getBuffer(
                sound.bytesLoaded / sound.bytesTotal);
        } else {
            return 0;
        }
    };

    that.onStateChange = function(success) {
        if (success !== undefined && success !== null && !success) {
            var current = playerManager.getCurrentMusic()
            if (current && current.type === 'youtube') {
                return;
            }

            NotifyManager.notPlayable(current.title);
            if (playerManager.forth() === -1) {
                var playlist = playlistManager.getCurrentPlaylist();
                if (playlist.empty()) {
                    return;
                }
                var onPlaylist = false;
                for (var i=0; i<playlist.length(); i++) {
                    if (playlist.raw()[i].id === current.id) {
                        onPlaylist = true;
                    }
                }
                if (onPlaylist && playlist.raw()[0].id !== current.id) {
                    playerManager.onMusicClicked(playlist.raw()[0], true);
                }
            }

        }
        if (!that.playing) {
            that.prototype.onLoading();
            that.playing = true;
        } else {
            that.prototype.onPlaying();
        }
    };
}
