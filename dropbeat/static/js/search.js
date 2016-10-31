'use strict';

define([
  'jquery', 'handlebars', 'api', 'playermanager'
], function ($, hb, api, playerManager) {

/**
  * Defines modules for search features such as autocomplete, youtube & soundcloud
  * based music search
  *
  */

function AutoCompletor (searchBar, driver) {
  // Search form
  this.searchBar = searchBar;

  // View which holds resulting autocompleted words
  this.wordList = $('#autocomplete-words');

  // Class which will be applied to suggested strings
  this.itemClass = 'autocomplete-items';

  // Used to clear word list when some string is removed completely so that input
  // field becomes empty.
  this.lastInputLen = 0;

  this.handleKeyEvent = function (query, event) {
    var that = this;

    if (that.lastInputLen > 0 && query.length === 0) {
      // Clear items as existing string has been removed
      that.clearItems();
    }

    if (query.length > 0 && that.lastInputLen !== query.length) {
      // In case that word list is hidden bacause of search result.
      that.showWordList();

      // If there is a change in query string
      driver.fetch(query, function (parsedResult) {
        // `parsedResult` should be a list of suggested strings.
        var i, maxResult = 10;

        that.clearItems();

        // Update view with the result
        for (i = 0; i < parsedResult.length; i++) {
          $('<ul />', {
            class: that.itemClass,
            text: parsedResult[i]
          }).appendTo(that.wordList);

          if (i === maxResult) {
            break;
          }
        }

        that.lastInputLen = query.length;
      });
    } else if (query.length === 0) {
      that.lastInputLen = 0;
    }
  };

  this.clearItems = function () {
    $('.' + this.itemClass).remove();
  };

  this.showWordList = function () {
    this.wordList.show();
  };

  this.hideWordList = function () {
    this.wordList.hide();
  };
};

function YoutubeDriver () {
  this.baseUrl = 'https://clients1.google.com/complete/search';

  // Send HTTP request to get autocompletion result.
  this.fetch = function (query, successCb) {
    var that = this;

    $.ajax({
      url: that.baseUrl,
      type: 'GET',
      dataType: 'jsonp',
      data: {client: 'youtube', q: query},
      success: function (resp) {
        successCb(that.parseResp(resp));
      }
    });
  };

  // Parse jsonp result from youtube search api
  this.parseResp = function (rawResp) {
    var words = rawResp[1], parsed = [], i;
    for (i = 0; i < words.length; i++) {
      parsed.push(words[i][0]);
    }
    return parsed;
  };
};

function SearchManager () {
  this.searchBar = $('#search-input');

  this.autoCompletor = new AutoCompletor(this.searchBar, new YoutubeDriver());

  this.init = function () {
    // Bind events to search bar.
    var that = this, searchBar = $('#search-input');

    searchBar.keyup(function (e) {
      var query = $(this).val();

      // 13 is keycode for `enter`
      if (e.which === 13) {
        that.autoCompletor.hideWordList();
        that.search(query);
      } else {
        that.autoCompletor.handleKeyEvent(query, e);
      }
    });
  };

  this.search = function (query) {
    var that = this;
    // send request to execute search asynchronously
    if (that.searching) {
      // If a user press enter again while waiting for search result.
      return;
    }

    that.searching = true;
    $.ajax({
      url: api.Router.getPath('searchAsync'),
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify({q: query}),
      contentType: 'application/json; charset=utf-8',
      success: function (keyResp) {
        var curPoll = 0, maxPoll = 10;

        // We've got the key. Let's start polling.
        function clearPoller(poller) {
          clearInterval(poller);
          that.searching = false;
        }

        var poller = setInterval(function () {
          $.ajax({
            url: api.Router.getPath('searchAsync'),
            type: 'GET',
            dataType: 'json',
            data: {key: keyResp.data},
            success: function (resp) {
              if (resp.success) {
                clearPoller(poller);

                // Update search result view.
                that.updateView(resp.data);
              } else {
                // TODO: Check error code.
                if (curPoll < maxPoll) {
                  curPoll += 1;
                } else {
                  // Timeout expired.
                  clearPoller(poller);
                }
              }
            },
            error: function () {
              clearPoller(poller);
            }
          });
        }, 500);
      },
      error: function (keyResp) {
        that.searching = false;
      }
    });
  };

  this.updateView = function (data) {
    var template = hb.compile($('#search-result-template').html()),
        items = {searchResults: data},
        renderedHtml = template(items),
        clickable = '.item-wrapper',
        container = $('.search-result-section');

    // Render search result
    container.html(renderedHtml);
    container.find(clickable).click(function () {
      var uid = $(this).attr('data-uid'),
          title = $(this).find('.item-title').text();

      if (uid.length !== 11) {
        throw 'Invalid track id.';
      }

      playerManager.play({
        type: 'youtube',
        id: uid,
        title: title
      });
    })
  };

  this.searching = false;
};


return new SearchManager();

});
