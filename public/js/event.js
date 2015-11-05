"use strict";

var app = angular.module("app", []);

app.controller("simple", ['$scope', '$rootScope', '$http', '$sce',
function($scope, $rootScope, $http, $sce) {
  $rootScope.title = "Events";
  $scope.authUrl = "";
  $scope.secCode = "";
  $scope.events = [];
  $scope.edit = {}
  $scope.user = {}
  $scope.newEvent = {calendar: "", title: "", description: "", start: "", end: ""}
  $scope.trustAsResourceUrl = $sce.trustAsResourceUrl;

  $scope.getQueryVariable = function (variable) {
       // Sample from https://css-tricks.com/snippets/javascript/get-url-variables/
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(null);
  }

  $scope.jsonToStr = function(time) {
    return new Date(time).toString();
  }

  $scope.getEvents = function() {
    var url = '/api/event?';
    url = url + 'token=' + $scope.token;
    $http.get(url).
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.events = data;
        $scope.events.forEach(function(element) {
          element.start = element.start.replace('T' , ' ').replace('Z', ' ').replace(':00.000', '');
          element.end = element.end.replace('T' , ' ').replace('Z', ' ').replace(':00.000', '');
        });
        console.log(status);
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.saveEvent = function() {
    var url = '/api/event/';
    url = url + $scope.edit._id;
    url = url + '?token=' + $scope.token;
    $http.post(url, $scope.edit).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.edit = {};
        $('#edit').modal('hide');
        $scope.getEvents();
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.deleteEvent = function() {
    var url = '/api/event/';
    url = url + $scope.edit._id;
    url = url + '?token=' + $scope.token;
    $http.delete(url).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.edit = {};
        $('#edit').modal('hide');
        $scope.getEvents();
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.createEvent = function() {
    var url = '/api/event';
    url = url + '?token=' + $scope.token;
    $http.post(url, $scope.newEvent).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.newEvent = {};
        $('#new').modal('hide');
        $scope.getEvents();
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.getUser = function() {
    var url = '/api/user';
    url = url + '/' + $scope.token;
    $http.get(url).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.user = data;
        $scope.newEvent.calendar = $scope.user.calendars[0];
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.getSyncUrl = function() {
    var url = '/api/sync';
    url = url + '?token=' + $scope.token;
    $http.get(url).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        if ('tokens' in $scope.user){
          console.log("Token already exists");
        } else {
          $scope.authUrl = data.authUrl;
          $('#sync').modal('show');
        }
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.postSyncCode = function() {
    var url = '/api/sync';
    url = url + '?token=' + $scope.token;
    $http.post(url, {code: $scope.secCode}).
      success(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
        $scope.getEvents();
      }).
      error(function(data, status, headers, config) {
        console.log(data);
        console.log(status);
      });
  }

  $scope.openEdit = function(index) {
      $scope.edit = $scope.events[index];
      $('#edit').modal('show');
  }

  $scope.openAddNew = function() {
    $('#new').modal('show');
  }

  $scope.openSync = function() {
      $scope.getSyncUrl();
  }

  $scope.openGoogleAuth = function() {
    window.open($scope.trustAsResourceUrl($scope.authUrl),
                '_blank',
                'height=600, width=600, menubar=no, status=no');
  }



  $scope.token = $scope.getQueryVariable("token");
  //console.log($scope.token);
  $scope.getUser();
  //console.log($scope.user);
  $scope.getEvents();

}]);
