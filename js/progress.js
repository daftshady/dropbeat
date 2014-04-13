// Defines music progress bar
var Progress = {
    isDragging: null,
    $buffer: null,
    $bullet: null,
    $position: null,
    $length: null,
    bulletUpdateCaller: null,
    bufferUpdateCaller: null,
    isStarted: false,

    init: function() {
        Progress.isDragging = false;
        Progress.$buffer = $('#player .buffer');
        Progress.$bullet = $('#player .bullet');
        Progress.$position = $('#player .curr-play-time');
        Progress.$length = $('#player .total-play-time');
        Progress.$bar = $('#player .progress-bar');
        Progress.$handle = $('#player .progress-handle');

        $('#player .progress-bar').mousedown(function(event) {
            Progress.updateByMouse(event);
        });

        $('#player .progress-handle').mousedown(function(event) {
            Progress.startDrag();
        });

        $(window).mouseup(function(event) {
            Progress.stopDrag(event);
        });

        $(window).mousemove(function(event) {
            Progress.onDrag(event);
        });
    },

    start: function() {
        $('#player .progress-handle').show();
        var interval = 100;
        if (Progress.bulletUpdateCaller == null) {
            Progress.bulletUpdateCaller = setInterval(Progress.updateBullet, interval);
        }
        if (Progress.bufferUpdateCaller == null) {
            Progress.bufferUpdateCaller = setInterval(Progress.updateBuffer, interval * 10);
        }
        Progress.isStarted = true;
    },

    stop: function() {
        if (Progress.bulletUpdateCaller != null) {
            clearInterval(Progress.bulletUpdateCaller);
            Progress.bulletUpdateCaller = null;
        }
        Progress.isStarted = false;
    },

    startDrag: function() {
        Progress.isDragging = true;
    },

    onDrag: function(event) {
        if (!Progress.isDragging) {
            return;
        }
        Progress.updateByMouse(event);
    },

    stopDrag: function(event) {
        if (Progress.isDragging) {
            Progress.stop();
            Progress.isDragging = false;
            Progress.updateByMouse(event);
            Progress.start();
        }
    },

    updateByMouse: function(event) {
        var cursorX = event.pageX - Progress.$bullet.offset().left;
        var barWidth = Progress.$bar.width();
        if (cursorX < 0) {
            cursorX = 0;
        }
        if (cursorX > barWidth) {
            cursorX = barWidth;
        }
        var len = playerManager.getTotalPlaybackTime();
        var pos = cursorX / barWidth * len;

        if (pos && len) {
            posText = getText(pos);
            Progress.$position.text(posText);

            lenText = getText(len);
            Progress.$length.text(lenText);
            var width = pos/len*barWidth;
            Progress.$bullet.width(width);
            Progress.$handle.css('left', width);
        }

        // Updates video
        if (!Progress.isDragging) {
            playerManager.seekTo(pos);
        }
    },

    updateBullet: function(event) {
        var pos = playerManager.getCurrentPlaybackTime(),
            posText = '',
            len = playerManager.getTotalPlaybackTime(),
            lenText = '';
        if (Progress.isDragging) {
            return;
        }

        if (pos && len) {
            posText = getText(pos);
            Progress.$position.text(posText);

            lenText = getText(len);
            Progress.$length.text(lenText);
            var width = pos/len*Progress.$bar.width();
            Progress.$bullet.width(pos/len*Progress.$bar.width());
            Progress.$handle.css('left', width);
        } else {
            Progress.$position.text('0:00');
            Progress.$length.text('0:00');
            Progress.$bullet.width(0);
        }
    },

    updateBuffer: function(buffer) {
        if (Progress.isStarted) {
            buffer = buffer == null ? playerManager.getBuffer() : buffer;
            Progress.$buffer.width(buffer/100.0*Progress.$bar.width());
        }
    },

    reset: function() {
        Progress.updateBuffer(0);
    }
};

function getText(sec) {
    return Math.floor(sec/60.0) + ':' +
        ((Math.floor(sec%60) <10) ? '0' : '') + Math.floor(sec%60);
}

