'use strict';

define([
  'jquery', 'handlebars', 'api',
  'playermanager', 'playlistmanager',
  'track', 'auth'
], function ($, hb, api,
             playerManager, playlistManager,
             Track, auth) {

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

  // Word in wordlist can be selected by pressing arrow up/down button.
  // XXX: Actual item starts with 1 because 0 is `autocomplete-bg`
  // We should move it to another level as it's so confusing to include non-item in
  // `autocomplete-items`.
  this.selectedIdx = 0;

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
        for (i = 0; i < parsedResult.length; i += 1) {
          $('<ul />', {
            class: that.itemClass,
            text: parsedResult[i]
          }).appendTo(that.wordList);

          if (i === maxResult) {
            break;
          }
        }

        that.resetSelectedIdx();
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

  // Select next, prev words.
  this.selectNext = function () {
    if (this.selectedIdx < this.wordList.children().length - 1) {
      this.clearSelectedItem(this.selectedIdx);
      this.selectedIdx += 1;
      this.selectTo(this.selectedIdx);
    }
  };

  this.selectPrev = function () {
    if (this.selectedIdx > 1) {
      this.clearSelectedItem(this.selectedIdx);
      this.selectedIdx--;
      this.selectTo(this.selectedIdx);
    }
  };

  this.clearSelectedItem = function () {
    // This method is used to clear style of previously selected item without
    // updating `selectedIdx`.
    var children = this.wordList.children();
    for (var i = 0; i < children.length; i += 1) {
      $(children[i]).removeClass('autocomplete-items-selected');
    }
  }

  this.selectTo = function (idx) {
    var item = this.wordList.children()[idx];
    $(item).addClass('autocomplete-items-selected');

    // If this method is called from selectNext, selectPrev,
    // `selectedIdx` will be updated twice with the same value.
    // While it may seem to be buggy, this ensures that `selectedIdx` is updated
    // correctly even if this method is called outside context.
    this.selectedIdx = idx;
  }

  this.selectFirst = function () {
    this.selectTo(1);
  }

  this.getSelectedText = function () {
    return $(this.wordList.children()[this.selectedIdx]).text();
  }

  this.resetSelectedIdx = function () {
    this.selectedIdx = 0;
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
    for (i = 0; i < words.length; i += 1) {
      parsed.push(words[i][0]);
    }
    return parsed;
  };
};

function SearchManager () {
  this.searchBar = $('#search-input');

  this.searchResultSection = $('.search-result-section');

  this.autoCompletor = new AutoCompletor(this.searchBar, new YoutubeDriver());

  this.init = function () {
    // Bind events to search bar.
    var that = this, searchBar = $('#search-input');

    searchBar.keydown(function (e) {
      // For arrow up/down, we ignore default behavior in text field
      // (move cursor to front/back of the text) by calling `preventDefault`.
      if (e.which === 38 || e.which === 40) {
        e.preventDefault();
      }
    });

    searchBar.keyup(function (e) {
      var query = $(this).val();

      if (e.which === 13) {
        // keycode for `enter`
        that.autoCompletor.hideWordList();

        // If selected autocompletion item exists, we it as a search query.
        var selectedText = that.autoCompletor.getSelectedText();
        if (selectedText.length !== 0) {
          query = selectedText;

          // Change value in search input also.
          that.searchBar.val(query);
        }

        that.search(query);
      } else if (e.which === 38) {
        // keycode for arrow up.
        that.autoCompletor.selectPrev();
      } else if (e.which === 40) {
        // keycode for arrow down.
        that.autoCompletor.selectNext();
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

    that.showSpinner();
    that.searching = true;

    $.ajax({
      url: api.Router.getPath('searchAsync'),
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify({q: query}),
      contentType: 'application/json; charset=utf-8',
      success: function (keyResp) {
        var curPoll = 0, maxPoll = 10, pollIntervalMillis = 500;

        // We've got the key. Let's start polling.
        function clearPoller(poller) {
          clearInterval(poller);
          that.searching = false;
          that.hideSpinner();
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
        }, pollIntervalMillis);
      },
      error: function (keyResp) {
        that.searching = false;
      }
    });
  };

  this.updateView = function (data) {
    var template = hb.compile($('#search-result-template').html()),
        items = {searchResults: data, authorized: auth.currentUser !== null},
        renderedHtml = template(items),
        clickable = ['.item-title', '.item-thumbnail'],
        container = this.searchResultSection;

    // Event which will be fired when search result item is clicked.
    function onItemClicked (item) {
      var uid = item.attr('data-uid'),
          title = item.find('.item-title').text();

      // Play music. Other platforms except for youtube are not implemented yet.
      playerManager.play(new Track(uid, title, api.playerTypes.youtube));
    }

    // Render search result and attach click listeners.
    container.html(renderedHtml);
    for (var i = 0; i < clickable.length; i += 1) {
      container.find(clickable[i]).click(function () {
        var itemWrapper = $(this).closest('.item-wrapper');
        onItemClicked(itemWrapper);
      });
    }

    container.find('.add-button').click(function () {
      var itemWrapper = $(this).closest('.item-wrapper'),
          uid = itemWrapper.attr('data-uid'),
          name = itemWrapper.find('.item-title').text(),
          source = itemWrapper.attr('data-source') || api.playerTypes.youtube,
          track = new Track(uid, name, source);

      playlistManager.addNewTrack(track);
    });
  };

  this.searching = false;

  this.showSpinner = function () {
    this.searchResultSection.addClass('spinner');
  };

  this.hideSpinner = function () {
    this.searchResultSection.removeClass('spinner');
  }
};


return new SearchManager();

});
