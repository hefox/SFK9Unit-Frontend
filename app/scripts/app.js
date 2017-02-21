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
          pageObject: function(k9ApiPage) {
            return k9ApiPage.getBySlug('home');
          }
        }
      })
      .when('/calendar', {
        templateUrl: 'views/calendar.html',
        controller: 'CalendarCtrl',
        controllerAs: 'calendar',
        reloadOnSearch: false
      })
      .when('/events/:event', {
        redirectTo: function (routeParams) {
          if (routeParams.event === 'calendar') {
            return 'calendar';
          }
          return '/calendar?event=' + routeParams.event;
        }
      })
      .when('/:page', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'page',
        resolve: {
          pageObject: function(k9ApiPage, $route) {
            var page = $route.current.params.page;
            return k9ApiPage.getBySlug(page);
          }
        },
        reloadOnSearch: false
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
      $rootScope.activetab = newVal.substr(1);
    });
    $rootScope.menu = [];
    k9ApiMenu.then(function(data){
      $rootScope.menu = data;
    });
   $rootScope.$on('$routeChangeStart', function() {
      $rootScope.loading = true;
      jQuery('.loading-nav').removeClass('ng-hide');

   });

   $rootScope.$on('$routeChangeSuccess', function() {
      $rootScope.loading = false;
      jQuery('.loading-nav').addClass('ng-hide');

   });

   $rootScope.$on('$routeChangeError', function() {
       $rootScope.loading = false;
      jQuery('.loading-nav').addClass('ng-hide');
   });
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
      controller: function($scope, k9ApiPage, $routeParams, $location) {
        var search = $location.search();
        $scope.pageId = parseInt(search.id) || undefined;
        $scope.pages = [];
        $scope.activeTab = 0;
        k9ApiPage.getBySlug($routeParams.page).then(function(page) {
          k9ApiPage.getChildren(page.id).then(function(pages) {
            pages.sort(function (a, b) {return a['menu_order'] > b['menu_order'];});
            $scope.pages = pages;
            if ($scope.pageId && $scope.pages.length > 0) {
              for (var k in $scope.pages) {
                if ($scope.pages[k].id ===  $scope.pageId) {
                  $scope.activeTab =  parseInt(k);
                }
              }
            }
          });
        });
        $scope.changeTab = function($event) {
          if ($event && $event.currentTarget) {
            var id = jQuery($event.currentTarget).parent().attr('data-id');
            if (id > 0) {
              $scope.pageId = id;
              $location.search('id', id);
            }
          }
        };
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
            controller: ['$uibModalInstance', 'pageObject', function ($uibModalInstance, pageObject) {
              var $ctrl = this;
              $ctrl.pageObject = pageObject;
              $ctrl.close = function() {
                 $uibModalInstance.close();
              };
              $uibModalInstance.opened.then(function() {
                $rootScope.$broadcast('sfk9unitpagemodal-opened');
              });
            }],
            controllerAs: '$ctrl',
            resolve: {
              pageObject: function() {
                var q = $q.defer();
                k9ApiPage.get($scope.pageId).then(function(page) {
                  q.resolve(page);
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