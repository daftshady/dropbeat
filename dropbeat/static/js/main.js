'use strict';

require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery-3.1.1.min'
  }

});

require([
  'dropbeat',

], function (Dropbeat) {
  Dropbeat.initialize();
});

// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady () {
  require(['player'], function (players) {
    players.YoutubePlayer.init();
  });
};
