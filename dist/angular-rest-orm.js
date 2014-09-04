/**
 * Angular ORM for HTTP REST APIs
 * @version angular-rest-orm - v0.3.1 - 2014-09-04
 * @link https://github.com/panta/angular-rest-orm
 * @author Marco Pantaleoni <marco.pantaleoni@gmail.com>
 *
 * Copyright (c) 2014 Marco Pantaleoni <marco.pantaleoni@gmail.com>
 * Licensed under the MIT License, http://opensource.org/licenses/MIT
 */
var __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module("restOrm", []).factory("Resource", ['$http', '$q', function($http, $q) {
  var Resource, endsWith, startsWith, urljoin, _urljoin;
  startsWith = function(s, sub) {
    return s.slice(0, sub.length) === sub;
  };
  endsWith = function(s, sub) {
    return sub === '' || s.slice(-sub.length) === sub;
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
  Resource = (function() {
    Resource.urlPrefix = '';

    Resource.urlEndpoint = '';

    Resource.idField = 'id';

    Resource.defaults = {};

    Resource.references = [];

    Resource.m2m = [];

    Resource.headers = {};

    Resource.transformResponse = null;

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

    Resource.prototype.$save = function(opts) {
      var data, headers, method, url;
      if (opts == null) {
        opts = {};
      }
      data = this._toObject();
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
      collection.$finalize = function() {
        collection.$_getPromiseForItems().then(function() {
          collection.$meta.async.complete.deferred.resolve(collection);
          return collection.$meta.async.complete.resolved = true;
        });
        collection.$meta.async.direct.deferred.resolve(collection);
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
      if (this.$id) {
        this._fetchReferences();
        this._fetchM2M();
      }
      return this;
    };

    Resource.prototype._fetchReferences = function() {
      var fetchReference, promises, reference, _i, _len, _ref;
      fetchReference = function(instance, reference, promises) {
        var fieldName, record, ref_id;
        fieldName = reference.name;
        if ((fieldName in instance) && instance[fieldName]) {
          ref_id = instance[fieldName];
          record = reference.model.Get(ref_id);
          instance[fieldName] = record;
          return promises.push(record.$promise);
        }
      };
      promises = [];
      _ref = this.constructor.references;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reference = _ref[_i];
        fetchReference(this, reference, promises);
      }
      $q.all(promises).then((function(_this) {
        return function() {
          return _this.$meta.async.m2o.deferred.resolve(_this);
        };
      })(this));
      return this;
    };

    Resource.prototype._fetchM2M = function() {
      var fetchM2M, m2m, promises, _i, _len, _ref;
      fetchM2M = function(instance, m2m, promises) {
        var fieldName, record, ref_id, refs_collection, refs_promises, _i, _len, _ref;
        fieldName = m2m.name;
        if ((fieldName in instance) && instance[fieldName]) {
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
          return refs_collection.$finalize();
        } else {
          return instance[fieldName] = [];
        }
      };
      promises = [];
      _ref = this.constructor.m2m;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        m2m = _ref[_i];
        fetchM2M(this, m2m, promises);
      }
      $q.all(promises).then((function(_this) {
        return function() {
          return _this.$meta.async.m2m.deferred.resolve(_this);
        };
      })(this));
      return this;
    };

    Resource.prototype._fromRemote = function(data) {
      this._fromObject(data);
      this.$meta.persisted = true;
      this.$meta.async.direct.deferred.resolve(this);
      this._fetchRelations();
      return this;
    };

    Resource.prototype._toObject = function() {
      var fieldName, k, obj, reference, v, value, values, values_new, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      obj = {};
      for (k in this) {
        if (!__hasProp.call(this, k)) continue;
        v = this[k];
        if (k === '$meta' || k === 'constructor' || k === '__proto__') {
          continue;
        }
        obj[k] = v;
      }
      _ref = this.constructor.references;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reference = _ref[_i];
        fieldName = reference.name;
        if (!(fieldName in obj)) {
          continue;
        }
        value = obj[fieldName];
        if (!((value != null) && value)) {
          continue;
        }
        if (angular.isObject(value) || (value instanceof Resource)) {
          obj[fieldName] = value.$id != null ? value.$id : null;
        }
      }
      _ref1 = this.constructor.m2m;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        reference = _ref1[_j];
        fieldName = reference.name;
        if (!(fieldName in obj)) {
          continue;
        }
        values = obj[fieldName];
        if (!((values != null) && values)) {
          continue;
        }
        if (!angular.isArray(values)) {
          values = [values];
        }
        values_new = [];
        for (_k = 0, _len2 = values.length; _k < _len2; _k++) {
          value = values[_k];
          if (angular.isObject(value) || (value instanceof Resource)) {
            values_new.push(value.$id != null ? value.$id : null);
          } else {
            values_new.push(value);
          }
        }
        obj[fieldName] = values_new;
      }
      return obj;
    };

    Resource.prototype._fromObject = function(obj) {
      var data, k, v;
      data = angular.extend({}, this.constructor.defaults, obj || {});
      for (k in data) {
        v = data[k];
        if (k === '$id' || k === '$meta' || k === 'constructor' || k === '__proto__') {
          continue;
        }
        this[k] = v;
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
