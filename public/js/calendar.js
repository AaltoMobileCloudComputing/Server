'use strict';

angular
  .module('demo', ['mwl.calendar', 'ui.bootstrap', 'ngTouch', 'ngAnimate'])
  .controller('MainCtrl', function ($scope, $http, $modal, moment) {

    var vm = this;

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

    //These variables MUST be set as a minimum for the calendar to work
    vm.calendarView = 'month';
    vm.calendarDay = new Date();
    vm.events = [];


    vm.eventClicked = function(event) {

    };

    vm.eventEdited = function(event) {

    };

    vm.eventDeleted = function(event) {

    };

    vm.eventTimesChanged = function(event) {

    };

    vm.toggle = function($event, field, event) {
      $event.preventDefault();
      $event.stopPropagation();
      event[field] = !event[field];
    };

    $scope.getEvents = function() {
      var url = '/api/event?';
      url = url + 'token=' + $scope.token;
      $http.get(url).
        success(function(data, status, headers, config) {
          console.log(data);
          $scope.events = data;
          $scope.events.forEach(function(element) {
            var temp = {
              title: element.title,
              type: 'info',
              startsAt: new Date(element.start),
              endsAt: new Date(element.end),
              draggable: false,
              resizable: false
            }
            vm.events.push(temp);
          });
          console.log(status);
        }).
        error(function(data, status, headers, config) {
          console.log(data);
          console.log(status);
        });
    }
    $scope.token = $scope.getQueryVariable("token");
    $scope.getEvents();

  });
