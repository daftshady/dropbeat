'use strict';

define([
  'jquery', 'handlebars', 'api',
], function ($, handlebars, api) {

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
  var that = this,
      elems = {
        menus: $('.account-menus'),
        tmplSignout: $('#tmpl-signout'),
        tmplSignin: $('#tmpl-signin'),
      },

  fillMenu = function () {
    var render;

    if (that.currentUser !== null) {
      render = handlebars.compile(elems.tmplSignout.html());

      elems.menus.html(render({email: that.currentUser.email}));
      elems.menus.find('.signout-btn').click(signout);
    } else {
      render = handlebars.compile(elems.tmplSignin.html());

      elems.menus.html(render());
      elems.menus.find('.signin-btn').click(signin);
      elems.menus.find('.signup-btn').click(signup);
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
    $.post(api.Router.getPath('signout')).always(function () {
      window.location.href = '/';
    });
  };

  this.currentUser = null;
  this.loginCallbacks = [];

  this.onLogin = function (callback) {
    if (this.currentUser === null) {
      this.loginCallbacks.push(callback);
    } else {
      callback();
    }
  };

  this.init = function () {
    $.get(api.Router.getPath('user'))
      .done(function (resp) {
        var key;
        if (resp.success) {
          that.currentUser = new User(resp.user);
          for (key in that.loginCallbacks) {
            if (that.loginCallbacks.hasOwnProperty(key)) {
              that.loginCallbacks[key]();
            }
          }
        }
      })
      .always(fillMenu);
  };
};

return new UserManager();

});
