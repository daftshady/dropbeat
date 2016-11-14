'use strict';

define([
  'css!../css/toastr.min', 'toastr'
],
function (_, toastr) {
var notification = function () {
  var MESSAGE = {
    onTrackAdded: 'Track is added to playlist',
    onTrackRemoved: 'Track is removed from playlist',
    signinRequired: 'You should sign in',
    incorrectPassword: 'Password is incorrect',
    emailNotExist: 'Email does not exist',
    emailExist: 'Same email exists',
    invalidEmail: 'Email is not valid format',
    shortPassword: 'Password is too short (at least 8 chars)',
    duplicatedPlaylistName: 'Playlist name cannot be duplicated',
    trackExists: 'Track is already added to playlist',
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
    },
    signinRequired: function () {
      toastr.error(MESSAGE.signinRequired);
    },
    incorrectPassword: function () {
      toastr.error(MESSAGE.incorrectPassword);
    },
    emailNotExist: function () {
      toastr.error(MESSAGE.emailNotExist);
    },
    emailExist: function () {
      toastr.error(MESSAGE.emailExist);
    },
    invalidEmail: function () {
      toastr.error(MESSAGE.invalidEmail);
    },
    shortPassword: function () {
      toastr.error(MESSAGE.shortPassword);
    },
    duplicatedPlaylistName: function () {
      toastr.error(MESSAGE.duplicatedPlaylistName);
    },
    trackExists: function () {
      toastr.warning(MESSAGE.trackExists);
    }
  };
}();

return notification;

});
