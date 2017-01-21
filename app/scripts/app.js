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
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
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
          if (data[key].slug === rootParam) {
            q.resolve(data[key].pageId);
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
  .directive('sfk9unitcalendar', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        'display': '@',
      },
      controller: function(k9ApiEvents, $scope, $location, $rootScope) {
        // True till calendar done loading data.
        $scope.calendarLoading = true;
        /* config object */
        $scope.alertOnEventClick = function(date){
          $location.search('event', date.slug);
          if ($location.path() !== '/calendar') {
            $location.path('/calendar');
          }
          $rootScope.event = date;
        };
        $scope.uiConfig = {
          eventClick: $scope.alertOnEventClick,
          height: 'auto',
          header: {
              left:   'title',
              center: '',
              right:  $scope.display ? '' : 'month,agendaWeek,listMonth today prev,next'
          },
          defaultView: $scope.display ? $scope.display : 'month'
        };
        $scope.eventSources = [];
        $scope.events = [];
        $scope.recurringEvents = [];
        // Get all the event information and show.
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
          /**
           * Helper function, Set colour and style based on first term.
           */
          var setTerms = function(event, newEvent) {
            var term = event['terms'].length && $scope.eventsColours[event['terms'][0]] ? event['terms'][0] : defaultTerm;
            for (var attr in $scope.eventsColours[term]) {
              newEvent[attr] = $scope.eventsColours[term][attr];
            }
            newEvent.k9terms = event['terms'].length ? event['terms'] : [defaultTerm];
          };
          var copyCommonValues = function (oldEvent, newEvent) {
            var keys = ['slug', 'body', 'venue'];
            if (oldEvent['content'] && oldEvent['content']['rendered']) {
              newEvent['body'] = oldEvent['content']['rendered'];
            }
            for (var k in keys) {
              if (oldEvent.hasOwnProperty(keys[k])) {
                newEvent[keys[k]] = oldEvent[keys[k]];
              }
            }
          };

          // Iterate over the events.
          for (var key in events) {
            var event = events[key];
            // Unique, non-repeating event, just add.
            if (!event['recurrence_rules']) {
              var newEvent = {
                title: event['title']['rendered'],
                start: new Date(event['start'] * 1000),
                end: event['end'] ? new Date(event['end'] * 1000) : null
              };
              setTerms(event, newEvent);
              copyCommonValues(event, newEvent);
              $scope.events.push(newEvent);
            }
            // Recurring event, handle special.
            else {
              var rule = event['recurrence_rules'].split(';'), ruleProcess = {};
              for (var r in rule) {
                var rr = rule[r].split('=');
                ruleProcess[rr[0]] = rr[1];
              }
              var newRecurringEvent = {
                title: event['title']['rendered'],
                start: moment.unix(event['start']),
                end: event['end'] ? moment.unix(event['end']) : null,
                recuringRule: ruleProcess,
                datesProcessed: [],
              };
              setTerms(event, newRecurringEvent);
              copyCommonValues(event, newRecurringEvent);
              $scope.recurringEvents.push(newRecurringEvent);
            }
          }
          // Calculate some eventColours information for display.
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
          /**
           * Calculate and add recurring events.
           *
           * FullCalendar has this handy function whenever it display new events.
           * We use that and find the recurring events during the time frame.
           */
          if ($scope.recurringEvents.length) {
            var days = {'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'};
            $scope.eventSources.push(function(start, end, timezone, callback) {
              var returnEvents = [];
              for (var ek in $scope.recurringEvents) {
                var event = $scope.recurringEvents[ek];
                // Calculalte monthly repeating events.
                if (event.start < end && event.recuringRule['FREQ'] === 'MONTHLY') {
                  // This is in format "[num][day]", .e.g 3FR is Third Fridays.
                  // Store the number.
                  var howOften = event.recuringRule['BYday'].charAt(0);
                  // Find the day.
                  var dayOfMonth = days[event.recuringRule['BYday'].substr(1)];
                  // Find the hour difference between events.
                  var diff = event['end'] ?  moment.duration(event['end'].diff(event['start'])).asHours() : null;
                  // Iterate start to get to be after start. We use event date to use the correct time.
                  var day = event['start'].clone();
                  while (day < start) {
                    day.add(1, 'm');
                  }
                  // First the first day of the month.
                  day.startOf('month').day(dayOfMonth);
                  // If went before the 1st, add seven to get the one for this month.
                  if (day.date() > 7) {
                    day.add(7, 'd');
                  }
                  // Create the events till the end of the time period being shown.
                  while (day < end) {
                    // Iterate till the "xth" day in month.
                    for (var it = howOften-1; it > 0; it--) {
                      day.add(7,'d');
                    }
                    // Fix the hour lost in startOf.
                    day.set({
                     hour: event['start'].get('hour'),
                     minute: event['start'].get('minute'),
                    });
                    var newEvent = {
                      title: event['title'],
                      start: day.clone().toDate(),
                      end: event['end'] ? day.add(diff, 'h').clone().toDate() : null,
                      k9terms: event['k9terms'],
                      color: event['color'],
                      textColor: event['textColor'],
                    };
                    copyCommonValues(event, newEvent);
                    // Add event to overall events instead of calling callback
                    // So that we can later filter them.
                    $scope.events.push(newEvent);
                    // Get next month.
                    day.add(1, 'month').startOf('month').day(dayOfMonth);
                    if (day.date() > 7) {
                      day.add(7, 'd');
                    }
                  }
                }
              }
              redoEvents();
              callback(returnEvents);
            });
          }

          /* Watch the no show value and show/hide events. */
          $scope.$watch(watchString, function(newVal, oldVal) {
            var key;
            if (newVal !== oldVal) {
              $scope.showTerms = [];
              for (key in $scope.eventsColours) {
                if (!$scope.eventsColours[key].hasOwnProperty('k9noshow') || !$scope.eventsColours[key].k9noshow) {
                  $scope.showTerms.push(key);
                }
              }
              // Find events with said terms.
              if ($scope.showTerms.length === 0) {
                $scope.eventSources[0] = $scope.events;
                return;
              }
              $scope.eventSources.slice(0, 1);
              $scope.eventSources[0] = [];
              for (key in $scope.events) {
                var event = $scope.events[key];
                addEvent(event);
              }
            }
          });
          function redoEvents() {
            $scope.eventSources.slice(0, 1);
            $scope.eventSources[0] = [];
            var searchObject = $location.search();
            for (key in $scope.events) {
              var event = $scope.events[key];
              addEvent(event);
              if (searchObject['event'] && searchObject['event'] == event.slug) {
                $rootScope.event = event;
              }
            }
            // Indicate the calendar is all done loading.
            $scope.calendarLoading = false;
          }
          function addEvent(event) {
            for (var tk in event.k9terms) {
              if (!$scope.showTerms || $scope.showTerms.indexOf(event.k9terms[tk]) > -1) {
                $scope.eventSources[0].push(event);
                return;
              }
            }
          }
        });
      },
      templateUrl: 'views/calendar-component.html',
      replace: true
    };
  });