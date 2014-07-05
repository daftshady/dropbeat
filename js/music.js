/*jslint browser: true*/
var DROPBEAT = (function (module) {
    'use strict';

    module.music = {};

    module.music.Music = function (params) {
        var that = this;

        that.id = params.id;
        that.title = params.title;
        that.type = params.type;
    };

    function MusicQueue() {
        var that = this;

        that.q = [];
        that.playType = 'normal';

        that.init = function (listOfMusic) {
            delete that.q;
            that.q = [];
            if (listOfMusic) {
                that.q = that.q.concat(listOfMusic);
            }
        };

        that.push = function (music) {
            that.q.push(music);
        };

        that.pushEOL = function () {
// this method is needed for indicating stopping music iterating
// Music play stops when EOL popped from queue.
            that.q.push(module.constants.queueEOL);
        };

        that.pop = function () {
            if (that.playType === 'normal') {
                return that.q.shift();
            }
        };

        that.top = function () {
            if (that.q.length !== 0) {
                return that.q[0];
            }
        };

        that.removeWithId = function (musicId) {
            var i;

            for (i = 0; i < that.q.length; i += 1) {
                if (musicId === that.q[i].id) {
                    that.q.splice(i, 1);
                }
            }
        };
    }

    module.music.musicQueue = new MusicQueue();

    return module;
}(DROPBEAT));
