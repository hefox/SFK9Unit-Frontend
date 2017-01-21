'use strict';

/**
 * @ngdoc function
 * @name sfk9App.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sfk9App
 */
angular.module('sfk9App')
  // @todo use broadcast or such to pass event.
  .controller('CalendarCtrl', function ($scope, $rootScope) {
    $rootScope.$watch('event', function() {
      $scope.event = $rootScope.event;
    });
    $scope.displayDate = function(date, format) {
      return moment(date).format(format ? format : 'MMMM Do YYYY, h:mm a');
    };
    /**
     * returns true if the end is a different day then end.
     */
    $scope.moreThen1Day = function(date) {
      return date.end && !moment(date.start).isSame(date.end, 'day');
    };
  });
