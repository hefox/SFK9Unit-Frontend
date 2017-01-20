'use strict';

/**
 * @ngdoc function
 * @name sfk9App.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the sfk9App
 */
angular.module('sfk9App')
  .controller('PageCtrl', ['pageId', 'k9ApiPage', '$sce', '$scope', function (pageId, k9ApiPage, $sce, $scope) {
    $scope.content = '';
    k9ApiPage.get(pageId).then(function (data) {
      $scope.content =  $sce.trustAsHtml(data.content.rendered);
    });
  }]);
