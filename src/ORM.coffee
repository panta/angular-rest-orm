angular.module("restOrm", [
]).factory("Resource", ($http, $q) ->
  class Resource
    @urlPrefix: ''
    @urlEndpoint: ''

    @idField: 'id'
    @defaults: {}
    @references: []
    @m2m: []
    @headers: {}

    @transformResponse: null

    @include: (obj) ->
      throw new Error('include(obj) requires obj') unless obj
      for key, value of obj when key not in ['included', 'extended']
        @::[key] = value
      obj.included?.apply(this)
      this

    @extend: (obj) ->
      throw new Error('extend(obj) requires obj') unless obj
      for key, value of obj when key not in ['included', 'extended']
        @[key] = value
      obj.extended?.apply(this)
      this

    @Subclass: (instances, statics) ->
      class Result extends this
      Result.include(instances) if instances
      Result.extend(statics) if statics
      Result::$super = (method) -> @constructor.__super__[method]
      Result

    constructor: (data=null, opts={}) ->
      @$meta =
        persisted: false
      angular.extend(@$meta, opts)

      @$id = null
      @_fromObject(data or {})

      # @$promise is a promise fulfilled when the object is completely fetched, complete
      # with relations (reference and m2m objects).
      # @$promiseDirect is fulfilled when the object is fetched (without caring for relations)
      @$promise = null
      @$promiseDirect = null

      @_setupPromises()
      @_fetchRelations()

      @$initialize?(arguments...)

    @Create: (data=null) ->
      data = data or @defaults
      item = new @(data, {persisted: false})
      item.$save()
      item

    @Get: (id) ->
      item = new @()
      url = @_GetURLBase() + "#{id}"
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'Get', 'GET', null
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'Get', method: 'GET', url: url, response: response
        }
        item._fromRemote(response.data)
      item

    @All: () ->
      collection = @_MakeCollection()
      url = @_GetURLBase()
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'All', 'GET', null
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'All', method: 'GET', url: url, response: response
        }
        for values in response.data
          collection.push @_MakeInstanceFromRemote(values)
        collection.$_getPromiseForItems().then ->
          collection.$meta.deferred.resolve(collection)
        collection.$meta.deferred_direct.resolve(collection)
      collection

    @Search: (field, value) ->
      e_field = encodeURIComponent(field)
      e_value = encodeURIComponent(value)
      url = "#{@GetUrlBase()}search/#{e_field}/#{e_value}"
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'Search', 'GET', null
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'Search', method: 'GET', url: url, response: response
        }
        @_MakeInstanceFromRemote(values) for values in response.data

    $save: ->
      data = @_toObject()
      if @$meta.persisted and @id?
        method = 'PUT'
        url = @_getURLBase() + "#{@id}"
      else
        method = 'POST'
        if 'id' of data
          delete data['id']
        url = @_getURLBase()

      # TODO: check deferred/promise re-setup
      @_setupPromises()

      headers = @_buildHeaders '$save', method
      $http(
        method: method
        url: url
        data: data
        cache: false
        headers: headers
      ).then (response) =>
        response = @_transformResponse response.data, {
          what: '$save', method: method, url: url, response: response
        }
        @_fromRemote(response.data)
      @

    # -----------------------------------------------------------------
    # PRIVATE METHODS
    # -----------------------------------------------------------------

    @_MakeCollection: ->
      collection = []
      collection.$meta =
        model: @
        deferred: $q.defer()
        deferred_direct: $q.defer()
      collection.$promise = collection.$meta.deferred.promise
      collection.$promiseDirect = collection.$meta.deferred_direct.promise
      collection.$getItemsPromises = ->
        (instance.$promise for instance in collection)
      collection.$getItemsPromiseDirects = ->
        (instance.$promiseDirect for instance in collection)
      collection.$_getPromiseForItems = ->
        $q.all collection.$getItemsPromises()
      collection.$_getPromiseDirectForItems = ->
        $q.all collection.$getItemsPromiseDirects()
      collection

    @_MakeInstanceFromRemote: (data) ->
      instance = new @()
      instance._fromRemote(data)
      instance

    @_GetURLBase: ->
      "#{@urlPrefix}#{@urlEndpoint}"

    @_BuildHeaders: (what=null, method=null, instance=null) ->
      if not @headers?
        return {}
      if angular.isFunction(@headers)
        return @headers.call(@, {klass: @, what: what, method: method, instance: instance})
      else if angular.isObject(@headers)
        processHeaderSource = (dst, src) =>
          for name, value of src
            if angular.isFunction(value)
              dst_value = value.call(@, {klass: @, what: what, method: method, instance: instance})
            else
              dst_value = value
            if dst_value != null
              dst[name] = dst_value
          dst

        dst_headers = {}
        if ('common' of @headers) or (what? and (what of @headers)) or (method? and (method of @headers))
          if 'common' of @headers
            processHeaderSource dst_headers, @headers.common
          if what? and (what of @headers)
            processHeaderSource dst_headers, @headers[what]
          if method? and (method of @headers)
            processHeaderSource dst_headers, @headers[method]
        else
          processHeaderSource dst_headers, @headers
        return dst_headers
      return {}

    @_TransformResponse: (data, info) ->
      info.klass = @
      if @transformResponse? and angular.isFunction(@transformResponse)
        return @transformResponse.call(@, data, info)
      return info.response

    _transformResponse: (data, info) ->
      info.instance = @
      @constructor._TransformResponse data, info

    _buildHeaders: (what=null, method=null) ->
      @constructor._BuildHeaders what, method, @

    _setupPromises: ->
      @$meta.$ref_promise = null
      @$meta.$m2m_promise = null

      @$meta.deferred = $q.defer()
      @$meta.deferred_direct = $q.defer()
      # @$promise is a promise fulfilled when the object is completely fetched, complete
      # with relations (reference and m2m objects).
      # @$promiseDirect is fulfilled when the object is fetched (without caring for relations)
      @$promise = $q.all([ @$meta.$ref_promise, @$meta.$m2m_promise ])
      @$promiseDirect = @$meta.deferred_direct.promise
      @

    _getURLBase: ->
      "#{@constructor.urlPrefix}#{@constructor.urlEndpoint}"

    _fetchRelations: ->
      @_fetchReferences()
      @_fetchM2M()
      @

    _fetchReferences: ->
      fetchReference = (instance, reference, promises) ->
        fieldName = reference.name
        if (fieldName of instance) and instance[fieldName]
          ref_id = instance[fieldName]
          promises.push reference.model.get(ref_id).then((record) ->
            instance[fieldName] = record
            instance["#{fieldName}_id"] = ref_id
            return instance
          )
      promises = []
      for reference in @constructor.references
        fetchReference(@, reference, promises)
      @$meta.$ref_promise = $q.all(promises)
      @

    _fetchM2M: ->
      fetchM2M = (instance, m2m, promises) ->
        fieldName = m2m.name
        if (fieldName of instance) and instance[fieldName]
          refs_promises = []
          for ref_id in instance[fieldName]
            refs_promises.push m2m.model.get(ref_id)
          promises.push $q.all(refs_promises).then((records) ->
            instance[fieldName] = records
            return instance
          )
        else
          instance[fieldName] = []
      promises = []
      for m2m in @constructor.m2m
        fetchM2M(@, m2m, promises)
      @$meta.$m2m_promise = $q.all(promises)
      @

    _fromRemote: (data) ->
      @_fromObject(data)
      @$meta.persisted = true
      @$meta.deferred_direct.resolve(@)
      @_fetchRelations()
      return @

    _toObject: ->
      obj = {}
      for own k, v of @
        if k in ['$meta', 'constructor', '__proto__']
          continue
        obj[k] = v

      for reference in @constructor.references
        fieldName = reference.name
        continue if not (fieldName of obj)
        value = obj[fieldName]
        continue if not value
        if angular.isObject(value) or (value instanceof Resource)
          obj[fieldName] = if value.id? then value.id else null

      for reference in @constructor.m2m
        fieldName = reference.name
        continue if not (fieldName of obj)
        values = obj[fieldName]
        continue if not values
        if not angular.isArray(values)
          values = [ values ]
        values_new = []
        for value in values
          if angular.isObject(value) or (value instanceof Resource)
            values_new.push(if value.id? then value.id else null)
          else
            values_new.push(value)
        obj[fieldName] = values_new

      obj

    _fromObject: (obj) ->
      data = angular.extend({}, @constructor.defaults, obj or {})
      for k, v of data
        if k in ['$meta', 'constructor', '__proto__']
          continue
        @[k] = v
      if @constructor.idField of data
        @$id = obj[@constructor.idField]
      @
)
