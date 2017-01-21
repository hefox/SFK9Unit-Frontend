'use strict';

/**
 * @ngdoc overview
 * @name sfk9App
 * @description
 * # sfk9App
 *
 * Defines the k9Api module.
 */

angular.module('k9Api', [])
  // Retrieve the menu.
  .value('k9ApiRoot', 'http://www.sfk9unit.org/wp-json/')
  .value('k9ApiSlugRoot', 'http://www.sfk9unit.org')
  .factory('k9ApiMenu', ['$http', 'k9ApiRoot', '$log', '$q', 'k9ApiSlugRoot', function k9ApiMenu($http, k9ApiRoot, $log, $q, k9ApiSlugRoot) {
    var that = this;
    this.menu = $q.defer();
    $http({
      method: 'GET',
      url: k9ApiRoot + 'wp-api-menus/v2/menus/10'
    }).then(function successCallback(response) {
        var items = [];
        // Format items in better format.
        for (var key in response.data.items) {
          var item = {title: response.data.items[key].title, pageId: response.data.items[key]['object_id']};
          item.slug = response.data.items[key].url.replace(k9ApiSlugRoot, '');
          // Abstract the slug.
          if (item.slug.charAt(0) === '/') {
            item.slug = item.slug.slice(1);
          }
          if (item.slug.charAt(item.slug.length -1) === '/') {
            item.slug = item.slug.slice(0, -1);
          }
          items.push(item);
        }
        that.menu.resolve(items);
      }, function errorCallback() {
        $log.error('Unable to retrieve menu');
        that.menu.reject('Error retrieving menu.');
    });
    return this.menu.promise;
  }])
  .factory('k9ApiPage', ['$http', 'k9ApiRoot', '$log', '$q', function k9ApiMenu($http, k9ApiRoot, $log, $q) {
    var that = this;
    this.pagesBySlug = {};
    this.pagesById = {};
    this.get = function(pageId) {
      var page = $q.defer();
      if (that.pagesById[pageId]) {
        page.resolve(that.pagesById[pageId]);
        return page.promise;
      }
      $http({
        method: 'GET',
        url: k9ApiRoot + 'wp/v2/pages/' + pageId
      }).then(function successCallback(response) {
          page.resolve(response.data);
          that.pagesById[pageId] = response.data;
        }, function errorCallback() {
          $log.error('Unable to retrieve page');
          page.reject('Error retrieving page.');
      });
      return page.promise;
    };
    this.getBySlug = function(slug) {
      // temp bypass till we can get home at a home. @fixme
      slug = slug === 'home' ? 'slider-test' : slug;
      var page = $q.defer();
      if (that.pagesBySlug[slug]) {
        page.resolve(that.pagesBySlug[slug]);
        return page.promise;
      }
      $http({
        method: 'GET',
        url: k9ApiRoot + 'wp/v2/pages?slug=' + slug
      }).then(function successCallback(response) {
          if (response.data[0]) {
            page.resolve(response.data[0]);
            that.pagesBySlug[slug] = response.data[0];
          }
          else {
            page.reject('Unable to find page with slug.');
          }
        }, function errorCallback() {
          $log.error('Unable to retrieve page');
          page.reject('Error retrieving page.');
      });
      return page.promise;
    };
    this.getChildren = function(pageId) {
      var page = $q.defer();
      $http({
        method: 'GET',
        url: k9ApiRoot + 'wp/v2/pages/?parent=' + pageId
      }).then(function successCallback(response) {
          page.resolve(response.data);
        }, function errorCallback() {
          $log.error('Unable to retrieve pages');
          page.reject('Error retrieving pages.');
      });
      return page.promise;
    };
    return this;
  }])
  .factory('k9ApiEvents', ['$http', 'k9ApiRoot', '$log', '$q', function k9ApiMenu($http, k9ApiRoot, $log, $q) {
    this.get = function() {
      var page = $q.defer();
      $http({
        method: 'GET',
        url: k9ApiRoot + 'wp/v2/events?per_page=100'
      }).then(function successCallback(response) {
          page.resolve(response.data);
        }, function errorCallback() {
          $log.error('Unable to retrieve page');
          page.reject('Error retrieving page.');
      });
      return page.promise;
    };
    return this;
  }]);