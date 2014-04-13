var RecomManager = {
    elems:{
        recomResultSection:".recom-section .recom-results-wrapper",
        loadingSpinner:".recom-section .loading-spinner"
    },
    init: function() {
    },
    stupidRecom: function(music_id, music_title) {
        $.ajax({
            url: API_RECOM_URL,
            data: {
                'type': 'jsonp',
                'id': music_id,
                'title': music_title
            }
        });
        $(this.elems.loadingSpinner).show();
        $(this.elems.recomResultSection).hide();
        $(this.elems.recomResultSection).empty();
    },
};

function recomCallback(data) {
    $(RecomManager.elems.recomResultSection).show();
    $(RecomManager.elems.loadingSpinner).hide();
    if (data.length > 0) {
        RecomList.updateView(data);
    } else {
        RecomList.hideList();
    }
}

var RecomList = {
    listHeight:138,
    elems:{
        recomResultSection:".recom-section .recom-results-wrapper",
        recomResultTemplate:"#tmpl-recom-results",
        musicContainer:".a-addable-music",
        playMusicBtn:".play-music",
        addToPlayListBtn:".add-to-playlist"
    },
    init: function() {
        RecomList.delegateTrigger();
    },
    updateView: function(resp) {
        if (resp == null)
            return;
        if(!this.template)
            this.template =
                _.template($(this.elems.recomResultTemplate).html());
        RecomList.resultEscape(resp);
        var recomResultHtml = this.template({results:resp.slice(0,3)});
        $(this.elems.recomResultSection).html(recomResultHtml);
    },
    resultEscape: function(resp) {
        for (var i=0; i<resp.length; i++) {
            resp[i].title = titleEscape(resp[i].title);
        }
    },
    delegateTrigger:function(){
        var that = this;
        $(this.elems.recomResultSection).on(
            "click", this.elems.addToPlayListBtn, function(){
            var $musicContainer = $(this).parents(that.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            // Recommend
            var recommend = true;
            var playlist = playlistManager.getCurrentPlaylist();
            NotifyManager.playlistChangeNotify(
                playlist.add(new Music(musicData), true));

            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat=="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction(
                    "dropbeat", "playlist/add-from-recom", musicData);
            }
        });

        $(this.elems.recomResultSection).on(
            "click", this.elems.playMusicBtn, function() {
            var $musicContainer = $(this).parents(that.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }

            musicQ.init();
            m = new Music({
                'id':musicData.id,
                'title':musicData.title,
                'type':musicData.type
            });
            playerManager.onMusicClicked(m);

            // Logging
            if (window.dropbeat &&
                typeof window.dropbeat=="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction(
                    "dropbeat", "playlist/play-from-recom", musicData);
            }
        });
    },
    showList:function(){
        if(!this.isVisible()){
            var that = this;

            var $dropbeatContents = $('#dropbeat .contents');
            var headerSectionHeight =
                $(".header-section").height() +
                parseInt($(".header-section").css("paddingBottom")) +
                parseInt($(".header-section").css("paddingTop"));
            var footerSectionHeight = this.listHeight;
            var bodySectionHeight =
                $dropbeatContents.height() -
                headerSectionHeight -
                footerSectionHeight;

            $(".footer-section").animate({
                height:that.listHeight
            },200);
            $(".body-section").animate({
                height:bodySectionHeight
            }, 200);
        }
    },
    hideList:function(){
        if(this.isVisible()){
            var that = this;

            var $dropbeatContents = $('#dropbeat .contents');
            var headerSectionHeight =
                $(".header-section").height() +
                parseInt($(".header-section").css("paddingBottom")) +
                parseInt($(".header-section").css("paddingTop"));
            var bodySectionHeight = 
                $dropbeatContents.height() - headerSectionHeight;

            $(".footer-section").animate({
                height:0
            },200);
            $(".body-section").animate({
                height:bodySectionHeight
            }, 200);
        }
    },
    isVisible:function(){
        return $(".footer-section").height() > 0;
    }
};
