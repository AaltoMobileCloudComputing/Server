"use strict";

var app = angular.module("app", []);

app.controller("simple", ['$scope', '$rootScope', '$http',
function($scope, $rootScope, $http) {
  $rootScope.title = "Log in";
  $scope.credentials = {username: '', password: ''};
  $scope.newuser = {username: '', firstname: '', lastname: '', email: '', password: ''};

  $scope.login = function() {
    var url = '/api/user?';
    url = url + 'username=' + $scope.credentials.username +
                '&password=' + $scope.credentials.password;
    $http.get(url).
      success(function(data, status, headers, config) {
        console.log(data.token);
        console.log(status);
        $scope.toCalendar(data.token);
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.createNewUser = function() {
    var url = '/api/user';
    $http.post(url, $scope.newuser).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.createCalendar(data.token, data.username, $scope.toCalendar);
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.createCalendar = function(token, username, callback) {
    var url = '/api/calendar?token=' + token;
    var cal = {title: username, description: '', };
    $http.post(url, cal).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        callback(token);
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.toCalendar = function(token) {
    window.location.replace('/calendar?token=' +  token);
  }

}]);
