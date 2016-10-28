'use strict';

define([
  'jquery'
], function ($) {

/**
  * Defines modules for search features such as autocomplete, youtube & soundcloud
  * based music search
  *
  */

function AutoCompletor (driver) {
  // Search form
  this.searchBar = $('#search-input');

  // View which holds resulting autocompleted words
  this.wordList = $('#autocomplete-words');

  // Class which will be applied to suggested strings
  this.itemClass = 'autocomplete-items';

  // Used to clear word list when some string is removed completely so that input
  // field becomes empty.
  this.lastInputLen = 0;

  // Binds event listener which detects keyboard input to search bar.
  this.init = function () {
    var that = this;

    this.searchBar.keyup(function (event) {
      var query = $(this).val();

      if (that.lastInputLen > 0 && query.length === 0) {
        // Clear items as existing string has been removed
        that.clearItems();
      }

      if (query.length > 0) {
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
      } else {
        that.lastInputLen = 0;
      }
    });
  };

  this.clearItems = function () {
    $('.' + this.itemClass).remove();
  };
};

function YoutubeDriver () {
  this.baseUrl = 'https://clients1.google.com/complete/search';

  // Send HTTP request to get autocompletion result.
  this.fetch = function (query, successCb) {
    var that = this;

    $.ajax({
      url: this.baseUrl,
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
  this.autoCompletor = new AutoCompletor(new YoutubeDriver());


};


return new SearchManager();

});
