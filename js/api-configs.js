// Base config
var debug = true;
if (!debug) {
    var SCHEME = "http";
    var BASE_API_HOST = "54.250.195.24:8000";
    var URI = "/dropbeat/api/";
    var VERSION = "v1"
    var API_URL = SCHEME + "://" + BASE_API_HOST + URI + VERSION + "/";
} else {
    var SCHEME = "http";
    var BASE_API_HOST = "127.0.0.1:8100";
    var URI = "/dropbeat/api/";
    var VERSION = "v1"
    var API_URL = SCHEME + "://" + BASE_API_HOST + URI + VERSION + "/";
}

// Api bindings
var API_SEARCH_URL = API_URL + "search" + "/";
var API_RECOM_URL = API_URL + "recom" + "/";
var API_PLAYLIST_URL = API_URL + "playlist" + "/";
var API_RESOLVE_URL = API_URL + "resolve" + "/";
