if(!window.dropbeat) window.dropbeat = window.dropbeat || {};

dropbeat.logApiAction = function(apiName, apiAction, param){
    if(!_gaq || !apiName || apiName == "" || !apiAction || apiAction == "") {
        return false;
    }
    var path = "/api-call/" + apiName + "/" + apiAction;
    if(param && typeof param == "object"){
        var q = "";
        $.each(param, function(key, value){
          q += q == "" ? "?" : "&";
          q += key + "=" + value;
        });
        path += q;
    }
    _gaq.push(["_trackPageview", path]);
    return true;
}

dropbeat.camelToDashed = function(camelString) {
  return camelString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

$(function(){
    $(document).on("click", ".drop-click-log", function(){
    var apiName = $(this).data("api-name");
    var apiAction = $(this).data("api-action");
    if (!apiName || apiName == "") {
        apiName = "dropbeat";
    }
    if (!apiAction || apiAction == "") {
        return;
    }
    var params = {};
    $.each($(this).data(), function(key, value){
        var dashKey = dropbeat.camelToDashed(key);
        if(dashKey == "api-name" || dashKey == "api-action") {
            return true;
        }
        var apiDataKeyMatch = dashKey.match("^api-(.+)");
        if(apiDataKeyMatch){
            params[apiDataKeyMatch[1]] = value;
        }
    });
    dropbeat.logApiAction(apiName, apiAction, params);
    });
});


