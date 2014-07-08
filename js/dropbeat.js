/*jslint browser: true*/
/*jslint nomen: true*/
/*global $, _gaq*/

// Dropbeat

// Copyright (c) 2014 Park Il Su

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


var DROPBEAT = (function () {
    'use strict';

    var dropbeat = {},
// XXX: NOTE that this `DROPBEAT` module always uses `that` at the start of the
// every funtion which uses `this` in other not to lose reference of its context.
// For the code consistency, every function which uses `this` defines
// `var that = this` statement even if it is one-line function.
// Although it may seem to be strange and unnecessary, readability and
// defensive-code are more important than deceasing code line.
        that = dropbeat;

    that.shortcuts = function () {
        that.s = {
// This object provides alias for deep-depth module reference.
// All properties defined in this object should access that long references
// in one depth.
// XXX: NOTE that only `playerManager` and `playlistManager` can be accessed
// directly from `DROPBEAT`.
            Music: that.music.Music,
            musicQ: that.music.musicQueue,
            Playlist: that.playlist.Playlist,
            viewControl: that.view,
            searchBox: that.feature.search.box,
            searchList: that.feature.search.list,
            recommendBox: that.feature.recommend.box,
            recommendList: that.feature.recommend.list,
            playerControl: that.player.control,
            playerButton: that.player.control.button,
            playerMessage: that.player.control.message,
            playerBase: that.player.control.base,
            repeatState: that.player.control.repeat.state,
            repeatSequence: that.player.control.repeat.sequence,
            repeatControl: that.player.control.repeat.control,
            shuffleState: that.player.control.shuffle.state,
            shuffleControl: that.player.control.shuffle.control,
            progress: that.player.control.progress,
            playlistTabs: that.playlist.control.tabs,
            playlistBase: that.playlist.control.base,
            boldTitle: that.playlist.boldTitle,
            unboldTitle: that.playlist.unboldTitle,
            localStorage: that.storage.localStorage,
            searchContext: that.feature.search.context,
            urlAdder: that.feature.urlAdder,
            notifyMessage: that.notification.message,
            notifyManager: that.notification.manager
        };
    };

    that.initialize = function () {
// This `initialize` method should be called after `DOM` is loaded
        that.shortcuts();

        if (typeof window.orientation !== 'undefined') {
// Dropbeat is `web` music player. Mobile device is not supported.
            $("body").hide();
            return;
        }

        that.playerManager.init();
        that.playlistManager.init();
        that.s.musicQ.init();
        that.s.playlistTabs.init();
        that.s.playlistBase.init();
        that.s.viewControl.init();
        that.s.playerControl.init();
        that.s.progress.init();
        that.s.searchBox.init();
        that.s.searchList.init();
        that.s.recommendList.init();
        that.s.urlAdder.init();

        $(window).unload(function () {
// Dropbeat syncs current playlist on localStorage in HTML5
// when the window is unloaded.
            that.playlistManager.getCurrentPlaylist().sync();
        });

        $('#logo').click(function () {
            location.href = that.host;
        });

        $('#github').click(function () {
            window.open('https://github.com/daftshady/dropbeat');
        });
    };

    that.state = {
        youtubeApiReady: false,
        soundManagerReady: false,
        dropbeatReady: false
    };

    that.api = (function () {
        var scheme = 'http',
            baseApiHost = 'api.dropbeat.net',
            uri = '/dropbeat/api/',
            version = 'v1',
            url = scheme + '://' + baseApiHost + uri + version + '/';

        function endpoint(name) {
            return url + name + '/';
        }
        return {
            searchUrl: endpoint('search'),
            recommendUrl: endpoint('recom'),
            playlistUrl: endpoint('playlist'),
            initialPlaylistUrl: endpoint('playlist/initial'),
            resolveUrl: endpoint('resolve'),
            playlistAutogenUrl: endpoint('generate')
        };
    }());

    that.compatibility = (function () {
        var navigator = window.navigator,
            chrome = navigator.userAgent.match(/(Chrome)/g),
            firefox = navigator.userAgent.match(/(Firefox)/g),
            safari = (navigator.userAgent.match(/(Safari)/g)) && !chrome,
            ie = !chrome && !firefox && !safari;

        return {
            isExplorer: ie,
            isSafari: safari
        };
    }());

    that.escapes = (function () {
        return {
            title: function (title) {
                return title.replace(/"/g, "'");
            }
        };
    }());

    that.constants = {
        shareUriKey: '?playlist=',
        autogenUriKey: '?artist=',
        queueEOL: 'stop'
    };

    that.host = window.location.protocol + '//' +  window.location.host;

    that.log = function (apiName, apiAction, param) {
        var path = "/api-call/" + apiName + "/" + apiAction,
            query = '';

        if (param) {
            $.each(param, function (key, value) {
                query += query === "" ? "?" : "&";
                query += key + "=" + value;
            });
            path += query;
        }
        _gaq.push(["_trackPageview", path]);
        return true;
    };

    return dropbeat;
}());

$(document).ready(function () {
    'use strict';
    DROPBEAT.initialize();
});

function onYouTubeIframeAPIReady() {
    'use strict';
    DROPBEAT.state.youtubeApiReady = true;
}
