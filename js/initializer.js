var youtubeApiReady = false;
var soundManagerReady = false;
var playerManager = null;
var playlistManager = null;
var musicQ = null;
var dropbeatReady = false;
var countryCode = null;
var fullHost = window.location.protocol + '//' +  window.location.host;
var notifyReady = false;
var onSharedList = keyFromUri() != false;

// XXX: Immediate sync of playlist can affect performance
// after server-sync is implemented.
// (too many direct server request may occur)
var syncImmediately = true;

$(document).ready(function() {
    if (typeof window.orientation !== 'undefined') {
        $("body").hide();
        alert('We do not support mobile device yet.');
    }

    musicQ = new MusicQueue();
    musicQ.init();
    PlaylistTabs.init();
    ViewControl.init();
    PlayerControl.init();
    Progress.init();
    playerManager = new PlayerManager();
    playerManager.init();
    playlistManager = new PlaylistManager();
    playlistManager.init();

    SearchBox.init();
    SearchList.init();
    RecomList.init();

    PlaylistControl.init();
    UrlAdder.init();

    // Add playlist sync listener.
    $(window).unload(function() {
        playlistManager.getCurrentPlaylist().sync();
    });

    // Caches country code
    LocationManager.getCountry(function(code) {
        countryCode = code;
        onNotifyReady();
    });

    // Make logo clickable
    $('#logo').click(function() {
        location.href = fullHost;
    });
});

function onYouTubeIframeAPIReady() {
    youtubeApiReady = true;
}
