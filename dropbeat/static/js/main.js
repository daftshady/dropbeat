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
  'require', 'domReady'

], function (require, domReady) {
  domReady(function () {
    require(['dropbeat'], function (Dropbeat) {
      Dropbeat.init()
    })
  });
});

// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady () {
  require(['player'], function (player) {
    player.YoutubePlayer.init();
  });
};
