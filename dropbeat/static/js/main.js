'use strict';

require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery-3.1.1.min',
    handlebars: 'lib/handlebars-4.0.5'
  }

});

require([
  'dropbeat', 'jquery'

], function (Dropbeat, $) {
  $(document).ready(Dropbeat.initialize);
});

// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady () {
  require(['player'], function (players) {
    players.YoutubePlayer.init();
  });
};
