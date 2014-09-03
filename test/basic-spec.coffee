describe "ORM basic functionality:", ->
  $rootScope = undefined
  $httpBackend = undefined
  $q = undefined
  Resource = undefined
  Book = undefined

  beforeEach module("restOrm")

  beforeEach inject(($injector) ->
    $rootScope = $injector.get("$rootScope")
    $httpBackend = $injector.get("$httpBackend")
    $q = $injector.get("$q")
    Resource = $injector.get("Resource")

    class Book extends Resource
      @urlEndpoint: '/api/v1/books/'
      @defaults:
        title: ""
        subtitle: ""
        author: null
        tags: []

      $initialize: ->
        @abc = 42
    #return
  )

  describe "Resource constructor", ->
    it "creates new instance", ->
      book = new Book()
      expect(book).toBeDefined()
      expect(book instanceof Book).toBeTruthy()
      return
    it "calls instance $initialize", ->
      spyOn(Book.prototype, '$initialize').andCallThrough()
      book = new Book()
      expect(Book.prototype.$initialize).toHaveBeenCalled()
      expect(book.abc).toBeDefined()
      expect(book.abc).toEqual(42)
      return
    return
    it "should return a properfly formed instance", ->
      book = new Book()
      expect(book.$meta).toBeDefined()
      expect(book.$meta.persisted).toBeFalsy()
      expect(book.$promise.then).toBeDefined()
      expect(book.$id).toBeDefined()
      expect(book.$id).toEqual(null)
      return
    it "should have defaults", ->
      book = new Book()
      expect(book.title).toEqual("")
      expect(book.subtitle).toEqual("")
      expect(book.author).toEqual(null)
      expect(book.tags).toEqual([])
      return

    return

  describe "Resource.Create()", ->
    it "returns new instance", ->
      book = Book.Create()
      expect(book).toBeDefined()
      expect(book instanceof Book).toBeTruthy()
      return
    it "returns new instance with defaults", ->
      book = Book.Create()
      expect(book.title).toEqual("")
      expect(book.subtitle).toEqual("")
      expect(book.author).toEqual(null)
      expect(book.tags).toEqual([])
      return
    it "returns new instance with passed values", ->
      book = Book.Create({ 'title': "Moby Dick" })
      expect(book.title).toEqual("Moby Dick")
      return
    it "returns new instance with defaults when incomplete values are given", ->
      book = Book.Create({ 'title': "Moby Dick" })
      expect(book.title).toEqual("Moby Dick")
      expect(book.subtitle).toEqual("")
      expect(book.author).toEqual(null)
      expect(book.tags).toEqual([])
      return
    it "uses correct REST endpoint", ->
      book = Book.Create({ 'title': "Moby Dick" })
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      return
    it "fulfills instance $promiseDirect", ->
      book = Book.Create({ 'title': "Moby Dick" })
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills instance $promise", ->
      book = Book.Create({ 'title': "Moby Dick" })
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "creates an instance with an id", ->
      book = Book.Create({ 'title': "Moby Dick" })
      expect(book.$id).toEqual(null)
      expect(book.$meta.persisted).toBeFalsy()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.$meta.persisted).toBeTruthy()
      expect(book.$id).toEqual(1)
      return
    it "instance $promise result is the instance itself", ->
      # TODO
      # book = Book.Create({ 'title': "Moby Dick" })
      # $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      # $httpBackend.flush()
      # handler = jasmine.createSpy('success')
      # book.$promise.then handler
      # $rootScope.$digest()
      # result = handler.mostRecentCall.args[0]
      # expect(result).toBe(book)
      return
    it "should handle params", ->
      $httpBackend.expect('POST', '/api/v1/books/?mode=full').respond(200, { id: 1, title: "Moby Dick" })
      book = Book.Create { 'title': "Moby Dick" },
        params: {mode: "full"}
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("Moby Dick")
      return

    return

  describe "Resource.Get()", ->
    it "should return a proper model instance", ->
      book = Book.Get(1)
      expect(book).toBeDefined()
      expect(book instanceof Book).toBeTruthy()
      expect(book.$meta).toBeDefined()
      expect(book.$promise.then).toBeDefined()
      expect(book.$promiseDirect.then).toBeDefined()
      return
    it "uses correct REST endpoint", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle", subtitle: "" })
      $httpBackend.flush()
      return
    it "fulfills instance $promiseDirect", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills instance $promise", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle", subtitle: "", author: null, tags: [] } )
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "returns an instance with an id", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.$id).toEqual(1)
      return
    it "returns instance with values from server", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle")
      return
    it "returns instance with defaults where not provided by server", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.subtitle).toBeDefined()
      expect(book.subtitle).toEqual("")
      expect(book.author).toEqual(null)
      expect(book.tags).toEqual([])
      return
    it "should handle params", ->
      $httpBackend.expect('GET', '/api/v1/books/1?mode=full', (data) ->
        return (data == "{}")
      ).respond(200, { id: 1, title: "The Jungle" })
      book = Book.Get 1,
        params: {mode: "full"}
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle")
      return
    it "should handle data", ->
      $httpBackend.expect('GET', '/api/v1/books/1', (data) ->
        return false if not (data and angular.isString(data))
        data = JSON.parse(data)
        return data and data.mode? and (data.mode == "full")
      ).respond(200, { id: 1, title: "The Jungle" })
      book = Book.Get 1,
        data: {mode: "full"}
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle")
      return

    return

  describe "Resource.All()", ->
    it "should return a proper collection", ->
      collection = Book.All()
      expect(collection).toBeDefined()
      expect(angular.isArray(collection)).toBeTruthy()
      expect(collection.$meta).toBeDefined()
      expect(collection.$promise.then).toBeDefined()
      expect(collection.$promiseDirect.then).toBeDefined()
      return
    it "uses correct REST endpoint", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [])
      $httpBackend.flush()
      return
    it "fulfills collection $promiseDirect", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      collection.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills collection $promise", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      collection.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "collection $promise result is the collection itself", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      collection.$promise.then handler
      $rootScope.$digest()
      result = handler.mostRecentCall.args[0]
      expect(result).toBe(collection)
      return
    it "fulfills every instance $promiseDirect", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      for instance in collection
        handler = jasmine.createSpy('success')
        instance.$promiseDirect.then handler
        $rootScope.$digest()
        expect(handler).toHaveBeenCalled()
      return
    it "fulfills every instance $promise", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      for instance in collection
        handler = jasmine.createSpy('success')
        instance.$promise.then handler
        $rootScope.$digest()
        expect(handler).toHaveBeenCalled()
      return
    it "should return a collection of instances", ->
      collection = Book.All()
      $httpBackend.when('GET', '/api/v1/books/').respond(200, [ { id: 1, title: "The Jungle", subtitle: "" }, { id: 2, title: "Robinson Crusoe" } ])
      $httpBackend.flush()
      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(collection.length).toEqual(2)
      expect(collection[0] instanceof Book).toBeTruthy()
      expect(collection[0].id).toEqual(1)
      expect(collection[0].$id).toBeDefined()
      expect(collection[0].$id).toEqual(1)
      expect(collection[0].title).toEqual("The Jungle")
      expect(collection[1] instanceof Book).toBeTruthy()
      expect(collection[1].id).toEqual(2)
      expect(collection[1].$id).toBeDefined()
      expect(collection[1].$id).toEqual(2)
      expect(collection[1].title).toEqual("Robinson Crusoe")
      return
    it "should handle params", ->
      $httpBackend.expect('GET', '/api/v1/books/?title=Robinson+Crusoe', (data) ->
        return (data == "{}")
      ).respond(200, [ { id: 2, title: "Robinson Crusoe" } ])
      collection = Book.All
        params: {title: "Robinson Crusoe"}
      $httpBackend.flush()
      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(collection.length).toEqual(1)
      return
    it "should handle data", ->
      $httpBackend.expect('GET', '/api/v1/books/', (data) ->
        return false if not (data and angular.isString(data))
        data = JSON.parse(data)
        return data and data.title? and (data.title == "Robinson Crusoe")
      ).respond(200, [ { id: 2, title: "Robinson Crusoe" } ])
      collection = Book.All
        data: {title: "Robinson Crusoe"}
      $httpBackend.flush()
      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(collection.length).toEqual(1)
      return

    return

  describe "instance .$save()", ->
    it "should return the instance itself", ->
      book = new Book()
      result = book.$save()
      expect(result).toBeDefined()
      expect(result instanceof Book).toBeTruthy()
      expect(result).toBe(book)
      return
    it "uses correct REST endpoint for fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      return
    it "uses correct REST endpoint for existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      return
    it "fulfills $promiseDirect for fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills $promise for fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills $promiseDirect for existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promiseDirect.then jasmine.createSpy('success')
      $rootScope.$digest()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills $promise for existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills new $promiseDirect", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promiseDirect.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "fulfills new $promise", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      handler = jasmine.createSpy('success')
      book.$promise.then handler
      $rootScope.$digest()
      expect(handler).toHaveBeenCalled()
      return
    it "provides an id to a fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.$id).toBeDefined()
      expect(book.$id).toEqual(1)
      return
    it "saves fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle")
      return
    it "saves changed values of existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle 2.0" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle 2.0")
      return
    it "should handle params for fresh instance", ->
      $httpBackend.expect('POST', '/api/v1/books/?mode=full').respond(200, { id: 1, title: "The Jungle" })
      book = new Book({ title: "The Jungle" })
      book.$save
        params: {mode: "full"}
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle")
      return
    it "should handle params for existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200, { id: 1, title: "The Jungle" })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      $httpBackend.expect('PUT', '/api/v1/books/1?mode=full').respond(200, { id: 1, title: "The Jungle 2.0" })
      book.title = "The Jungle 2.0"
      book.$save
        params: {mode: "full"}
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.title).toEqual("The Jungle 2.0")
      return
    return

  return
