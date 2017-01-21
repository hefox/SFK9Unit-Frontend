'use strict';

/**
 * @ngdoc function
 * @name sfk9App.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the sfk9App
 */
angular.module('sfk9App')
  .controller('PageCtrl', ['pageObject', 'k9ApiPage', '$sce', '$scope', function (pageObject, k9ApiPage, $sce, $scope) {
    $scope.content = '';
    $scope.pageObject = pageObject;
    $scope.content =  $sce.trustAsHtml(pageObject.content.rendered);
  }]);
