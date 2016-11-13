'use strict';

define([
  'jquery', 'handlebars', 'api', 'playlistmanager'
], function ($, handlebars, api, playlistManager) {

/**
 * User model.
 */

function User (email) {
  this.email = email;
};

/**
 * Authentication related modules.
 */

function Authenticator (view) {
  this.authView = view;

  this.currentUser = null;

  this.init = function () {
    this.authView.init();
    this.tryAuth();
  };

  // Send auth request to see if a user has a valid session.
  this.tryAuth = function () {
    var that = this;

    $.get(api.Router.getPath('user')).always(function (resp) {
      that.authMiddleware(resp, false);
    });
  };

  // Send signin request with email, password
  // Code duplication occurs between `signin` and `signup`.
  // 1. We should wrap ajax json request so that we can remove code dups
  // in contentType, stringify, etc.
  // 2. In signup, more information as well as email, password will be needed
  // unlike signin.
  // Let's leave it as it is for a while.
  this.signin = function (email, password) {
    var that = this;

    $.ajax({
      url: api.Router.getPath('signin'),
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify({email: email, password: password}),
      contentType: 'application/json; charset=utf-8',
      success: function (resp) {
        that.authMiddleware(resp, true);
      }
    });
  };

  this.signup = function (email, password) {
    var that = this;

    $.ajax({
      url: api.Router.getPath('user'),
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify({email: email, password: password}),
      contentType: 'application/json; charset=utf-8',
      success: function (resp) {
        that.authMiddleware(resp, true);
      }
    });
  };

  // Returns boolean indicating success of authentication.
  // This method is called from callback of both signin and signup.
  this.authMiddleware = function (resp, handleError) {
    // If resp code is 401, resp has no `success` key.
    // But regardless of it, truthy check goes to false in that case.
    if (resp.success) {
      // Authentication success.
      this.currentUser = new User(resp.user.email);
      this.authView.onAuthSuccess();
    } else {
      // TODO: Check error code to show error message to user.
      this.authView.onAuthFailure();

      if (handleError) {
        switch(resp.error) {
          case api.ErrorCodes.invalidEmail:
            break;
          case api.ErrorCodes.duplicatedEmail:
            break;
          case api.ErrorCodes.passwordTooShort:
            break;
          case api.ErrorCodes.emailNotExist:
            break;
          case api.ErrorCodes.passwordMismatch:
            break;
          default:
            // Unexpected error code.
            break;
        }
      }
    }
    return resp.success;
  };

  function AuthView (authenticator) {
    // This view manages signin/up/out buttons by attaching event listeners.
    // Two different button group exists depending on the existence of user session.

    // This elem contains signup, signin buttons.
    this.buttonWrapper = $('.account-menus');

    this.tmplSignin = $('#tmpl-signin');

    this.tmplSignout = $('#tmpl-signout');

    this.init = function () {
      var container = $('.auth-container'),
          signinView = container.find('.signin'),
          signupView = container.find('.signup');

      // Bind button events.
      signinView.find('.signin-submit-btn').click(function () {
        var wrap = $(this).closest('.form-wrapper'),
            email = wrap.find('input[name="email"]').val(),
            password = wrap.find('input[name="password"]').val();

        authenticator.signin(email, password);
      });

      signinView.find('.cancel-btn').click(function () {
        container.hide();
        signinView.hide();
      });

      signupView.find('.signup-submit-btn').click(function () {
        var wrap = $(this).closest('.form-wrapper'),
            email = wrap.find('input[name="email"]').val(),
            password = wrap.find('input[name="password"]').val();

        authenticator.signup(email, password);
      });

      signupView.find('.cancel-btn').click(function () {
        container.hide();
        signupView.hide();
      });
    };

    this.onAuthSuccess = function () {
      // Hide existing signin/signup views.
      // Hide both views together as we don't know what caused this callback.
      var container = $('.auth-container').hide();

      // If a user has been authenticated, show signout button only.
      var render = handlebars.compile(this.tmplSignout.html());
      this.buttonWrapper.html(render({email: authenticator.currentUser.email}));

      this.buttonWrapper.find('.signout-btn').off('click').click(function () {
        $.post(api.Router.getPath('signout')).always(function () {
          window.location.href = '/';
        });
      });

      playlistManager.loadAllPlaylists();
    };

    this.onAuthFailure = function () {
      // We should show signup/signin button again as signin has failed.
      var render = handlebars.compile(this.tmplSignin.html()),
          container = $('.auth-container'),
          signinView = container.find('.signin'),
          signupView = container.find('.signup');

      this.buttonWrapper.html(render());

      this.buttonWrapper.find('.signin-btn').off('click').click(function () {
        var container = $('.auth-container').show();
        // Show signin popup.
        container.find('.signin').show();
      });
      this.buttonWrapper.find('.signup-btn').off('click').click(function () {
        var container = $('.auth-container').show();
        // Show signup popup.
        container.find('.signup').show();
      });
    };
  };

  this.authView = new AuthView(this);
};

return new Authenticator();

});
