angular.module('angularAuthService', ['angular-flash.service', 'angular-flash.flash-alert-directive']).factory('AuthService', [
  '$http', 'Session', function($http, Session) {
    return {
      login: function(credentials) {
        return $http.post('/login', credentials).then(function(res) {
          return Session.create(res.id, res.userid, res.role);
        });
      },
      isAuthenticated: function() {
        return !!Session.userId;
      },
      isAuthorized: function(authorizedRoles) {
        var authRole;
        if (typeof authorizedRoles === 'string') {
          authorizedRoles = [authorizedRoles];
        }
        authRole = _.where(authorizedRoles, function(role) {
          var r;
          r = new RegExp(role);
          return Session.userRole.match(r);
        });
        return this.isAuthenticated() && authRole.length >= 1;
      }
    };
  }
]).factory('AuthInterceptor', [
  '$rootScope', '$q', 'AUTH_EVENTS', function($rootScope, $q, AUTH_EVENTS) {
    return {
      responseError: function(response) {
        if (response.status === 401) {
          $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, response);
        }
        if (response.status === 403) {
          $rootScope.$broadcast(AUTH_EVENTS.notAuthorized, response);
        }
        if (response.status === 419 || response.status === 440) {
          $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout, response);
        }
        return $q.reject(response);
      }
    };
  }
]).service('Session', function() {
  this.create = (function(_this) {
    return function(sessionId, userId, userRole) {
      _this.id = sessionId;
      _this.userId = userId;
      return _this.userRole = userRole;
    };
  })(this);
  this.destroy = (function(_this) {
    return function() {
      _this.id = null;
      _this.userId = null;
      return _this.userRole = null;
    };
  })(this);
  return this;
}).config([
  '$provide', function($provide) {
    return $provide.decorator('formDirective', function($delegate) {
      var directive;
      directive = $delegate[0];
      directive.compile = function() {
        return function(scope, element, attrs) {
          return element.unbind('submit').bind('submit', function(event) {
            event.preventDefault();
            element.find('input, textarea, select').trigger('input').trigger('change').trigger('keydown');
            return scope.$apply(attrs.ngSubmit);
          });
        };
      };
      return $delegate;
    });
  }
]);

