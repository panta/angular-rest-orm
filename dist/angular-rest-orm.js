/**
 * Angular ORM for HTTP REST APIs
 * @version angular-rest-orm - v0.2.5 - 2014-08-31
 * @link https://github.com/panta/angular-rest-orm
 * @author Marco Pantaleoni <marco.pantaleoni@gmail.com>
 *
 * Copyright (c) 2014 Marco Pantaleoni <marco.pantaleoni@gmail.com>
 * Licensed under the MIT License, http://opensource.org/licenses/MIT
 */
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

angular.module("restOrm", []).factory("Resource", ['$http', '$q', function($http, $q) {
  var Resource;
  return Resource = (function() {
    Resource.urlPrefix = '';

    Resource.urlEndpoint = '';

    Resource.idField = 'id';

    Resource.defaults = {};

    Resource.references = [];

    Resource.m2m = [];

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
        persisted: false
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

    Resource.Create = function(data) {
      var item;
      if (data == null) {
        data = null;
      }
      data = data || this.defaults;
      item = new this(data, {
        persisted: false
      });
      item.$save();
      return item;
    };

    Resource.Get = function(id) {
      var item;
      item = new this();
      $http({
        method: "GET",
        url: this._GetURLBase() + ("" + id)
      }).then(function(result) {
        return item._fromRemote(result.data);
      });
      return item;
    };

    Resource.All = function() {
      var collection;
      collection = this._MakeCollection();
      $http({
        method: "GET",
        url: this._GetURLBase()
      }).then((function(_this) {
        return function(result) {
          var values, _i, _len, _ref;
          _ref = result.data;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            values = _ref[_i];
            collection.push(_this._MakeInstanceFromRemote(values));
          }
          collection.$_getPromiseForItems().then(function() {
            return collection.$meta.deferred.resolve(collection);
          });
          return collection.$meta.deferred_direct.resolve(collection);
        };
      })(this));
      return collection;
    };

    Resource.Search = function(field, value) {
      var e_field, e_value, url;
      e_field = encodeURIComponent(field);
      e_value = encodeURIComponent(value);
      url = "" + (this.GetUrlBase()) + "search/" + e_field + "/" + e_value;
      return $http({
        method: "GET",
        url: url
      }).then((function(_this) {
        return function(result) {
          var values, _i, _len, _ref, _results;
          _ref = result.data;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            values = _ref[_i];
            _results.push(_this._MakeInstanceFromRemote(values));
          }
          return _results;
        };
      })(this));
    };

    Resource.prototype.$save = function() {
      var data, method, url;
      data = this._toObject();
      if (this.$meta.persisted && (this.id != null)) {
        method = 'PUT';
        url = this._getURLBase() + ("" + this.id);
      } else {
        method = 'POST';
        if ('id' in data) {
          delete data['id'];
        }
        url = this._getURLBase();
      }
      this._setupPromises();
      $http({
        method: method,
        url: url,
        data: data,
        cache: false
      }).then((function(_this) {
        return function(result) {
          return _this._fromRemote(result.data);
        };
      })(this));
      return this;
    };

    Resource._MakeCollection = function() {
      var collection;
      collection = [];
      collection.$meta = {
        model: this,
        deferred: $q.defer(),
        deferred_direct: $q.defer()
      };
      collection.$promise = collection.$meta.deferred.promise;
      collection.$promiseDirect = collection.$meta.deferred_direct.promise;
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
      return collection;
    };

    Resource._MakeInstanceFromRemote = function(data) {
      var instance;
      instance = new this();
      instance._fromRemote(data);
      return instance;
    };

    Resource._GetURLBase = function() {
      return "" + this.urlPrefix + this.urlEndpoint;
    };

    Resource.prototype._setupPromises = function() {
      this.$meta.$ref_promise = null;
      this.$meta.$m2m_promise = null;
      this.$meta.deferred = $q.defer();
      this.$meta.deferred_direct = $q.defer();
      this.$promise = $q.all([this.$meta.$ref_promise, this.$meta.$m2m_promise]);
      this.$promiseDirect = this.$meta.deferred_direct.promise;
      return this;
    };

    Resource.prototype._getURLBase = function() {
      return "" + this.constructor.urlPrefix + this.constructor.urlEndpoint;
    };

    Resource.prototype._fetchRelations = function() {
      this._fetchReferences();
      this._fetchM2M();
      return this;
    };

    Resource.prototype._fetchReferences = function() {
      var fetchReference, promises, reference, _i, _len, _ref;
      fetchReference = function(instance, reference, promises) {
        var fieldName, ref_id;
        fieldName = reference.name;
        if ((fieldName in instance) && instance[fieldName]) {
          ref_id = instance[fieldName];
          return promises.push(reference.model.get(ref_id).then(function(record) {
            instance[fieldName] = record;
            instance["" + fieldName + "_id"] = ref_id;
            return instance;
          }));
        }
      };
      promises = [];
      _ref = this.constructor.references;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reference = _ref[_i];
        fetchReference(this, reference, promises);
      }
      this.$meta.$ref_promise = $q.all(promises);
      return this;
    };

    Resource.prototype._fetchM2M = function() {
      var fetchM2M, m2m, promises, _i, _len, _ref;
      fetchM2M = function(instance, m2m, promises) {
        var fieldName, ref_id, refs_promises, _i, _len, _ref;
        fieldName = m2m.name;
        if ((fieldName in instance) && instance[fieldName]) {
          refs_promises = [];
          _ref = instance[fieldName];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ref_id = _ref[_i];
            refs_promises.push(m2m.model.get(ref_id));
          }
          return promises.push($q.all(refs_promises).then(function(records) {
            instance[fieldName] = records;
            return instance;
          }));
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
      this.$meta.$m2m_promise = $q.all(promises);
      return this;
    };

    Resource.prototype._fromRemote = function(data) {
      this._fromObject(data);
      this.$meta.persisted = true;
      this.$meta.deferred_direct.resolve(this);
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
        if (!value) {
          continue;
        }
        if (angular.isObject(value) || (value instanceof Resource)) {
          obj[fieldName] = value.id != null ? value.id : null;
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
        if (!values) {
          continue;
        }
        if (!angular.isArray(values)) {
          values = [values];
        }
        values_new = [];
        for (_k = 0, _len2 = values.length; _k < _len2; _k++) {
          value = values[_k];
          if (angular.isObject(value) || (value instanceof Resource)) {
            values_new.push(value.id != null ? value.id : null);
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
        if (k === '$meta' || k === 'constructor' || k === '__proto__') {
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
}]);
