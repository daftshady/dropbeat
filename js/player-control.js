var PlayerControl = {
    elems:{
        ctrlPrev: "#player .controls .ctrl-prev",
        ctrlPlay: "#player .controls .ctrl-play",
        ctrlNext: "#player .controls .ctrl-next"
    },
    init: function() {
        $(PlayerControl.elems.ctrlPrev).click(function() {
            if (PlayerControl.prevNextClickable) {
                playerManager.back();
            }
        });

        $(PlayerControl.elems.ctrlPlay).click(function() {
            playerManager.onPlayMusic();
            PlayerButtonViewControl.togglePlayButton();
        });

        $(PlayerControl.elems.ctrlNext).click(function() {
            if (PlayerControl.prevNextClickable) {
                playerManager.forth();
            }
        });

        RepeatControl.init();
        ShuffleControl.init();
        PlayerControl.updateButton(false);
    },
    prevNextClickable: true,
    updateButton: function(enable) {
        PlayerControl.prevNextClickable = enable;
        if (enable){
            $(PlayerControl.elems.ctrlPrev).removeClass('disabled');
            $(PlayerControl.elems.ctrlNext).removeClass('disabled');
        }
        else{
            $(PlayerControl.elems.ctrlPrev).addClass('disabled');
            $(PlayerControl.elems.ctrlNext).addClass('disabled');
        }
    }
};

var PlayerButtonViewControl = {
    togglePlayButton: function() {
        if (playerManager.currentMusic == null) {
            return;
        }

        if (!playerManager.isPlaying) {
            PlayerButtonViewControl.setPlay();
        } else {
            PlayerButtonViewControl.setPause();
        }
    },

    setPlay: function() {
        $(PlayerControl.elems.ctrlPlay).removeClass("pause");
        $(PlayerMessageControl.elems.playerStatus).
            text(PlayerMessageControl.statusText.onPaused);
    },

    setPause: function() {
        $(PlayerControl.elems.ctrlPlay).addClass("pause");
        var $playerStatus = $(PlayerMessageControl.elems.playerStatus);
        if ($playerStatus.text() == PlayerMessageControl.statusText.onPaused) {
            $playerStatus.text(PlayerMessageControl.statusText.onPlaying);
        }
    }
}

var PlayerMessageControl = {
    elems:{
        playerTitle:"#player .title",
        playerStatus:"#player .status"
    },

    statusText:{
        onEnd:'No music in queue',
        onLoading:'Loading music..',
        onPlaying:'Playing',
        onPaused:'Paused'
    },

    setTitle: function(title) {
        var content = title;
        $(PlayerMessageControl.elems.playerStatus).
            text(PlayerMessageControl.statusText.onPlaying);
        $(PlayerMessageControl.elems.playerTitle).text(content);
    },

    setEnd: function() {
        $(PlayerMessageControl.elems.playerTitle).text("Dropbeat player");
        $(PlayerMessageControl.elems.playerStatus).
            text(PlayerMessageControl.statusText.onEnd);
    },

    setLoading: function(title) {
        if (title)
            $(PlayerMessageControl.elems.playerTitle).text(title);
        else
            $(PlayerMessageControl.elems.playerTitle).text("...");
        $(PlayerMessageControl.elems.playerStatus).
            text(PlayerMessageControl.statusText.onLoading);
    }
};

var RepeatState = {
    noRepeat: {klass: ''},
    repeatOne: {klass: 'repeat-one'},
    repeatPlaylist: {klass: 'repeat'}
};

var RepeatSequence = [
    RepeatState.noRepeat, RepeatState.repeatPlaylist,
    RepeatState.repeatOne
];

var RepeatControl = {
    elems:{
        ctrlRepeat:"#player .controls .ctrl-repeat"
    },
    init: function() {
        RepeatControl.state = RepeatState.noRepeat;
        var toggle = $(RepeatControl.elems.ctrlRepeat);
        toggle.click(function() {
            var seqIdx = jQuery.inArray(RepeatControl.state, RepeatSequence);

            RepeatControl.state =
                RepeatSequence[(seqIdx+1) % RepeatSequence.length];
            var that = this;
            $.each(RepeatState, function(state, stateObj){
                $(that).removeClass(stateObj.klass);
            });
            $(this).addClass(RepeatControl.state.klass);
            if (RepeatControl.state == RepeatState.repeatOne){
                RepeatControl.prevNextClickable = PlayerControl.prevNextClickable;
                PlayerControl.updateButton(false);
            }
            else if (RepeatControl.prevNextClickable){
                PlayerControl.updateButton(RepeatControl.prevNextClickable);
                RepeatControl.prevNextClickable = null;
            }
        });
    },
    state: null
};

var ShuffleState = {
    on: 'shuffle',
    off: ''
};

var ShuffleControl = {
    elems:{
        shuffleToggle:'#player .controls .ctrl-shuffle'
    },
    init: function() {
        ShuffleControl.state = ShuffleState.off;
        var elem = $(ShuffleControl.elems.shuffleToggle);
        elem.click(function() {
            if (!ShuffleControl.isShuffle()) {
                ShuffleControl.state = ShuffleState.on;
                elem.addClass(ShuffleState.on);
            } else {
                ShuffleControl.state = ShuffleState.off;
                elem.removeClass(ShuffleState.on);
            }
        });
    },
    state: null,
    shuffle: function(array) {
        for (var i=array.length-1; i>0; i--) {
            var j = Math.floor(Math.random() * (i+1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    },
    isShuffle: function() {
        return ShuffleControl.state == ShuffleState.on;
    }
};
