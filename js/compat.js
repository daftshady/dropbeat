// For cross browsing compatibility

function isSafari() {
    var chrome = navigator.userAgent.match(/(Chrome)/g);
    var firefox = navigator.userAgent.match(/(Firefox)/g);
    var safari = (navigator.userAgent.match(/(Safari)/g)) && !chrome;
    var ie = !chrome && !firefox && !safari;
    return safari;
};
