'use strict';


/**
 * @ngdoc overview
 * @name sfk9App
 * @description
 * # sfk9App
 *
 * Main module of the application.
 */
angular
  .module('sfk9App', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'ui.calendar',
    'k9Api'
  ])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'page',
        resolve: {
          pageId: function(pageInfo) {
            return pageInfo.getPageId('home');
          }
        }
      })
      .when('/calendar', {
        templateUrl: 'views/calendar.html',
        controller: 'CalendarCtrl',
        controllerAs: 'calendar',
        reloadOnSearch: false
      })
      .when('/:page', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'page',
        resolve: {
          pageId: function(pageInfo, $route) {
            var page = $route.current.params.page;
            return pageInfo.getPageId(page);
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
      //$locationProvider.hashPrefix('');
      $locationProvider.html5Mode(true);
        //.hashPrefix('');
  }])
  .run(['$rootScope', '$location', 'k9ApiMenu', function($rootScope, $location, k9ApiMenu){
    var path = function() { return $location.path();};
    $rootScope.$watch(path, function(newVal){
      $rootScope.activetab = newVal;
    });
    $rootScope.menu = [];
    k9ApiMenu.then(function(data){
      $rootScope.menu = data;
    });
  }])
  .factory('pageInfo', ['k9ApiMenu', '$q', function pageInfo(k9ApiMenu,  $q) {
    this.getPageId = function(rootParam) {
      var q = $q.defer();
      k9ApiMenu.then(function(data) {
        for (var key in data) {
          // Either matching slug or get first menu item for root.
          if (data[key].slug === rootParam || rootParam === 'home') {
            q.resolve(data[key].pageId);
            return;
          }
        }
        q.reject('ID not found.');
      });
      return q.promise;
    };
    return this;
  }])
  // via http://stackoverflow.com/questions/17417607/angular-ng-bind-html-and-directive-within-it
  .directive('bindHtmlCompile', ['$compile', function ($compile) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.$watch(function () {
          return scope.$eval(attrs.bindHtmlCompile);
        }, function (value) {
          // Incase value is a TrustedValueHolderType, sometimes it
          // needs to be explicitly called into a string in order to
          // get the HTML string.
          element.html(value && value.toString());
          // If scope is provided use it, otherwise use parent scope
          var compileScope = scope;
          if (attrs.bindHtmlScope) {
            compileScope = scope.$eval(attrs.bindHtmlScope);
          }
          $compile(element.contents())(compileScope);
        });
      }
    };
  }])
  .directive('sfk9unitpagechildren', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
      },
      controller: function($scope, k9ApiPage, pageInfo, $routeParams) {
        $scope.pages = [];
        pageInfo.getPageId($routeParams.page).then(function(pageId) {
          k9ApiPage.getChildren(pageId).then(function(pages) {
            pages.sort(function (a, b) {return a['menu_order'] > b['menu_order'];});
            $scope.pages = pages;
          });
        });
      },
      templateUrl: 'views/childpages.html',
      replace: true
    };
  })

  .directive('sfk9unitpagemodal', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        pageId: '@',
        linkTitle: '@'
      },
      controller: function($scope, $uibModal, k9ApiPage, $q, $rootScope) {
        $scope.$on('sfk9unitpagemodal-opened', function() {
          $scope.loading = false;
        });
        $scope.opeModal = function() {
          $scope.loading = true;
          $uibModal.open({
            templateUrl: 'views/pagemodal.html',
            controller: function ($uibModalInstance, pageObject) {
              var $ctrl = this;
              $ctrl.pageObject = pageObject;
              $ctrl.close = function() {
                 $uibModalInstance.close();
              };
              $uibModalInstance.opened.then(function() {
                $rootScope.$broadcast('sfk9unitpagemodal-opened');
              });

            },
            controllerAs: '$ctrl',
            resolve: {
              pageObject: function() {
                var q = $q.defer();
                k9ApiPage.get($scope.pageId).then(function(page) {
                  q.resolve(page);
                  console.log('page', q.promise);
                });
                return q.promise;
              }
            }
          });
        };
      },
      template: '<span><button type="button" class="btn bt-default" ng-click="opeModal()">{{linkTitle}} </button> <i class="glyphicon glyphicon-refresh glyphicon-refresh-animate" ng-if="loading"></i></span>',
      replace: true
    };
  });