angular.module("restOrm", [
]).factory("Resource", ($http, $q) ->

  # based on http://stackoverflow.com/a/4994244
  isEmpty = (obj) ->
    # null and undefined are "empty"
    return true  unless obj?

    # Assume if it has a length property with a non-zero value
    # that that property is correct.
    return false  if obj.length > 0
    return true  if obj.length is 0

    # Otherwise, does it have any properties of its own?
    # Note that this doesn't handle
    # toString and valueOf enumeration bugs in IE < 9
    for own key of obj
      return false
    true

  startsWith = (s, sub) -> s.slice(0, sub.length) == sub
  endsWith   = (s, sub) -> sub == '' or s.slice(-sub.length) == sub

  # based on http://stackoverflow.com/a/2676231
  _urljoin = (components...) ->
    normalize = (str) ->
      str.replace(/[\/]+/g, "/").replace(/\/\?/g, "?").replace(/\/\#/g, "#").replace /\:\//g, "://"
    url_result = []

    if components and (components.length > 0)
      skip = 0
      while (skip < components.length)
        if components[skip]
          break
        ++skip
      components = components[skip..] if skip

    last_comp = null
    for component in components
      continue if not (component? and component)
      last_comp = component
      c_url = "#{component}".split("/")
      for i in [0...c_url.length]
        if c_url[i] is ".."
          url_result.pop()
        else if (c_url[i] is ".") or (c_url[i] is "")
          continue
        else
          url_result.push c_url[i]

    r = normalize url_result.join("/")
    if components and (components.length >= 1)
      component = "#{components[0]}"
      if startsWith(component, "//")
        r = "//" + r
      else if startsWith(component, "/")
        r = "/" + r

      last_comp = "#{last_comp}"
      if endsWith(last_comp, "/") and (not endsWith(r, "/"))
        r = r + "/"
    r

  urljoin = ->
    encodeURI _urljoin arguments...

  class Resource
    @urlPrefix: ''
    @urlEndpoint: ''

    @idField: 'id'
    @fields = {}
    @defaults: {}
    @headers: {}

    @transformResponse: null

    @Reference: 'reference'       # many-to-one
    @ManyToMany: 'many2many'      # many-to-many

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
        async:
          direct:
            deferred: null
            resolved: true          # signal we need to create it
          m2o:
            deferred: null
            resolved: true          # signal we need to create it
          m2m:
            deferred: null
            resolved: true          # signal we need to create it
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

    @Create: (data=null, opts={}) ->
      data = data or @defaults
      item = new @(data, {persisted: false})
      item.$save(opts)
      item

    @Get: (id, opts={}) ->
      item = new @()
      url = urljoin @_GetURLBase(), id
      item._setupPromises()
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'Get', 'GET', null
        params: opts.params or {}
        data: opts.data or {}
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'Get', method: 'GET', url: url, response: response
        }
        item._fromRemote(response.data)
      item

    @All: (opts={}) ->
      collection = @_MakeCollection()
      url = urljoin @_GetURLBase()
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'All', 'GET', null
        params: opts.params or {}
        data: opts.data or {}
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'All', method: 'GET', url: url, response: response
        }
        for values in response.data
          collection.push @_MakeInstanceFromRemote(values)
        collection.$finalize()
      collection

    @Search: (field, value, opts={}) ->
      url = urljoin @GetUrlBase(), "search", field, value
      $http(
        method: "GET"
        url: url
        headers: @_BuildHeaders 'Search', 'GET', null
        params: opts.params or {}
        data: opts.data or {}
      ).then (response) =>
        response = @_TransformResponse response.data, {
          what: 'Search', method: 'GET', url: url, response: response
        }
        @_MakeInstanceFromRemote(values) for values in response.data

    $save: (opts={}) ->
      data = @_toRemoteObject()
      if @$meta.persisted and @$id?
        method = 'PUT'
        url = urljoin @_getURLBase(), @$id
      else
        method = 'POST'
        if @constructor.idField of data
          delete data[@constructor.idField]
        url = urljoin @_getURLBase()

      # TODO: check deferred/promise re-setup
      @_setupPromises()

      headers = @_buildHeaders '$save', method
      $http(
        method: method
        url: url
        data: data
        cache: false
        headers: headers
        params: opts.params or {}
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
        async:
          direct:
            deferred: $q.defer()
            resolved: false
          complete:
            deferred: $q.defer()
            resolved: false
      collection.$promise = collection.$meta.async.complete.deferred.promise
      collection.$promiseDirect = collection.$meta.async.direct.deferred.promise
      collection.$getItemsPromises = ->
        (instance.$promise for instance in collection)
      collection.$getItemsPromiseDirects = ->
        (instance.$promiseDirect for instance in collection)
      collection.$_getPromiseForItems = ->
        $q.all collection.$getItemsPromises()
      collection.$_getPromiseDirectForItems = ->
        $q.all collection.$getItemsPromiseDirects()
      collection.$finalize = ->
        collection.$_getPromiseForItems().then ->
          collection.$meta.async.complete.deferred.resolve(collection)
          collection.$meta.async.complete.resolved = true
        collection.$meta.async.direct.deferred.resolve(collection)
        collection.$meta.async.direct.resolved = true
        collection
      collection

    @_MakeInstanceFromRemote: (data) ->
      instance = new @()
      instance._setupPromises()
      instance._fromRemote(data)
      instance

    @_GetURLBase: ->
      _urljoin @urlPrefix, @urlEndpoint

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
      # @$promise is a promise fulfilled when the object is completely fetched, complete
      # with relations (reference and m2m objects).
      # @$promiseDirect is fulfilled when the object is fetched (without caring for relations)

      changed = false
      if @$meta.async.direct.resolved or (not @$meta.async.direct.deferred?)
        # console.log "#{@constructor.name}: creating new direct promise ($promiseDirect)"
        @$meta.async.direct.deferred = $q.defer()
        @$meta.async.direct.resolved = false
        changed = true

        @$promiseDirect = @$meta.async.direct.deferred.promise.then =>
          @$meta.async.direct.resolved = true
          # console.log "#{@constructor.name}: resolved $promiseDirect"
          return @

      if @$meta.async.m2o.resolved or (not @$meta.async.m2o.deferred?)
        # console.log "#{@constructor.name}: creating new m2o promise"
        @$meta.async.m2o.deferred = $q.defer()
        @$meta.async.m2o.resolved = false
        changed = true

        @$meta.async.m2o.deferred.promise.then =>
          @$meta.async.m2o.resolved = true
          # console.log "#{@constructor.name}: resolved m2o"
          return @

      if @$meta.async.m2m.resolved or (not @$meta.async.m2m.deferred?)
        # console.log "#{@constructor.name}: creating new m2m promise"
        @$meta.async.m2m.deferred = $q.defer()
        @$meta.async.m2m.resolved = false
        changed = true

        @$meta.async.m2m.deferred.promise.then =>
          @$meta.async.m2m.resolved = true
          # console.log "#{@constructor.name}: resolved m2m"
          return @

      if changed
        # console.log "#{@constructor.name}: creating new $promise"
        @$promise = $q.all([
          @$meta.async.direct.deferred.promise,
          @$meta.async.m2o.deferred.promise,
          @$meta.async.m2m.deferred.promise
        ]).then =>
          @$meta.async.direct.resolved = true
          @$meta.async.m2o.resolved = true
          @$meta.async.m2m.resolved = true
          # console.log "#{@constructor.name}: resolved everything ($promise)"
          return @
      @

    _getURLBase: ->
      _urljoin @constructor.urlPrefix, @constructor.urlEndpoint

    _fetchRelations: ->
      if @$id
        @_fetchReferences()
        @_fetchM2M()
      @

    _fetchReferences: ->
      fetchReference = (instance, reference, promises) ->
        fieldName = reference.name
        if (fieldName of instance) and instance[fieldName]
          ref_id = instance[fieldName]
          record = reference.model.Get(ref_id)
          instance[fieldName] = record
          promises.push record.$promise
      promises = []
      for name of @constructor.fields
        def = @_getField(name)
        if def.type is @constructor.Reference
          fetchReference(@, def, promises)
      $q.all(promises).then =>
        @$meta.async.m2o.deferred.resolve(@)
      @

    _fetchM2M: ->
      fetchM2M = (instance, m2m, promises) ->
        fieldName = m2m.name
        if (fieldName of instance) and instance[fieldName]
          refs_promises = []
          refs_collection = m2m.model._MakeCollection()
          for ref_id in instance[fieldName]
            record = m2m.model.Get(ref_id)
            refs_collection.push record
            refs_promises.push record.$promise
          instance[fieldName] = refs_collection
          promises.push refs_collection.$promise
          refs_collection.$finalize()
        else
          instance[fieldName] = []
      promises = []
      for name of @constructor.fields
        def = @_getField(name)
        if def.type is @constructor.ManyToMany
          fetchM2M(@, def, promises)
      $q.all(promises).then =>
        @$meta.async.m2m.deferred.resolve(@)
      @

    _fromRemote: (data) ->
      @_fromRemoteObject(data)
      @$meta.persisted = true
      @$meta.async.direct.deferred.resolve(@)
      @_fetchRelations()
      return @

    _getField: (name) ->
      def = {name: name, remote: name, type: null, model: null}
      if name of @constructor.fields
        return angular.extend(def, @constructor.fields[name] or {})
      def

    _toObject: ->
      obj = {}

      for own name, value of @
        if name in ['$id', '$meta', 'constructor', '__proto__']
          continue
        def = @_getField(name)
        obj[name] = value
        continue if not value
        if def.type is @constructor.Reference
          if angular.isObject(value) or (value instanceof Resource)
            obj[name] = if value.$id? then value.$id else null
        else if def.type is @constructor.ManyToMany
          values = if angular.isArray(value) then value else [ value ]
          result_values = []
          for value in values
            if angular.isObject(value) or (value instanceof Resource)
              result_values.push(if value.$id? then value.$id else null)
            else
              result_values.push(value)
          obj[name] = result_values

      obj

    _fromObject: (obj) ->
      data = angular.extend({}, @constructor.defaults, obj or {})

      for name, value of data
        if name in ['$id', '$meta', 'constructor', '__proto__']
          continue
        @[name] = value

      for name of @constructor.fields
        def = @_getField(name)
        if name in ['$id', '$meta', 'constructor', '__proto__']
          continue
        if not (name of data) and ('default' of def)
          @[name] = def.default
      @

    _toRemoteObject: ->
      obj = {}

      for own name, value of @
        if name in ['$id', '$meta', 'constructor', '__proto__']
          continue
        def = @_getField(name)
        obj[def.remote] = value
        continue if not value
        if def.type is @constructor.Reference
          if angular.isObject(value) or (value instanceof Resource)
            obj[def.remote] = if value.$id? then value.$id else null
        else if def.type is @constructor.ManyToMany
          values = if angular.isArray(value) then value else [ value ]
          result_values = []
          for value in values
            if angular.isObject(value) or (value instanceof Resource)
              result_values.push(if value.$id? then value.$id else null)
            else
              result_values.push(value)
          obj[def.remote] = result_values

      obj

    _fromRemoteObject: (obj) ->
      if isEmpty(@constructor.fields)
        data = angular.extend({}, @constructor.defaults, obj or {})

        for name, value of data
          if name in ['$id', '$meta', 'constructor', '__proto__']
            continue
          @[name] = value
      else
        data = angular.extend({}, obj or {})

        for name of @constructor.fields
          def = @_getField(name)
          if name in ['$id', '$meta', 'constructor', '__proto__']
            continue
          if def.remote of data
            @[name] = data[def.remote]
          else if 'default' of def
            @[name] = def.default

        for name, value of @constructor.defaults
          if not (name of @)
            @[name] = value

      if @constructor.idField of data
        @$id = obj[@constructor.idField]
      @

  Resource
)
