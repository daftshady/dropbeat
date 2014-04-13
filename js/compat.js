// For cross browsing compatibility

function isSafari() {
    var chrome = navigator.userAgent.match(/(Chrome)/g) != null;
    var firefox = navigator.userAgent.match(/(Firefox)/g) != null;
    var safari = (navigator.userAgent.match(/(Safari)/g) != null) && !chrome;
    var ie = !chrome && !firefox && !safari;
    return safari;
};

function isNewIE() {
    return navigator.userAgent.match(/(11.0)/g) != null ||
        navigator.userAgent.match(/(MSIE 10.0)/g) != null;
};
