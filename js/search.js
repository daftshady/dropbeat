// Although javascript does not always run on `single-thread`,
// this variable must be in critical section.
var context = {
    searching : false,
    keyword : ''
};

var SearchBox = {
    elems:{
        searchInput:"#search-input",
        searchButton:".body-section .search-section .search-button",
        readyComment:".body-section .ready-comment",
        searchResultSection:".body-section .search-result-section",
        searchSpinner:".body-section .search-spinner"
    },

    init: function() {
        var that = this;
        $(this.elems.searchButton).click(function() {
            if (ViewControl.isLandingPageVisible())
                ViewControl.hideLandingPage(function(){
                    SearchBox.onSubmit($(that.elems.searchInput).val());
                });
            else
                SearchBox.onSubmit($(that.elems.searchInput).val());
        });

        $(this.elems.searchInput).keydown(function(event) {
            // Keydown of `Enter key`
            if (event.keyCode === 13) {
                if (ViewControl.isLandingPageVisible())
                    ViewControl.hideLandingPage(function(){
                        SearchBox.onSubmit($(that.elems.searchInput).val());
                    });
                else
                    SearchBox.onSubmit($(this).val());
            }
        });

    },

    onSubmit: function(keyword) {
        keyword = encodeURIComponent(keyword);
        if (context.searching && (context.keyword === keyword)) {
            return;
        } else if (context.keyword === keyword) {
            return;
        }
        SearchList.updateView([]);
        $(this.elems.readyComment).hide();
        $(this.elems.searchResultSection).show();
        context.searching = true;
        context.keyword = keyword;
        $.ajax({
            url: API_SEARCH_URL,
            data: "keyword=" + keyword + "&type=jsonp",
            dataType: "jsonp",
        });
        $(this.elems.searchSpinner).show();

        if (RecomList.isVisible()) {
            RecomList.hideList();
        }

        // Logging
        if (window.dropbeat
            && typeof window.dropbeat==="object" && dropbeat.logApiAction) {
            dropbeat.logApiAction("dropbeat", "search", {keyword:keyword});
        }
    },
    retry: false
};

function searchCallback(data) {
    if (!data && !SearchBox.retry) {
        SearchBox.retry = true;
        // Retry to wake google api.
        SearchBox.onSubmit($(SearchBox.elems.searchInput).val());
        return;
    }
    $(SearchBox.elems.searchSpinner).hide();
    context.searching = false;
    SearchList.updateView(data);
    SearchBox.retry = false;
};


/* SearchList Declarations */
var SearchList = {
    elems:{
        searchResultSection:".body-section .search-result-section",
        searchResultTemplate:"#tmpl-search-results",
        musicContainer:".a-addable-music",
        playMusicBtn:".play-music",
        addToPlayListBtn:".add-to-playlist"
    },
    init: function() {
        this.delegateTrigger();
    },
    updateView: function(resp) {
        if (!resp) {
            // raise
            return;
        }
        if (!this.template)
            this.template =
                _.template($(this.elems.searchResultTemplate).html());
        SearchList.resultEscape(resp);
        var searchResultHtml = this.template({results:resp});
        $(this.elems.searchResultSection).html(searchResultHtml);
    },
    resultEscape: function(resp) {
        for (var i=0; i<resp.length; i++) {
            resp[i].title = titleEscape(resp[i].title);
        }
    },
    delegateTrigger:function(){
        var that = this;
        $(this.elems.searchResultSection).
            on("click", this.elems.addToPlayListBtn, function(){
            var $musicContainer = $(this).parents(that.elems.musicContainer);
            var musicData = {
                id:$musicContainer.data("musicId"),
                title:$musicContainer.data("musicTitle"),
                type:$musicContainer.data("musicType")
            }
            // Recommend
            var recommend = true;
            var playlist = playlistManager.getCurrentPlaylist();
            var success = playlist.add(new Music(musicData), true);

            if (recommend) {
                RecomManager.stupidRecom(musicData.id, musicData.title);
                if (!RecomList.isVisible()){
                    var selectedRow = $(this).parents(that.elems.musicContainer);
                    var searchResultBox = $(that.elems.searchResultSection);
                    var clickedRowOffset =
                        selectedRow.offset().top +
                        selectedRow.outerHeight() -
                        searchResultBox.offset().top;
                    if (searchResultBox.innerHeight() -
                        clickedRowOffset < RecomList.listHeight){
                        var scrollTop =
                            RecomList.listHeight -
                            searchResultBox.innerHeight() +
                            clickedRowOffset +
                            searchResultBox.scrollTop();
                        searchResultBox.animate({
                            scrollTop:scrollTop
                        }, 200);
                    }
                  RecomList.showList();
                }
            }

            if (syncImmediately) {
                playlistManager.getCurrentPlaylist().sync();
            }

            // Notify
            NotifyManager.playlistChangeNotify(success);

            // Logging
            if (window.dropbeat
                && typeof window.dropbeat==="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction(
                    "dropbeat", "playlist/add-from-search", musicData);
            }
         });

        $(this.elems.searchResultSection).
            on("click", this.elems.playMusicBtn, function(){
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
                typeof window.dropbeat==="object" && dropbeat.logApiAction) {
                dropbeat.logApiAction(
                    "dropbeat", "playlist/play-from-search", musicData);
            }
        });
    }
};
