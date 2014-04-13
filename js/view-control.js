/* View control for flexible window size */

var ViewControl = {
    init: function() {
        ViewControl.resizeContentsBody();
        ViewControl.placeholderCompat();
        ViewControl.initializeLandingPage();

        window.onresize = function(event) {
            ViewControl.resizeContentsBody();
            if(ViewControl.isLandingPageVisible())
                ViewControl.resizeLandingPage();
            ViewControl.resizePlaylistRow();
        };
    },
    resizeContentsBody: function() {
        var $dropbeatContents = $('#dropbeat .contents');
        var headerSectionHeight =
            $(".header-section").height() +
            parseInt($(".header-section").css("paddingBottom")) +
            parseInt($(".header-section").css("paddingTop"));
        var footerSectionHeight =
            $(".footer-section").height() +
            parseInt($(".footer-section").css("paddingBottom")) +
            parseInt($(".footer-section").css("paddingTop"));
        var bodySectionHeight =
            $dropbeatContents.height() -
            headerSectionHeight - footerSectionHeight;
        $("#dropbeat .contents .body-section").
            css("height", bodySectionHeight);
    },
    placeholderCompat: function() {
        // IE 7,8 does not support `placeholder`.
        $('input[placeholder]').placeholder();
    },
    initializeLandingPage: function(){
        $('.footer-section').css('height', 0);
        $('.search-result-section').empty();
        this.resizeContentsBody();
        var $searchSection = $('#dropbeat .body-section .search-section')
          , $searchBar = $('.search-input-field', $searchSection)
          , $readyComment = $('#dropbeat .body-section .ready-comment');

        $searchSection.css({width:"inherit"});
        $readyComment.show();
        this.resizeLandingPage();
    },
    hideLandingPage: function(callback){
        var $searchSection = $('#dropbeat .body-section .search-section')
          , $searchBar = $('.search-input-field', $searchSection)
          , $readyComment = $('#dropbeat .body-section .ready-comment');

        $searchSection.css({width:"100%"});
        var searchBarMaxWidth = parseInt($searchSection.css('maxWidth'));
        var searchBarWidth = $searchSection.width() * 0.6;
        if(searchBarWidth > searchBarMaxWidth)
          searchBarWidth = searchBarMaxWidth;


        $readyComment.fadeOut(500);
        $searchSection.animate({top:0}, 500, function(){
            $searchBar.animate({width:searchBarWidth}, 500, function(){
                $searchBar.css({width:"60%"});
            });
            $searchSection.animate({left:0}, 500, function(){
                $('#dropbeat .body-section .search-result-section').show();
                if(callback && typeof callback == "function")
                    callback();
            });
        });
    },

    resizeLandingPage: function(){
        var $searchSection = $('#dropbeat .body-section .search-section')
          , $searchBar = $('.search-input-field', $searchSection)
          , $readyComment = $('#dropbeat .body-section .ready-comment')
          , $bodySection = $('#dropbeat .body-section')
          , $initializeLoader = $('#dropbeat .body-section .dropbeat-initialize-spinner');

        $searchBar.css({width:$readyComment.width() * 0.5});

        var readyCommentHeight = $readyComment.height() + parseInt($readyComment.css("paddingBottom"));
        var landingPageHeight = $searchSection.height() + readyCommentHeight;
        var landingPageTop = ($bodySection.height() - $bodySection.offset().top - landingPageHeight)/2;
        var newSearchBarTop = landingPageTop + readyCommentHeight
          , newSearchBarLeft = ($bodySection.width() - $searchSection.width())/2;
        var initializeLoaderTop = newSearchBarTop + $searchSection.height();

        $readyComment.css({top:landingPageTop});
        $searchSection.css({left:newSearchBarLeft, top:newSearchBarTop});
        $initializeLoader.css({top:initializeLoaderTop});
    },

    isLandingPageVisible: function() {
        return $('.body-section .ready-comment').is(':visible');
    },

    resizePlaylistRow: function() {
        if($(".a-playlist-music").length > 0){
            var rowWidth = $(".a-playlist-music").width() - $(".music-remove").width()
                                    - parseInt($(".music-remove").css("paddingLeft"))
                                    - parseInt($(".music-remove").css("paddingRight"));
            $(".music-title-wrapper").css("width", rowWidth);
            var maxMusicIndexWidth = $(".music-index:last").width();
            var scrollWidth = $(".music-title-wrapper").width()
                    -Math.max(maxMusicIndexWidth, $(".music-on-icon").width());
            scrollWidth -= parseInt($(".music-index").css("paddingRight"));
            scrollWidth -= parseInt($(".music-index").css("paddingLeft"));
            $(".music-index").css("width", maxMusicIndexWidth);
            $(".music-title-scroll-wrapper").css("width", scrollWidth);
        }
    }
};

