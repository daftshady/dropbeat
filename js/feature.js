/*jslint browser: true*/
/*jslint nomen: true*/
/*global $, _*/
var DROPBEAT = (function (module) {
    'use strict';

    module.feature = {};

    module.feature.urlAdder = {
        init: function () {
            var that = this,
                url;

            $(that.elems.urlAddButton).click(function () {
                url = $(that.elems.urlAddInput).val();
                if (!url ||
                        (url.indexOf('youtube.com') === -1
                        && url.indexOf('youtu.be') === -1
                        && url.indexOf('soundcloud.com') === -1)) {
                    module.s.notifyManager.invalidAdderUrl();
                } else {
                    that.onSubmit(url);
                }
            });
        },

        elems: {
            urlAddField: ".add-by-url-section .url-input-field-wrapper",
            urlAddInput: ".add-by-url-section #add-by-url-input",
            urlAddButton: ".add-by-url-section .add-button",
            loadingSpinner: ".add-by-url-section .loading-spinner"
        },

        adding: false,

        onSubmit: function (url) {
            var that = this;

            if (!that.adding) {
                that.hideAll();
                that.adding = true;

                $.ajax({
                    url: module.api.resolveUrl,
                    data: {
                        'url': url,
                        'type': 'jsonp'
                    },
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    success: function (data) {
                        that.urlAdderCallback(data);
                    }
                });
            }

            module.log("dropbeat", "playlist-manage/load-from-url");
        },

        urlAdderCallback: function (data) {
            var that = this,
                playlist =
                    module.playlistManager.getCurrentPlaylist(),
                success;

            if (data) {
                data.title = module.escapes.title(data.title);
                success = playlist.add(new module.s.Music(data), true);
                if (success) {
                    module.playlistManager.getCurrentPlaylist().sync();
                }
                module.s.notifyManager.playlistChangeNotify(success);
            } else {
                module.s.notifyManager.invalidAdderUrl();
            }
            that.adding = false;

            that.showAll();
            that.clearInput();
        },

        showAll: function () {
            var that = this;

            $(that.elems.urlAddField).show();
            $(that.elems.loadingSpinner).hide();
        },

        hideAll: function () {
            var that = this;

            $(that.elems.urlAddField).hide();
            $(that.elems.loadingSpinner).show();
        },

        clearInput: function () {
            var that = this;

            $(that.elems.urlAddInput).val("");
        }
    };

    module.feature.search = {};

    module.feature.search.context = {
        searching: false,
        keyword: null
    };

    module.feature.search.box = {
        init: function () {
            var that = this;

            $(that.elems.searchButton).click(function () {
                if (module.s.viewControl.isLandingPageVisible()) {
                    module.s.viewControl.hideLandingPage(function () {
                        that.onSubmit($(that.elems.searchInput).val());
                    });
                } else {
                    that.onSubmit($(that.elems.searchInput).val());
                }
            });

            $(that.elems.searchInput).keydown(function (event) {
// Handles Keydown of `Enter key`
                if (event.keyCode === 13) {
                    if (module.s.viewControl.isLandingPageVisible()) {
                        module.s.viewControl.hideLandingPage(function () {
                            that.onSubmit($(that.elems.searchInput).val());
                        });
                    } else {
                        that.onSubmit($(that.elems.searchInput).val());
                    }
                }
            });

        },

        elems: {
            searchInput: "#search-input",
            searchButton: ".body-section .search-section .search-button",
            readyComment: ".body-section .ready-comment",
            searchResultSection: ".body-section .search-result-section",
            searchSpinner: ".body-section .search-spinner"
        },

        onSubmit: function (keyword) {
            var that = this,
                context = module.s.searchContext;

            keyword = encodeURIComponent(keyword);
            function unsearchable() {
                return (context.searching && (context.keyword === keyword)) ||
                    context.keyword === keyword;
            }
            if (unsearchable()) {
                return;
            }

            module.s.searchList.updateView([]);
            $(that.elems.readyComment).hide();
            $(that.elems.searchResultSection).show();
            context.searching = true;
            context.keyword = keyword;

            $.ajax({
                url: module.api.searchUrl,
                data: decodeURIComponent($.param({
                    'keyword': keyword,
                    'type': 'jsonp'
                })),
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function (data) {
                    that.searchCallback(data);
                }
            });
            $(that.elems.searchSpinner).show();

            if (module.s.recommendList.isVisible()) {
                module.s.recommendList.hideList();
            }

            module.log("dropbeat", "search", {keyword: keyword});
        },

        searchCallback: function (data) {
            var notifyManager =
                    module.s.notifyManager,
                url;

            if (data) {
                notifyManager.hide('.search-input-field');
                if (data.is_singer) {
                    url = module.host + '/?artist=' + data.keyword;
                    notifyManager.artistUrl(data.keyword, url);
                    notifyManager.onclick(
                        '.search-input-field',
                        function () {
                            window.open(url);
                        }
                    );
                }
                $(module.s.searchBox.elems.searchSpinner).hide();
                module.s.searchContext.searching = false;
                module.s.searchList.updateView(data.tracks);
            }
        }
    };

    module.feature.search.list = {
        init: function () {
            var that = this;

            that.delegateTrigger();
        },

        elems: {
            searchResultSection: ".body-section .search-result-section",
            searchResultTemplate: "#tmpl-search-results",
            musicContainer: ".a-addable-music",
            playMusicBtn: ".play-music",
            addToPlayListBtn: ".add-to-playlist"
        },

        updateView: function (resp) {
            var that = this;

            if (!resp) {
                return;
            }
            if (!that.template) {
                that.template =
                    _.template($(that.elems.searchResultTemplate).html());
            }
            that.resultEscape(resp);
            $(that.elems.searchResultSection).html(
                that.template(
                    {results: resp}
                )
            );
        },

        resultEscape: function (resp) {
            var i;

            for (i = 0; i < resp.length; i += 1) {
                resp[i].title = module.escapes.title(resp[i].title);
            }
        },

        delegateTrigger: function () {
            var that = this;

            $(that.elems.searchResultSection).on(
                "click",
                that.elems.addToPlayListBtn,
                function () {
                    var self = this,
                        $musicContainer =
                            $(self).
                                parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        },
                        recommend = true,
                        playlist =
                            module.playlistManager.getCurrentPlaylist(),
                        success =
                            playlist.add(new module.s.Music(musicData), true),
                        recomBox =
                            module.s.recommendBox,
                        recomList =
                            module.s.recommendList,
                        selectedRow,
                        searchResultBox,
                        clickedRowOffset,
                        scrollTop;

                    if (recommend) {
                        recomBox.stupidRecom(musicData.id, musicData.title);
                        if (!recomList.isVisible()) {
                            selectedRow =
                                $(self).
                                    parents(that.elems.musicContainer);
                            searchResultBox = $(that.elems.searchResultSection);
                            clickedRowOffset =
                                selectedRow.offset().top +
                                selectedRow.outerHeight() -
                                searchResultBox.offset().top;
                            if (searchResultBox.innerHeight() -
                                    clickedRowOffset < recomList.listHeight) {
                                scrollTop =
                                    recomList.listHeight -
                                    searchResultBox.innerHeight() +
                                    clickedRowOffset +
                                    searchResultBox.scrollTop();
                                searchResultBox.animate({
                                    scrollTop: scrollTop
                                }, 200);
                            }
                            recomList.showList();
                        }
                    }

                    module.playlistManager.getCurrentPlaylist().sync();
                    module.s.notifyManager.playlistChangeNotify(success);

                    module.log(
                        "dropbeat",
                        "playlist/add-from-search",
                        musicData
                    );
                }
            );

            $(that.elems.searchResultSection).on(
                "click",
                that.elems.playMusicBtn,
                function () {
                    var self = this,
                        $musicContainer =
                            $(self).
                                parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        };

                    module.s.musicQ.init();
                    module.playerManager.onMusicClicked(
                        new module.s.Music({
                            'id': musicData.id,
                            'title': musicData.title,
                            'type': musicData.type
                        })
                    );

                    module.log(
                        "dropbeat",
                        "playlist/play-from-search",
                        musicData
                    );
                }
            );
        }
    };

    module.feature.recommend = {};

    module.feature.recommend.box = {
        elems: {
            recomResultSection: ".recom-section .recom-results-wrapper",
            loadingSpinner: ".recom-section .loading-spinner"
        },

        stupidRecom: function (music_id, music_title) {
            var that = this;

            $.ajax({
                url: module.api.recommendUrl,
                data: decodeURIComponent($.param({
                    'type': 'jsonp',
                    'id': music_id,
                    'title': music_title
                })),
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function (data) {
                    that.recommendCallback(data);
                }
            });
            $(that.elems.loadingSpinner).show();
            $(that.elems.recomResultSection).hide();
            $(that.elems.recomResultSection).empty();
        },

        recommendCallback: function (data) {
            var that = this,
                recommendList =
                    module.s.recommendList;

            $(that.elems.recomResultSection).show();
            $(that.elems.loadingSpinner).hide();
            if (data.length > 0) {
                recommendList.updateView(data);
            } else {
                recommendList.hideList();
            }
        }
    };

    module.feature.recommend.list = {
// XXX: Hard-coded height
        listHeight: 138,
        elems: {
            recomResultSection: ".recom-section .recom-results-wrapper",
            recomResultTemplate: "#tmpl-recom-results",
            musicContainer: ".a-addable-music",
            playMusicBtn: ".play-music",
            addToPlayListBtn: ".add-to-playlist"
        },

        init: function () {
            var that = this;

            that.delegateTrigger();
        },

        updateView: function (resp) {
            var that = this;

            if (!resp) {
                return;
            }
            if (!that.template) {
                that.template =
                    _.template($(that.elems.recomResultTemplate).html());
            }
            that.resultEscape(resp);
            $(that.elems.recomResultSection).html(
                that.template(
                    {results: resp.slice(0, 3)}
                )
            );
        },

        resultEscape: function (resp) {
            var i;

            for (i = 0; i < resp.length; i += 1) {
                resp[i].title = module.escapes.title(resp[i].title);
            }
        },

        delegateTrigger: function () {
            var that = this;

            $(that.elems.recomResultSection).on(
                "click",
                that.elems.addToPlayListBtn,
                function () {
                    var self = this,
                        $musicContainer =
                            $(self).
                                parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        },
                        recommend = true,
                        playlist =
                            module.playlistManager.getCurrentPlaylist();

                    module.s.notifyManager.playlistChangeNotify(
                        playlist.add(new module.s.Music(musicData), true)
                    );

                    module.log(
                        "dropbeat",
                        "playlist/add-from-recom",
                        musicData
                    );
                }
            );

            $(that.elems.recomResultSection).on(
                "click",
                that.elems.playMusicBtn,
                function () {
                    var self = this,
                        $musicContainer =
                            $(self).
                                parents(that.elems.musicContainer),
                        musicData = {
                            id: $musicContainer.data("musicId"),
                            title: $musicContainer.data("musicTitle"),
                            type: $musicContainer.data("musicType")
                        };

                    module.s.musicQ.init();
                    module.playerManager.onMusicClicked(
                        new module.s.Music({
                            'id': musicData.id,
                            'title': musicData.title,
                            'type': musicData.type
                        })
                    );

                    module.log(
                        "dropbeat",
                        "playlist/play-from-recom",
                        musicData
                    );
                }
            );
        },

        showList: function () {
            var that = this,
                $dropbeatContents =
                    $('#dropbeat .contents'),
                headerSectionHeight =
                    $(".header-section").height() +
                    parseInt($(".header-section").css("paddingBottom"), 10) +
                    parseInt($(".header-section").css("paddingTop"), 10),
                footerSectionHeight =
                    that.listHeight,
                bodySectionHeight =
                    $dropbeatContents.height() -
                    headerSectionHeight -
                    footerSectionHeight;

            if (!that.isVisible()) {
                $(".footer-section").animate({
                    height: that.listHeight
                }, 200);
                $(".body-section").animate({
                    height: bodySectionHeight
                }, 200);
            }
        },

        hideList: function () {
            var that = this,
                $dropbeatContents =
                    $('#dropbeat .contents'),
                headerSectionHeight =
                    $(".header-section").height() +
                    parseInt($(".header-section").css("paddingBottom"), 10) +
                    parseInt($(".header-section").css("paddingTop"), 10),
                bodySectionHeight =
                    $dropbeatContents.height() - headerSectionHeight;

            if (that.isVisible()) {
                $(".footer-section").animate({
                    height: 0
                }, 200);
                $(".body-section").animate({
                    height: bodySectionHeight
                }, 200);
            }
        },

        isVisible: function () {
            return $(".footer-section").height() > 0;
        }
    };

    return module;
}(DROPBEAT));
