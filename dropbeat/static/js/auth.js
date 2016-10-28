'use strict';

define([
  'jquery', 'handlebars'
], function ($, handlebars) {

var URI_USER = '/api/v1/user',
    URI_SIGNIN = '/api/v1/user/signin',
    URI_SIGNOUT = '/api/v1/user/signout';

/**
 * User model.
 */

function User (params) {
  this.email = params.email;
};

/**
 * User identification for interacting with server.
 */

function UserManager () {
  var menus = $('.account-menus'),
      tmplSignout, tmplSignin,

  fillMenu = function () {
    if (this.currentUser != null) {
      var render = handlebars.compile(tmplSignout);

      menus.html(render({email: this.currentUser.email}));
      menus.find('.signout-btn').click(signout);
    } else {
      menus.html(tmplSignin);
      menus.find('.signin-btn').click(signin);
      menus.find('.signup-btn').click(signup);
    }
  },

  // Function signin and signup just open dialog (DO NOT sign in/up really).
  signin = function () {
    var container = $('#dropbeat').find('.signin-container').show(),
        form = container.find('.signin').show();

    form.find('.cancel')
      .click(function () {
        container.hide();
        form.hide();
        // NOTE Click listener of cancel button is removed
        // or multiple-call is invoked.
        $(this).off('click');
      });
  },

  signup = function () {
    var container = $('#dropbeat').find('.signin-container').show(),
        form = container.find('.signup').show();

    form.find('.cancel')
      .click(function () {
        container.hide();
        form.hide();
        $(this).off('click');
      });
  },

  signout = function () {
    $.post(URI_SIGNOUT).always(function () {
      window.location.href = '/';
    });
  };

  this.currentUser = null;

  this.init = function () {
    tmplSignout = $('#tmpl-signout').html();
    // NOTE Because sign in template do not need a context,
    // compiled html is generated previously for performance. (slightly better)
    tmplSignin = handlebars.compile($('#tmpl-signin').html())();

    $.get(URI_USER)
      .done(function (resp) {
        if (resp.success) {
          this.currentUser = new User(resp.user);
        }
      })
      .always(fillMenu);
  };
};

return new UserManager();

});
