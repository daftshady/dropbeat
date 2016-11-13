'use strict';

define([
  'css!../css/toastr.min', 'toastr'
],
function (_, toastr) {
var notification = function () {
  var MESSAGE = {
    onTrackAdded: 'Track is added to playlist',
    onTrackRemoved: 'Track is removed from playlist'
  };

  toastr.options = {
    'closeButton': false,
    'debug': false,
    'newestOnTop': false,
    'progressBar': false,
    'positionClass': 'toast-top-right',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': '5000',
    'extendedTimeOut': '1000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
  };

  return {
    onTrackAdded: function () {
      toastr.success(MESSAGE.onTrackAdded);
    },
    onTrackRemoved: function () {
      toastr.success(MESSAGE.onTrackRemoved);
    }
  };
}();

return notification;

});
