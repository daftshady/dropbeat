var queueEOL = 'stop';
function MusicQueue () {
    var that = this;
    that.q = [];
    that.playType = 'normal';
    that.init = function(listOfMusic) {
        delete that.q;
        that.q = [];
        if (listOfMusic) {
            that.q = that.q.concat(listOfMusic);
        }
    };
    that.push = function(music) {
        that.q.push(music);
    };

    that.pushEOL = function() {
        // this method is needed for indicating stopping music iterating
        // Music play stops when EOL popped from queue.
        that.q.push(queueEOL);
    };

    that.pop = function() {
        // pop next played music from queue.
        if (that.playType === 'normal') {
            return that.q.shift();
        }
    };

    that.top = function() {
        if (that.q.length !== 0)
            return that.q[0];
    };

    that.removeWithId = function(musicId) {
        for (var i=0; i<that.q.length; i++) {
            if (musicId === that.q[i].id) {
                that.q.splice(i, 1);
            }
        }
    };
};
