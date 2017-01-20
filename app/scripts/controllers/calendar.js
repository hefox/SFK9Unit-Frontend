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
    $scope.events = [];
    k9ApiEvents.get().then(function(events) {
      $scope.eventsColours = {};
      var defaultTerm = 'Other Events';
      $scope.eventsColours['SF K9 Unit Events'] = {
         color: '#C00A09',
         textColor: 'white',
      };
      $scope.eventsColours['Community Events'] = {
         color: '#3d6b99',
         textColor: 'white',
      };
      $scope.eventsColours['Furry Events'] = {
         color: '#669900',
         textColor: 'white',
      };
      $scope.eventsColours[defaultTerm] = {
         color: 'gray',
         textColor: 'white',
      };
      for (var key in events) {
        var event = events[key];
        if (!event['recurrence_rules']) {
          var newEvent = {
            title: event['title']['rendered'],
            start: new Date(event['start'] * 1000),
            end: event['end'] ? new Date(event['end'] * 1000) : null,
            id: event['id']
          };
          var term = event['terms'].length && $scope.eventsColours[event['terms'][0]] ? event['terms'][0] : defaultTerm;
          for (var attr in $scope.eventsColours[term]) {
            newEvent[attr] = $scope.eventsColours[term][attr];
          }
          newEvent.k9terms = event['terms'].length ? event['terms'] : [defaultTerm];
          $scope.events.push(newEvent);
        }
      }
      var watchString = '';
      for (var k in $scope.eventsColours) {
        watchString += (watchString ? '+' : '') + 'eventsColours["' + k + '"].k9noshow';
        $scope.eventsColours[k].k9style = {};
        if ($scope.eventsColours[k].color) {
          $scope.eventsColours[k].k9style['background-color'] = $scope.eventsColours[k].color;
        }
        if ($scope.eventsColours[k].textColor) {
          $scope.eventsColours[k].k9style['color'] = $scope.eventsColours[k].textColor;
        }
      }
      $scope.eventSources.push($scope.events.slice(0));

      /* Watch the no show value and show/hide events. */
      $scope.$watch(watchString, function(newVal, oldVal) {
        var key;
        if (newVal !== oldVal) {
          var show = [];
          for (key in $scope.eventsColours) {
            if (!$scope.eventsColours[key].hasOwnProperty('k9noshow') || !$scope.eventsColours[key].k9noshow) {
              show.push(key);
            }
          }
          // Find events with said terms.
          if (show.length === 0) {
            $scope.eventSources[0] = $scope.events;
            return;
          }
          $scope.eventSources.slice(0, 1);
          $scope.eventSources[0] = [];
          for (key in $scope.events) {
            var event = $scope.events[key];
            for (var tk in event.k9terms) {
              if (show.indexOf(event.k9terms[tk]) > -1) {
                $scope.eventSources[0].push(event);
                break;
              }
            }
          }
        }
      });
    });
  });
