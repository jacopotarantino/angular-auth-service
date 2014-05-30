angular.module('angularAuthService', [
  'angular-flash.service'
  'angular-flash.flash-alert-directive'
])

.factory('AuthService', ['$http', 'Session', ($http, Session) ->
  login: (credentials) ->
    #TODO real login post and save session.
    $http
      .post('/login', credentials)
      .then (res) ->
        Session.create(res.id, res.userid, res.role)

  isAuthenticated: ->
    return !!Session.userId

  isAuthorized: (authorizedRoles) ->
    if typeof(authorizedRoles) is 'string'
      authorizedRoles = [authorizedRoles]

    authRole = _.where authorizedRoles, (role) ->
      r = new RegExp(role)
      return Session.userRole.match(r)

    return @isAuthenticated() and authRole.length >= 1
])

.factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH_EVENTS', ($rootScope, $q, AUTH_EVENTS) ->
  responseError: (response) ->
    if response.status is 401
      $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, response)
    if response.status is 403
      $rootScope.$broadcast(AUTH_EVENTS.notAuthorized, response)
    if response.status is 419 or response.status is 440
      $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout, response)
    return $q.reject response
])

.service('Session', ->
  @create = (sessionId, userId, userRole) =>
    @id = sessionId
    @userId = userId
    @userRole = userRole

  @destroy = =>
    @id = null
    @userId = null
    @userRole = null

  return this
)

.config(['$provide', ($provide) ->
  $provide.decorator 'formDirective', ($delegate) ->
    directive = $delegate[0]
    directive.compile = ->
      (scope, element, attrs) ->
        element
          .unbind('submit')
          .bind 'submit', (event) ->
            event.preventDefault()
            element
              .find('input, textarea, select')
              .trigger('input')
              .trigger('change')
              .trigger('keydown')
            scope.$apply(attrs.ngSubmit)

    return $delegate
])

