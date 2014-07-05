/*jslint browser: true*/
/*global $*/
var DROPBEAT = (function (module) {
    'use strict';

    var control;

    module.player.control = {};
    control = module.player.control;

    control.init = function () {
        var that = this;

        $(that.base.elems.ctrlPrev).click(function () {
            if (that.base.prevNextClickable) {
                module.playerManager.back();
            }
        });

        $(that.base.elems.ctrlPlay).click(function () {
            module.playerManager.onPlayMusic();
            module.s.playerButton.togglePlayButton();
        });

        $(that.base.elems.ctrlNext).click(function () {
            if (that.base.prevNextClickable) {
                module.playerManager.forth();
            }
        });

        that.repeat.control.init();
        that.shuffle.control.init();
        that.base.updateButton(false);
    };

    control.base = {
        elems: {
            ctrlPrev: "#player .controls .ctrl-prev",
            ctrlPlay: "#player .controls .ctrl-play",
            ctrlNext: "#player .controls .ctrl-next"
        },

        prevNextClickable: true,

        updateButton: function (enable) {
            var that = this;

            that.prevNextClickable = enable;
            if (enable) {
                $(that.elems.ctrlPrev).removeClass('disabled');
                $(that.elems.ctrlNext).removeClass('disabled');
            } else {
                $(that.elems.ctrlPrev).addClass('disabled');
                $(that.elems.ctrlNext).addClass('disabled');
            }
        }
    };

    control.button = {
        togglePlayButton: function () {
            var that = this;

            if (!module.playerManager.currentMusic) {
                return;
            }

            if (!module.playerManager.playing) {
                that.setPlay();
            } else {
                that.setPause();
            }
        },

        setPlay: function () {
            $(module.s.playerBase.elems.ctrlPlay).removeClass("pause");
            $(module.s.playerMessage.elems.playerStatus).
                text(module.s.playerMessage.statusText.onPaused);
        },

        setPause: function () {
            var $playerStatus = $(module.s.playerMessage.elems.playerStatus);

            $(module.s.playerBase.elems.ctrlPlay).addClass("pause");
            if ($playerStatus.text() ===
                    module.s.playerMessage.statusText.onPaused) {
                $playerStatus.text(module.s.playerMessage.statusText.onPlaying);
            }
        }
    };

    control.message = {
        elems: {
            playerTitle: "#player .title",
            playerStatus: "#player .status"
        },
        statusText: {
            onEnd: 'No music in queue',
            onLoading: 'Loading music..',
            onPlaying: 'Playing',
            onPaused: 'Paused'
        },
        setTitle: function (title) {
            var content = title;

            $(module.s.playerMessage.elems.playerStatus).
                text(module.s.playerMessage.statusText.onPlaying);
            $(module.s.playerMessage.elems.playerTitle).text(content);
        },

        setEnd: function () {
            $(module.s.playerMessage.elems.playerTitle).text("Dropbeat player");
            $(module.s.playerMessage.elems.playerStatus).
                text(module.s.playerMessage.statusText.onEnd);
        },

        setLoading: function (title) {
            if (title) {
                $(module.s.playerMessage.elems.playerTitle).text(title);
            } else {
                $(module.s.playerMessage.elems.playerTitle).text("...");
            }
            $(module.s.playerMessage.elems.playerStatus).
                text(module.s.playerMessage.statusText.onLoading);
        }
    };

    control.repeat = {};

    control.repeat.state = {
        noRepeat: {klass: ''},
        repeatOne: {klass: 'repeat-one'},
        repeatPlaylist: {klass: 'repeat'}
    };

    control.repeat.sequence = [
// We do not used `shortcuts` to init this here. (it's array!)
        control.repeat.state.noRepeat,
        control.repeat.state.repeatPlaylist,
        control.repeat.state.repeatOne
    ];

    control.repeat.control = {
        init: function () {
            var that = this,
                toggle = $(that.elems.ctrlRepeat),
                repeatState = module.s.repeatState,
                repeatSequence = module.s.repeatSequence,
                playerControl = module.s.playerBase;

            that.state = repeatState.noRepeat;

            toggle.click(function () {
                var repeatElem = that.elems.ctrlRepeat,
                    seqIdx = $.inArray(that.state, repeatSequence);

                that.state =
                    repeatSequence[(seqIdx + 1) % repeatSequence.length];

                $.each(repeatState, function (state, stateObj) {
                    $(repeatElem).removeClass(stateObj.klass);
                });

                $(repeatElem).addClass(that.state.klass);
                if (that.state === repeatState.repeatOne) {
                    that.prevNextClickable = playerControl.prevNextClickable;
                    playerControl.updateButton(false);
                } else if (that.prevNextClickable) {
                    playerControl.updateButton(that.prevNextClickable);
                    that.prevNextClickable = null;
                }
            });
        },

        elems: {
            ctrlRepeat: "#player .controls .ctrl-repeat"
        },

        state: null,

        prevNextClickable: true
    };

    control.shuffle = {};

    control.shuffle.state = {
        on: 'shuffle',
        off: ''
    };

    control.shuffle.control = {
        init: function () {
            var that = this,
                elem = $(that.elems.shuffleToggle),
                shuffleState = control.shuffle.state;

            that.state = shuffleState.off;

            elem.click(function () {
                if (!that.isShuffle()) {
                    that.state = shuffleState.on;
                    elem.addClass(shuffleState.on);
                } else {
                    that.state = shuffleState.off;
                    elem.removeClass(shuffleState.on);
                }
            });
        },

        elems: {
            shuffleToggle: '#player .controls .ctrl-shuffle'
        },

        state: null,

        shuffle: function (array) {
            var i,
                j,
                temp;

            for (i = array.length - 1; i > 0; i -= 1) {
                j = Math.floor(Math.random() * (i + 1));
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        },

        isShuffle: function () {
            var shuffleState = module.s.shuffleState;
            return this.state === shuffleState.on;
        }
    };

    control.progress = {
        isDragging: null,
        $bar: null,
        $buffer: null,
        $bullet: null,
        $position: null,
        $length: null,
        $handle: null,
        bulletUpdateCaller: null,
        bufferUpdateCaller: null,
        isStarted: false,

        init: function () {
            var that = this;

            that.isDragging = false;
            that.$buffer = $('#player .buffer');
            that.$bullet = $('#player .bullet');
            that.$position = $('#player .curr-play-time');
            that.$length = $('#player .total-play-time');
            that.$bar = $('#player .progress-bar');
            that.$handle = $('#player .progress-handle');

            $('#player .progress-bar').mousedown(function (event) {
                that.updateByMouse(event);
            });

            $('#player .progress-handle').mousedown(function (event) {
                that.startDrag();
            });

            $(window).mouseup(function (event) {
                that.stopDrag(event);
            });

            $(window).mousemove(function (event) {
                that.onDrag(event);
            });
        },

        start: function () {
            $('#player .progress-handle').show();
            var that = this,
                interval = 100;

            if (!that.bulletUpdateCaller) {
                that.bulletUpdateCaller =
                    setInterval(function () {
                        that.updateBullet();
                    }, interval);
            }
            if (!that.bufferUpdateCaller) {
                that.bufferUpdateCaller =
                    setInterval(function () {
                        that.updateBuffer();
                    }, interval * 10);
            }
            that.isStarted = true;
        },

        stop: function () {
            var that = this;

            if (that.bulletUpdateCaller) {
                clearInterval(that.bulletUpdateCaller);
                that.bulletUpdateCaller = null;
            }
            that.isStarted = false;
        },

        startDrag: function () {
            var that = this;

            that.isDragging = true;
        },

        onDrag: function (event) {
            var that = this;

            if (!that.isDragging) {
                return;
            }
            that.updateByMouse(event);
        },

        stopDrag: function (event) {
            var that = this;

            if (that.isDragging) {
                that.stop();
                that.isDragging = false;
                that.updateByMouse(event);
                that.start();
            }
        },

        updateByMouse: function (event) {
            var that = this,
                cursorX = event.pageX - that.$bullet.offset().left,
                barWidth = that.$bar.width(),
                len = module.playerManager.getTotalPlaybackTime(),
                pos,
                posText,
                lenText,
                bulletWidth;

            if (cursorX < 0) {
                cursorX = 0;
            }
            if (cursorX > barWidth) {
                cursorX = barWidth;
            }
            pos = cursorX / barWidth * len;

            if (pos && len) {
                posText = that.getTimeText(pos);
                that.$position.text(posText);

                lenText = that.getTimeText(len);
                that.$length.text(lenText);
                bulletWidth = pos / len * barWidth;
                that.$bullet.width(bulletWidth);
                that.$handle.css('left', bulletWidth);
            }

            if (!that.isDragging) {
                module.playerManager.seekTo(pos);
            }
        },

        updateBullet: function (event) {
            var that = this,
                pos = module.playerManager.getCurrentPlaybackTime(),
                posText = '',
                len = module.playerManager.getTotalPlaybackTime(),
                lenText = '',
                bulletWidth;

            if (that.isDragging) {
                return;
            }

            if (pos && len) {
                posText = that.getTimeText(pos);
                that.$position.text(posText);
                lenText = that.getTimeText(len);
                that.$length.text(lenText);
                bulletWidth = pos / len * that.$bar.width();
                that.$bullet.width(pos / len * that.$bar.width());
                that.$handle.css('left', bulletWidth);
            } else {
                that.$position.text('0:00');
                that.$length.text('0:00');
                that.$bullet.width(0);
            }
        },

        updateBuffer: function (buffer) {
            var that = this;

            if (that.isStarted) {
                buffer = !buffer ? module.playerManager.getBuffer() : buffer;
                that.$buffer.width(buffer / 100.0 * that.$bar.width());
            }
        },

        reset: function () {
            var that = this;

            that.updateBuffer(0);
        },

        getTimeText: function (sec) {
            return Math.floor(sec / 60.0) + ':' +
                ((Math.floor(sec % 60) < 10) ? '0' : '') + Math.floor(sec % 60);
        }
    };

    return module;
}(DROPBEAT));
