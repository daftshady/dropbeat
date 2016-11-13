'use strict';

define([
  'jquery'
], function ($) {

/**
 * View helpers which are responsible for browser compat, button event bindings.
 */

return {
  init: function () {
    // Event for main dropbeat logo.
    $('.ic-logo').click(function () {
      window.location.href = '/';
    });
  }
};

});
