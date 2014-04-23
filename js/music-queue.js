/* Manages music queue */
var queueEOL = 'stop';
function MusicQueue () {
    var self = this;
    self.q = [];
    self.playType = 'normal';
    self.init = function(listOfMusic) {
        delete self.q;
        self.q = [];
        if (listOfMusic) {
            self.q = self.q.concat(listOfMusic);
        }
    };
    self.push = function(music) {
        self.q.push(music);
    };

    self.pushEOL = function() {
        // this method is needed for indicating stopping music iterating
        // Music play stops when EOL popped from queue.
        self.q.push(queueEOL);
    };

    self.pop = function() {
        // pop next played music from queue.
        if (self.playType === 'normal') {
            return self.q.shift();
        }
    };

    self.top = function() {
        if (self.q.length !== 0)
            return self.q[0];
    };

    self.removeWithId = function(musicId) {
        for (var i=0; i<self.q.length; i++) {
            if (musicId === self.q[i].id) {
                self.q.splice(i, 1);
            }
        }
    };
};
