/*jslint browser: true*/
/*global $*/
var DROPBEAT = (function (module) {
    'use strict';

    module.view = {
        init: function () {
            var that = this;

            that.resizeContentsBody();
            that.placeholderCompat();
            that.initializeLandingPage();

            window.onresize = function (event) {
                that.resizeContentsBody();
                if (that.isLandingPageVisible()) {
                    that.resizeLandingPage();
                }
                that.resizePlaylistRow();
            };
        },

        resizeContentsBody: function () {
            var $dropbeatContents = $('#dropbeat .contents'),
                headerSectionHeight =
                    $(".header-section").height() +
                    parseInt($(".header-section").css("paddingBottom"), 10) +
                    parseInt($(".header-section").css("paddingTop"), 10),
                footerSectionHeight =
                    $(".footer-section").height() +
                    parseInt($(".footer-section").css("paddingBottom"), 10) +
                    parseInt($(".footer-section").css("paddingTop"), 10),
                bodySectionHeight =
                    $dropbeatContents.height() -
                    headerSectionHeight - footerSectionHeight;

            $("#dropbeat .contents .body-section").
                css("height", bodySectionHeight);
        },

        placeholderCompat: function () {
// IE 7,8 does not support `placeholder`.
            $('input[placeholder]').placeholder();
        },

        initializeLandingPage: function () {
            var that = this,
                $searchSection = $('#dropbeat .body-section .search-section'),
                $searchBar = $('.search-input-field', $searchSection),
                $readyComment = $('#dropbeat .body-section .ready-comment');

            $('.footer-section').css('height', 0);
            $('.search-result-section').empty();
            that.resizeContentsBody();
            $searchSection.css({width: "inherit"});
            $readyComment.show();
            that.resizeLandingPage();
        },

        hideLandingPage: function (callback) {
            var $searchSection = $('#dropbeat .body-section .search-section'),
                $searchBar = $('.search-input-field', $searchSection),
                $readyComment = $('#dropbeat .body-section .ready-comment'),
                searchBarMaxWidth,
                searchBarWidth;

            $searchSection.css({width: "100%"});
            searchBarMaxWidth = parseInt($searchSection.css('maxWidth'), 10);
            searchBarWidth = $searchSection.width() * 0.6;
            if (searchBarWidth > searchBarMaxWidth) {
                searchBarWidth = searchBarMaxWidth;
            }
            $readyComment.fadeOut(500);
            $searchSection.animate({top: 0}, 500, function () {
                $searchBar.animate({width: searchBarWidth}, 500, function () {
                    $searchBar.css({width: "60%"});
                });
                $searchSection.animate({left: 0}, 500, function () {
                    $('#dropbeat .body-section .search-result-section').show();
                    if (callback && typeof callback === "function") {
                        callback();
                    }
                });
            });
        },

        resizeLandingPage: function () {
            var $searchSection = $('#dropbeat .body-section .search-section'),
                $searchBar = $('.search-input-field', $searchSection),
                $readyComment = $('#dropbeat .body-section .ready-comment'),
                $bodySection = $('#dropbeat .body-section'),
                $initializeLoader =
                    $('#dropbeat .body-section .dropbeat-initialize-spinner'),
                readyCommentHeight,
                landingPageHeight,
                landingPageTop,
                newSearchBarTop,
                newSearchBarLeft,
                initializeLoaderTop;

            $searchBar.css({width: $readyComment.width() * 0.5});

            readyCommentHeight =
                $readyComment.height() +
                parseInt($readyComment.css("paddingBottom"), 10);
            landingPageHeight =
                $searchSection.height() + readyCommentHeight;
            landingPageTop = ($bodySection.height() -
                $bodySection.offset().top - landingPageHeight) / 2;
            newSearchBarTop = landingPageTop + readyCommentHeight;
            newSearchBarLeft =
                ($bodySection.width() - $searchSection.width()) / 2;
            initializeLoaderTop = newSearchBarTop + $searchSection.height();
            $readyComment.css({top: landingPageTop});
            $searchSection.css({left: newSearchBarLeft, top: newSearchBarTop});
            $initializeLoader.css({top: initializeLoaderTop});
        },

        isLandingPageVisible: function () {
            return $('.body-section .ready-comment').is(':visible');
        },

        resizePlaylistRow: function () {
            if ($(".a-playlist-music").length > 0) {
                var rowWidth =
                    $(".a-playlist-music").width() -
                    $(".music-remove").width() -
                    parseInt($(".music-remove").css("paddingLeft"), 10) -
                    parseInt($(".music-remove").css("paddingRight"), 10),
                    maxMusicIndexWidth,
                    scrollWidth;

                $(".music-title-wrapper").css("width", rowWidth);
                maxMusicIndexWidth = $(".music-index:last").width();
                scrollWidth = $(".music-title-wrapper").width()
                    - Math.max(maxMusicIndexWidth, $(".music-on-icon").width());
                scrollWidth -=
                    parseInt($(".music-index").css("paddingRight"), 10);
                scrollWidth -=
                    parseInt($(".music-index").css("paddingLeft"), 10);
                $(".music-index").css("width", maxMusicIndexWidth);
                $(".music-title-scroll-wrapper").css("width", scrollWidth);
            }
        }
    };

    return module;
}(DROPBEAT));
