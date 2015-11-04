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
    vm.events = [
      {
        title: 'An event',
        type: 'warning',
        startsAt: moment().startOf('week').subtract(2, 'days').add(8, 'hours').toDate(),
        endsAt: moment().startOf('week').add(1, 'week').add(9, 'hours').toDate(),
        draggable: true,
        resizable: true
      }, {
        title: '<i class="glyphicon glyphicon-asterisk"></i> <span class="text-primary">Another event</span>, with a <i>html</i> title',
        type: 'info',
        startsAt: moment().subtract(1, 'day').toDate(),
        endsAt: moment().add(5, 'days').toDate(),
        draggable: true,
        resizable: true
      }, {
        title: 'This is a really long event title that occurs on every year',
        type: 'important',
        startsAt: moment().startOf('day').add(7, 'hours').toDate(),
        endsAt: moment().startOf('day').add(19, 'hours').toDate(),
        recursOn: 'year',
        draggable: true,
        resizable: true
      }
    ];
    vm.events = [];

    /*
     var currentYear = moment().year();
     var currentMonth = moment().month();

    function random(min, max) {
      return Math.floor((Math.random() * max) + min);
    }

    for (var i = 0; i < 1000; i++) {
      var start = new Date(currentYear,random(0, 11),random(1, 28),random(0, 24),random(0, 59));
     vm.events.push({
        title: 'Event ' + i,
        type: 'warning',
        startsAt: start,
        endsAt: moment(start).add(2, 'hours').toDate()
      })
    }*/

    function showModal(action, event) {
      $modal.open({
        templateUrl: 'modalContent.html',
        controller: function() {
          var vm = this;
          vm.action = action;
          vm.event = event;
        },
        controllerAs: 'vm'
      });
    }

    vm.eventClicked = function(event) {
      showModal('Clicked', event);
    };

    vm.eventEdited = function(event) {
      showModal('Edited', event);
    };

    vm.eventDeleted = function(event) {
      showModal('Deleted', event);
      console.log(event.$id);
      vm.events.splice(event.$id, 1);
    };

    vm.eventTimesChanged = function(event) {
      showModal('Dropped or resized', event);
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
            //element.start = element.start.replace('T' , ' ').replace('Z', ' ').replace(':00.000', '');
            //element.end = element.end.replace('T' , ' ').replace('Z', ' ').replace(':00.000', '');
            var temp = {
              title: element.title,
              type: 'info',
              startsAt: new Date(element.start),
              endsAt: new Date(element.end),
              draggable: true,
              resizable: true
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
