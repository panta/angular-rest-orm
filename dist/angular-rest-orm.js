/**
 * Angular ORM for HTTP REST APIs
 * @version angular-rest-orm - v0.4.2 - 2014-09-30
 * @link https://github.com/panta/angular-rest-orm
 * @author Marco Pantaleoni <marco.pantaleoni@gmail.com>
 *
 * Copyright (c) 2014 Marco Pantaleoni <marco.pantaleoni@gmail.com>
 * Licensed under the MIT License, http://opensource.org/licenses/MIT
 */
var __hasProp = {}.hasOwnProperty,
  __slice = [].slice,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module("restOrm", []).factory("Resource", ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
  var Resource, endsWith, isEmpty, isKeyLike, startsWith, urljoin, _urljoin;
  isEmpty = function(obj) {
    var key;
    if (obj == null) {
      return true;
    }
    if (obj.length > 0) {
      return false;
    }
    if (obj.length === 0) {
      return true;
    }
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      return false;
    }
    return true;
  };
  startsWith = function(s, sub) {
    return s.slice(0, sub.length) === sub;
  };
  endsWith = function(s, sub) {
    return sub === '' || s.slice(-sub.length) === sub;
  };
  isKeyLike = function(value) {
    if (value == null) {
      return false;
    }
    if (angular.isUndefined(value) || (value === null)) {
      return false;
    }
    if (angular.isObject(value) || angular.isArray(value)) {
      return false;
    }
    return true;
  };
  _urljoin = function() {
    var c_url, component, components, i, last_comp, normalize, r, skip, url_result, _i, _j, _len, _ref;
    components = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    normalize = function(str) {
      return str.replace(/[\/]+/g, "/").replace(/\/\?/g, "?").replace(/\/\#/g, "#").replace(/\:\//g, "://");
    };
    url_result = [];
    if (components && (components.length > 0)) {
      skip = 0;
      while (skip < components.length) {
        if (components[skip]) {
          break;
        }
        ++skip;
      }
      if (skip) {
        components = components.slice(skip);
      }
    }
    last_comp = null;
    for (_i = 0, _len = components.length; _i < _len; _i++) {
      component = components[_i];
      if (!((component != null) && component)) {
        continue;
      }
      last_comp = component;
      c_url = ("" + component).split("/");
      for (i = _j = 0, _ref = c_url.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
        if (c_url[i] === "..") {
          url_result.pop();
        } else if ((c_url[i] === ".") || (c_url[i] === "")) {
          continue;
        } else {
          url_result.push(c_url[i]);
        }
      }
    }
    r = normalize(url_result.join("/"));
    if (components && (components.length >= 1)) {
      component = "" + components[0];
      if (startsWith(component, "//")) {
        r = "//" + r;
      } else if (startsWith(component, "/")) {
        r = "/" + r;
      }
      last_comp = "" + last_comp;
      if (endsWith(last_comp, "/") && (!endsWith(r, "/"))) {
        r = r + "/";
      }
    }
    return r;
  };
  urljoin = function() {
    return encodeURI(_urljoin.apply(null, arguments));
  };

  /**
    * @ngdoc service
    * @name restOrm.Resource
    *
    * @description
    * # Resource
    * Is the base class for RESTful resource models.
    *
    * Derive from `Resource` providing proper values for class properties
    * as described below to define models for your resources.
    *
    * A very minimal example in JavaScript:
    *
    * ```javascript
    * var Book = Resource.Subclass({}, {
    *   urlEndpoint: '/api/books/',
    *   idField: '_id'
    * });
    * ```
    *
    * of in CoffeeScript:
    *
    * ```coffeescript
    * class Book extends Resource
    *   @.urlEndpoint: '/api/books/'
    *   @.idField: '_id'
    * ```
    * (the `.` has been added to circumvent an `ngdoc` bug regarding parsing of `@` in blockquotes...)
    *
    * @returns {object} Resource class
   */
  Resource = (function() {

    /**
      * @ngdoc property {String}
      * @name .#urlPrefix
      * @propertyOf restOrm.Resource
      *
      * @description
      * # urlPrefix
      * **class property** - prefix that will be prepended to all URLs
      * for this resource.
      * Defaults to the empty string (in this case, nothing will be prepended).
      *
      * The final base URL will have the form
      *
      *     `urlPrefix` / `urlEndpoint`
      *
      * (Note that slashes will be added only where necessary)
      *
      * This property is intended to be specified on subclasses of `Resource`.
     */
    Resource.urlPrefix = '';


    /**
      * @ngdoc property {String}
      * @name .#urlEndpoint
      * @propertyOf restOrm.Resource
      *
      * @description
      * # urlEndpoint
      * **class property** - the base URL for the resource.
      *
      * The final base URL will have the form
      *
      *     `urlPrefix` / `urlEndpoint`
      *
      * (Note that slashes will be added only where necessary)
      *
      * This property is intended to be specified on subclasses of `Resource`.
     */

    Resource.urlEndpoint = '';


    /**
      * @ngdoc property {String}
      * @name .#idField
      * @propertyOf restOrm.Resource
      *
      * @description
      * # idField
      * **class property** - (optional) the name of the field containing the ID of the resource in
      * remote endpoint responses.
      *
      * Defaults to `id`.
      *
      * This property is intended to be specified on subclasses of `Resource`.
     */

    Resource.idField = 'id';


    /**
      * @ngdoc property {Object}
      * @name .#fields
      * @propertyOf restOrm.Resource
      *
      * @description
      * # fields
      * **class property** - (optional) object specifying names and kinds of resource fields.
      *
      * It's possible to specify an entry for each field, with this form:
      *
      * ```javascript
      * {
      *   ...
      *   NAME: {
      *      default: DEFAULT_VALUE,
      *      remote: REMOTE_FIELD_NAME,
      *      type: FIELD_TYPE,
      *      model: RELATED_MODEL
      *   },
      *   ...
      * }
      * ```
      *
      * where:
      *
      * -  *NAME* is the field name as used on the resource (model instance). This can be
      *    different from the remote endpoint field name.
      * -  *DEFAULT_VALUE* is the default value for the field, used if the remote doesn't
      *    provide a value or when creating a resource without specifying all fields
      * -  *REMOTE_FIELD_NAME* is the (optional) field name on the remote endpoint. If not
      *    specified, it's assumed to be the same as *NAME*
      * -  *FIELD_TYPE* at this time is used only to specify relations. If specified can
      *    be `Resource.Reference` or `Resource.ManyToMany`
      * -  *RELATED_MODEL* used only for relations, specifies the related model (must be a
      *    `Resource` subclass)
      *
      * All of the entry object fields are optional.
      *
      *
      * If `fields` is not specified, fields will be fetched and copied between
      * responses and resource models as-is.
      *
      * This property is intended to be specified on subclasses of `Resource`.
     */

    Resource.fields = {};


    /**
      * @ngdoc property {Object}
      * @name .#defaults
      * @propertyOf restOrm.Resource
      *
      * @description
      * # defaults
      * **class property** - (optional) object specifying default values for resource fields.
      * It is meant to be an easy shortcut for those cases where the `fields` complexity is
      * not needed.
      *
      * This property is intended to be specified on subclasses of `Resource`.
     */

    Resource.defaults = {};

    Resource.headers = {};

    Resource.transformResponse = null;

    Resource.Reference = 'reference';

    Resource.ManyToMany = 'many2many';

    Resource.include = function(obj) {
      var key, value, _ref;
      if (!obj) {
        throw new Error('include(obj) requires obj');
      }
      for (key in obj) {
        value = obj[key];
        if (key !== 'included' && key !== 'extended') {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Resource.extend = function(obj) {
      var key, value, _ref;
      if (!obj) {
        throw new Error('extend(obj) requires obj');
      }
      for (key in obj) {
        value = obj[key];
        if (key !== 'included' && key !== 'extended') {
          this[key] = value;
        }
      }
      if ((_ref = obj.extended) != null) {
        _ref.apply(this);
      }
      return this;
    };


    /**
      * @ngdoc method
      * @name Resource#Subclass
      * @methodOf restOrm.Resource
      *
      * @description
      * # Resource.Subclass()
      * **class method** that returns a new subclass derived from `Resource`
      * extended with the specified instance and class properties.
      *
      * This method is intended to be used from plain *JavaScript*.
      *
      * *CoffeeScript* users should rely on the native `class ... extends ...` syntax
      * to create `Resource` subclasses.
      *
      * @param {object} instances Properties to add to instances of the newly created class
      *
      * @param {object} statics Class properties of the newly created class
      *
      * @returns {function} the new class (a constructor function)
     */

    Resource.Subclass = function(instances, statics) {
      var Result;
      Result = (function(_super) {
        __extends(Result, _super);

        function Result() {
          return Result.__super__.constructor.apply(this, arguments);
        }

        return Result;

      })(this);
      if (instances) {
        Result.include(instances);
      }
      if (statics) {
        Result.extend(statics);
      }
      Result.prototype.$super = function(method) {
        return this.constructor.__super__[method];
      };
      return Result;
    };


    /**
      * @ngdoc method
      * @name Resource
      * @methodOf restOrm.Resource
      *
      * @description
      * # Resource()
      * **constructor** for `Resource`
      *
      * Usually one would never call this constructor direcly, but always through subclasses.
      *
      * @param {object|null=} data Object that will be used to initialize the resource (model instance)
      *
      * @param {object=} opts Options
     */

    function Resource(data, opts) {
      if (data == null) {
        data = null;
      }
      if (opts == null) {
        opts = {};
      }
      this.$meta = {
        persisted: false,
        async: {
          direct: {
            deferred: null,
            resolved: true
          },
          m2o: {
            deferred: null,
            resolved: true
          },
          m2m: {
            deferred: null,
            resolved: true
          }
        }
      };
      angular.extend(this.$meta, opts);
      this.$id = null;
      this._fromObject(data || {});
      this.$promise = null;
      this.$promiseDirect = null;
      this._setupPromises();
      this._fetchRelations();
      if (typeof this.$initialize === "function") {
        this.$initialize.apply(this, arguments);
      }
    }


    /**
      * @ngdoc method
      * @name Resource#Create
      * @methodOf restOrm.Resource
      *
      * @description
      * # Resource.Create()
      * **class method ** - creates a model resource (instance) and persists it on the remote side.
      *
      * Usually this method will be called on a `Resource` subclass.
      *
      * @param {data|null=} data Object used to initialize the new model instance properties
      *
      * @param {object=} opts Options passed to `$save()`
      *
      * @returns {object} newly created resource (model instance)
     */

    Resource.Create = function(data, opts) {
      var item;
      if (data == null) {
        data = null;
      }
      if (opts == null) {
        opts = {};
      }
      data = data || this.defaults;
      item = new this(data, {
        persisted: false
      });
      item.$save(opts);
      return item;
    };


    /**
      * @ngdoc method
      * @name Resource#Get
      * @methodOf restOrm.Resource
      *
      * @description
      * # Resource.Get
      * **class method ** - fetches and returns a resource with the given id.
      *
      * A model instance for the resource is constructed and returned, and it
      * will be populated with the contents fetched from the remote endpoint
      * for the resource with the specified `id`.
      *
      * The HTTP fetch will be performed asynchronously, so the model instance,
      * even if returned immediately, will be populated in an
      * incremental fashion.
      *
      * To allow the user to be notified on the completion of the fetch process,
      * the model instance contains as special properties a couple of promises that
      * will be fulfilled when the fetch completes.
      *
      * The first one is named `$promise`. This will be fulfilled when
      * the resource will have been fetched **along with all its relations**
      * (and the relations of the relations... down to the deepest nesting levels).
      *
      * The other one is named `$promiseDirect`. This will be fulfilled when the
      * resource will have been fetched, but ignoring relations.
      *
      * The method will cause an http request of the form:
      *
      *   `GET` *RESOURCE_URL* / *id*
      *
      * Usually this method will be called on a `Resource` subclass.
      *
      * @param {Number|String} id Remote endpoint id of the resource to fetch
      *
      * @param {object=} opts Options object containing optional `params` and `data`
      *   fields passed to the respective counterparts of the `$http` call
      *
      * @returns {object} fetched resource (model instance)
     */

    Resource.Get = function(id, opts) {
      var item, url;
      if (opts == null) {
        opts = {};
      }
      item = new this();
      url = urljoin(this._GetURLBase(), id);
      item._setupPromises();
      $http({
        method: "GET",
        url: url,
        headers: this._BuildHeaders('Get', 'GET', null),
        params: opts.params || {},
        data: opts.data || {}
      }).then((function(_this) {
        return function(response) {
          response = _this._TransformResponse(response.data, {
            what: 'Get',
            method: 'GET',
            url: url,
            response: response
          });
          return item._fromRemote(response.data);
        };
      })(this));
      return item;
    };


    /**
      * @ngdoc method
      * @name Resource#All
      * @methodOf restOrm.Resource
      *
      * @description
      * # Resource.All
      * **class method ** - fetches and returns all the remote resources.
      *
      * This method returns a *collection*, an Array augmented with some
      * additional properties, as detailed below.
      *
      * The HTTP fetch will be performed asynchronously, so the collection,
      * even if returned immediately, will be filled with results in an
      * incremental fashion.
      *
      * To allow the user to be notified on the completion of the fetch process,
      * the collection contains as special properties a couple of promises that
      * will be fulfilled when the fetch completes.
      *
      * The first one is named `$promise`. This will be fulfilled when all
      * collection items will have been fetched **along with all their relations**
      * (and the relations of the relations... down to the deepest nesting levels).
      *
      * The other one is named `$promiseDirect`. This will be fulfilled when all
      * collection items will have been fetched, but ignoring relations.
      *
      * The method will cause an http request of the form:
      *
      *   `GET` *RESOURCE_URL* /
      *
      * Usually this method will be called on a `Resource` subclass.
      *
      * @param {object=} opts Options object containing optional `params` and `data`
      *   fields passed to the respective counterparts of the `$http` call
      *
      * @returns {object} fetched collection (augmented array of model instances)
     */

    Resource.All = function(opts) {
      var collection, url;
      if (opts == null) {
        opts = {};
      }
      collection = this._MakeCollection();
      url = urljoin(this._GetURLBase());
      $http({
        method: "GET",
        url: url,
        headers: this._BuildHeaders('All', 'GET', null),
        params: opts.params || {},
        data: opts.data || {}
      }).then((function(_this) {
        return function(response) {
          var values, _i, _len, _ref;
          response = _this._TransformResponse(response.data, {
            what: 'All',
            method: 'GET',
            url: url,
            response: response
          });
          _ref = response.data;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            values = _ref[_i];
            collection.push(_this._MakeInstanceFromRemote(values));
          }
          return collection.$finalize();
        };
      })(this));
      return collection;
    };

    Resource.Search = function(field, value, opts) {
      var url;
      if (opts == null) {
        opts = {};
      }
      url = urljoin(this.GetUrlBase(), "search", field, value);
      return $http({
        method: "GET",
        url: url,
        headers: this._BuildHeaders('Search', 'GET', null),
        params: opts.params || {},
        data: opts.data || {}
      }).then((function(_this) {
        return function(response) {
          var values, _i, _len, _ref, _results;
          response = _this._TransformResponse(response.data, {
            what: 'Search',
            method: 'GET',
            url: url,
            response: response
          });
          _ref = response.data;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            values = _ref[_i];
            _results.push(_this._MakeInstanceFromRemote(values));
          }
          return _results;
        };
      })(this));
    };


    /**
      * @ngdoc method
      * @name Resource#$save
      * @methodOf restOrm.Resource
      *
      * @description
      * Saves the resource represented by this model instance.
      *
      * If the model instance represents a resource obtained from the
      * remote endpoint (thus having an ID), than the method will update
      * the remote resource (using an HTTP `PUT`), otherwise it will create
      * the resource on the remote endpoint (using an HTTP `POST`).
      *
      * The operation will update the model representation with the data
      * obtained from the remote endpoint.
      *
      * The HTTP operation will be performed asynchronously, so the `$promise`
      * and `$promiseDirect` promises will be re-generated to inform of the
      * completion.
      *
      * For a new resource, the method will cause an http request of the form:
      *
      *   `POST` *RESOURCE_URL* /
      *
      * otherwise for an existing resource:
      *
      *   `PUT` *RESOURCE_URL* / *id*
      *
      * Usually this method will be called on a `Resource` subclass.
      *
      * @param {object=} opts Options object containing optional `params` and `data`
      *   fields passed to the respective counterparts of the `$http` call
      *
      * @returns {object} the model instance itself
     */

    Resource.prototype.$save = function(opts) {
      var data, headers, method, url;
      if (opts == null) {
        opts = {};
      }
      data = this._toRemoteObject();
      if (this.$meta.persisted && (this.$id != null)) {
        method = 'PUT';
        url = urljoin(this._getURLBase(), this.$id);
      } else {
        method = 'POST';
        if (this.constructor.idField in data) {
          delete data[this.constructor.idField];
        }
        url = urljoin(this._getURLBase());
      }
      this._setupPromises();
      headers = this._buildHeaders('$save', method);
      $http({
        method: method,
        url: url,
        data: data,
        cache: false,
        headers: headers,
        params: opts.params || {}
      }).then((function(_this) {
        return function(response) {
          response = _this._transformResponse(response.data, {
            what: '$save',
            method: method,
            url: url,
            response: response
          });
          return _this._fromRemote(response.data);
        };
      })(this));
      return this;
    };

    Resource._MakeCollection = function() {
      var collection;
      collection = [];
      collection.$useApplyAsync = false;
      collection.$meta = {
        model: this,
        async: {
          direct: {
            deferred: $q.defer(),
            resolved: false
          },
          complete: {
            deferred: $q.defer(),
            resolved: false
          }
        }
      };
      collection.$promise = collection.$meta.async.complete.deferred.promise;
      collection.$promiseDirect = collection.$meta.async.direct.deferred.promise;
      collection.$getItemsPromises = function() {
        var instance, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = collection.length; _i < _len; _i++) {
          instance = collection[_i];
          _results.push(instance.$promise);
        }
        return _results;
      };
      collection.$getItemsPromiseDirects = function() {
        var instance, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = collection.length; _i < _len; _i++) {
          instance = collection[_i];
          _results.push(instance.$promiseDirect);
        }
        return _results;
      };
      collection.$_getPromiseForItems = function() {
        return $q.all(collection.$getItemsPromises());
      };
      collection.$_getPromiseDirectForItems = function() {
        return $q.all(collection.$getItemsPromiseDirects());
      };
      collection._resolvePromise = function(deferred, success) {
        if (success == null) {
          success = true;
        }
        if (success) {
          return deferred.resolve(collection);
        }
        return deferred.reject(collection);
      };
      collection.resolvePromise = function(deferred, success) {
        if (success == null) {
          success = true;
        }
        if (collection.$useApplyAsync) {
          $rootScope.$applyAsync(function() {
            return collection._resolvePromise(deferred, success);
          });
        } else {
          collection._resolvePromise(deferred, success);
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        }
        return collection;
      };
      collection.$finalize = function() {
        collection.$_getPromiseForItems().then(function() {
          collection.resolvePromise(collection.$meta.async.complete.deferred);
          return collection.$meta.async.complete.resolved = true;
        });
        collection.resolvePromise(collection.$meta.async.direct.deferred);
        collection.$meta.async.direct.resolved = true;
        return collection;
      };
      return collection;
    };

    Resource._MakeInstanceFromRemote = function(data) {
      var instance;
      instance = new this();
      instance._setupPromises();
      instance._fromRemote(data);
      return instance;
    };

    Resource._GetURLBase = function() {
      return _urljoin(this.urlPrefix, this.urlEndpoint);
    };

    Resource._BuildHeaders = function(what, method, instance) {
      var dst_headers, processHeaderSource;
      if (what == null) {
        what = null;
      }
      if (method == null) {
        method = null;
      }
      if (instance == null) {
        instance = null;
      }
      if (this.headers == null) {
        return {};
      }
      if (angular.isFunction(this.headers)) {
        return this.headers.call(this, {
          klass: this,
          what: what,
          method: method,
          instance: instance
        });
      } else if (angular.isObject(this.headers)) {
        processHeaderSource = (function(_this) {
          return function(dst, src) {
            var dst_value, name, value;
            for (name in src) {
              value = src[name];
              if (angular.isFunction(value)) {
                dst_value = value.call(_this, {
                  klass: _this,
                  what: what,
                  method: method,
                  instance: instance
                });
              } else {
                dst_value = value;
              }
              if (dst_value !== null) {
                dst[name] = dst_value;
              }
            }
            return dst;
          };
        })(this);
        dst_headers = {};
        if (('common' in this.headers) || ((what != null) && (what in this.headers)) || ((method != null) && (method in this.headers))) {
          if ('common' in this.headers) {
            processHeaderSource(dst_headers, this.headers.common);
          }
          if ((what != null) && (what in this.headers)) {
            processHeaderSource(dst_headers, this.headers[what]);
          }
          if ((method != null) && (method in this.headers)) {
            processHeaderSource(dst_headers, this.headers[method]);
          }
        } else {
          processHeaderSource(dst_headers, this.headers);
        }
        return dst_headers;
      }
      return {};
    };

    Resource._TransformResponse = function(data, info) {
      info.klass = this;
      if ((this.transformResponse != null) && angular.isFunction(this.transformResponse)) {
        return this.transformResponse.call(this, data, info);
      }
      return info.response;
    };

    Resource.prototype._transformResponse = function(data, info) {
      info.instance = this;
      return this.constructor._TransformResponse(data, info);
    };

    Resource.prototype._buildHeaders = function(what, method) {
      if (what == null) {
        what = null;
      }
      if (method == null) {
        method = null;
      }
      return this.constructor._BuildHeaders(what, method, this);
    };

    Resource.prototype._setupPromises = function() {
      var changed;
      changed = false;
      if (this.$meta.async.direct.resolved || (this.$meta.async.direct.deferred == null)) {
        this.$meta.async.direct.deferred = $q.defer();
        this.$meta.async.direct.resolved = false;
        changed = true;
        this.$promiseDirect = this.$meta.async.direct.deferred.promise.then((function(_this) {
          return function() {
            _this.$meta.async.direct.resolved = true;
            return _this;
          };
        })(this));
      }
      if (this.$meta.async.m2o.resolved || (this.$meta.async.m2o.deferred == null)) {
        this.$meta.async.m2o.deferred = $q.defer();
        this.$meta.async.m2o.resolved = false;
        changed = true;
        this.$meta.async.m2o.deferred.promise.then((function(_this) {
          return function() {
            _this.$meta.async.m2o.resolved = true;
            return _this;
          };
        })(this));
      }
      if (this.$meta.async.m2m.resolved || (this.$meta.async.m2m.deferred == null)) {
        this.$meta.async.m2m.deferred = $q.defer();
        this.$meta.async.m2m.resolved = false;
        changed = true;
        this.$meta.async.m2m.deferred.promise.then((function(_this) {
          return function() {
            _this.$meta.async.m2m.resolved = true;
            return _this;
          };
        })(this));
      }
      if (changed) {
        this.$promise = $q.all([this.$meta.async.direct.deferred.promise, this.$meta.async.m2o.deferred.promise, this.$meta.async.m2m.deferred.promise]).then((function(_this) {
          return function() {
            _this.$meta.async.direct.resolved = true;
            _this.$meta.async.m2o.resolved = true;
            _this.$meta.async.m2m.resolved = true;
            return _this;
          };
        })(this));
      }
      return this;
    };

    Resource.prototype._getURLBase = function() {
      return _urljoin(this.constructor.urlPrefix, this.constructor.urlEndpoint);
    };

    Resource.prototype._fetchRelations = function() {
      if (this.$id != null) {
        this._fetchReferences();
        this._fetchM2M();
      }
      return this;
    };

    Resource.prototype._fetchReferences = function() {
      var def, fetchReference, name, promises;
      fetchReference = function(instance, reference, promises) {
        var fieldName, record, ref_id;
        fieldName = reference.name;
        if ((fieldName in instance) && (instance[fieldName] != null) && isKeyLike(instance[fieldName])) {
          ref_id = instance[fieldName];
          record = reference.model.Get(ref_id);
          instance[fieldName] = record;
          return promises.push(record.$promise);
        }
      };
      promises = [];
      for (name in this.constructor.fields) {
        def = this._getField(name);
        if (def.type === this.constructor.Reference) {
          fetchReference(this, def, promises);
        }
      }
      $q.all(promises).then((function(_this) {
        return function() {
          return _this.resolvePromise(_this.$meta.async.m2o.deferred);
        };
      })(this));
      return this;
    };

    Resource.prototype._fetchM2M = function() {
      var collections, def, fetchM2M, name, promises, refs_collection, _i, _len;
      fetchM2M = function(instance, m2m, promises, collections) {
        var fieldName, record, ref_id, refs_collection, refs_promises, _i, _len, _ref;
        fieldName = m2m.name;
        if ((fieldName in instance) && (instance[fieldName] != null) && angular.isArray(instance[fieldName])) {
          refs_promises = [];
          refs_collection = m2m.model._MakeCollection();
          _ref = instance[fieldName];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ref_id = _ref[_i];
            record = m2m.model.Get(ref_id);
            refs_collection.push(record);
            refs_promises.push(record.$promise);
          }
          instance[fieldName] = refs_collection;
          promises.push(refs_collection.$promise);
          return collections.push(refs_collection);
        } else {
          return instance[fieldName] = [];
        }
      };
      promises = [];
      collections = [];
      for (name in this.constructor.fields) {
        def = this._getField(name);
        if (def.type === this.constructor.ManyToMany) {
          fetchM2M(this, def, promises, collections);
        }
      }
      $q.all(promises).then((function(_this) {
        return function() {
          return _this.resolvePromise(_this.$meta.async.m2m.deferred);
        };
      })(this));
      for (_i = 0, _len = collections.length; _i < _len; _i++) {
        refs_collection = collections[_i];
        refs_collection.$finalize();
      }
      return this;
    };

    Resource.prototype._fromRemote = function(data) {
      this._fromRemoteObject(data);
      this.$meta.persisted = true;
      this.resolvePromise(this.$meta.async.direct.deferred);
      this._fetchRelations();
      return this;
    };

    Resource.prototype._resolvePromise = function(deferred, success) {
      if (success == null) {
        success = true;
      }
      if (success) {
        return deferred.resolve(this);
      }
      return deferred.reject(this);
    };

    Resource.prototype.resolvePromise = function(deferred, success) {
      if (success == null) {
        success = true;
      }
      if (this.$useApplyAsync) {
        $rootScope.$applyAsync((function(_this) {
          return function() {
            return _this._resolvePromise(deferred, success);
          };
        })(this));
      } else {
        this._resolvePromise(deferred, success);
        if (!$rootScope.$$phase) {
          $rootScope.$apply();
        }
      }
      return this;
    };

    Resource.prototype._getFields = function() {
      var fieldsSpec, name, value, _ref;
      fieldsSpec = {};
      _ref = this.constructor.defaults;
      for (name in _ref) {
        value = _ref[name];
        fieldsSpec[name] = {
          "default": value
        };
      }
      if (!(this.constructor.idField in fieldsSpec)) {
        fieldsSpec[this.constructor.idField] = {
          "default": null
        };
      }
      angular.extend(fieldsSpec, this.constructor.fields);
      return fieldsSpec;
    };

    Resource.prototype._getField = function(name) {
      var def;
      def = {
        name: name,
        remote: name,
        type: null,
        model: null
      };
      if (name in this.constructor.fields) {
        return angular.extend(def, this.constructor.fields[name] || {});
      }
      return def;
    };

    Resource.prototype._toObject = function() {
      var def, name, obj, result_values, value, values, _i, _len;
      obj = {};
      for (name in this) {
        if (!__hasProp.call(this, name)) continue;
        value = this[name];
        if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
          continue;
        }
        def = this._getField(name);
        obj[name] = value;
        if (!value) {
          continue;
        }
        if (def.type === this.constructor.Reference) {
          if (angular.isObject(value) || (value instanceof Resource)) {
            obj[name] = value.$id != null ? value.$id : null;
          }
        } else if (def.type === this.constructor.ManyToMany) {
          values = angular.isArray(value) ? value : [value];
          result_values = [];
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            if (angular.isObject(value) || (value instanceof Resource)) {
              result_values.push(value.$id != null ? value.$id : null);
            } else {
              result_values.push(value);
            }
          }
          obj[name] = result_values;
        }
      }
      return obj;
    };

    Resource.prototype._fromObject = function(obj) {
      var data, def, name, value;
      data = angular.extend({}, this.constructor.defaults, obj || {});
      for (name in data) {
        value = data[name];
        if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
          continue;
        }
        this[name] = value;
      }
      for (name in this.constructor.fields) {
        def = this._getField(name);
        if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
          continue;
        }
        if (!(name in data) && ('default' in def)) {
          this[name] = def["default"];
        }
      }
      return this;
    };

    Resource.prototype._toRemoteObject = function() {
      var def, name, obj, result_values, value, values, _i, _len;
      obj = {};
      for (name in this) {
        if (!__hasProp.call(this, name)) continue;
        value = this[name];
        if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
          continue;
        }
        def = this._getField(name);
        obj[def.remote] = value;
        if (!value) {
          continue;
        }
        if (def.type === this.constructor.Reference) {
          if (angular.isObject(value) || (value instanceof Resource)) {
            obj[def.remote] = value.$id != null ? value.$id : null;
          }
        } else if (def.type === this.constructor.ManyToMany) {
          values = angular.isArray(value) ? value : [value];
          result_values = [];
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            if (angular.isObject(value) || (value instanceof Resource)) {
              result_values.push(value.$id != null ? value.$id : null);
            } else {
              result_values.push(value);
            }
          }
          obj[def.remote] = result_values;
        }
      }
      return obj;
    };

    Resource.prototype._fromRemoteObject = function(obj) {
      var data, def, fieldsSpec, name, value, _ref;
      if (isEmpty(this.constructor.fields)) {
        data = angular.extend({}, this.constructor.defaults, obj || {});
        for (name in data) {
          value = data[name];
          if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
            continue;
          }
          this[name] = value;
        }
      } else {
        data = angular.extend({}, obj || {});
        fieldsSpec = this._getFields();
        for (name in fieldsSpec) {
          def = this._getField(name);
          if (name === '$id' || name === '$meta' || name === 'constructor' || name === '__proto__') {
            continue;
          }
          if (def.remote in data) {
            this[name] = data[def.remote];
          } else if ('default' in def) {
            this[name] = def["default"];
          }
        }
        _ref = this.constructor.defaults;
        for (name in _ref) {
          value = _ref[name];
          if (!(name in this)) {
            this[name] = value;
          }
        }
      }
      if (this.constructor.idField in data) {
        this.$id = obj[this.constructor.idField];
      }
      return this;
    };

    return Resource;

  })();
  return Resource;
}]);
