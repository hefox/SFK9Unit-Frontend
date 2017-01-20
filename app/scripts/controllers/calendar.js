'use strict';

/**
 * @ngdoc function
 * @name sfk9App.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sfk9App
 */
angular.module('sfk9App')
  .controller('CalendarCtrl', function (k9ApiEvents, $scope) {
    $scope.eventSources = [];
    $scope.showEvents = {};
    k9ApiEvents.get().then(function(events) {
      $scope.events = {};
      $scope.events['SF K9 Unit Events'] = {
         color: '#C00A09',
         textColor: 'white',
         events: []
      };
      $scope.events['Community Events'] = {
         color: '#3d6b99',
         textColor: 'white',
         events: []
      };
      $scope.events['Furry Events'] = {
         color: '#669900',
         textColor: 'white',
         events: []
      };
      $scope.events['Other Events'] = {
         color: 'gray',
         textColor: 'white',
         events: []
      };
      for (var key in events) {
        var event = events[key];
        if (!event['recurrence_rules']) {
          var newEvent = {
            title: event['title']['rendered'],
            start: new Date(event['start'] * 1000),
            end: event['end'] ? new Date(event['end'] * 1000) : null,
          };
          if (event['terms'].length && $scope.events[event['terms'][0]]) {
            $scope.events[event['terms'][0]]['events'].push(newEvent);
          }
          else {
            $scope.events['Other Events']['events'].push(newEvent);
          }
        }
      }
      var watchString = '';
      for (var k in $scope.events) {
        watchString += (watchString ? '+' : '') + 'events["' + k + '"].k9noshow';
        $scope.events[k].k9style = {};
        if ($scope.events[k].color) {
          $scope.events[k].k9style['background-color'] = $scope.events[k].color;
        }
        if ($scope.events[k].textColor) {
          $scope.events[k].k9style['color'] = $scope.events[k].textColor;
        }
      }
      $scope.eventSources.push($scope.events['SF K9 Unit Events']);
      $scope.eventSources.push($scope.events['Community Events']);
      $scope.eventSources.push($scope.events['Furry Events']);
      $scope.eventSources.push($scope.events['Other Events']);

      /* Watch the no show value and show/hide events. */
      $scope.$watch(watchString, function(newVal, oldVal) {
        if (newVal !== oldVal) {
          for (var key in $scope.events) {
            var item = $scope.events[key];
            if (item.hasOwnProperty('k9noshow')) {
              var indexOf = $scope.eventSources.indexOf(item);
              if (item.k9noshow) {
                if (indexOf > -1) {
                  $scope.eventSources.splice(indexOf, 1);
                }
              }
              else {
                if (indexOf === -1) {
                  $scope.eventSources.push(item);
                }
              }
            }
          }
        }
      });
    });
  });
