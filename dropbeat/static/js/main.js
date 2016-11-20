'use strict';

require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery-3.1.1.min',
    handlebars: 'lib/handlebars-4.0.5',
    domReady: 'lib/domReady',
    toastr: 'lib/toastr.min'
  },
  map: {
    '*': {
      'css': 'lib/css.min'
    }
  }
});


require([
  'jquery', 'domReady'
], function ($, domReady) {
  domReady(function () {
    // Youtube iframe api should be loaded dynamically after dom is loaded.
    $.getScript('//www.youtube.com/iframe_api');
  });
});


// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady () {
  require(['dropbeat'], function (Dropbeat) {
    Dropbeat.init()
  })
};
