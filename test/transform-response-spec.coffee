describe "response transform:", ->
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
  )

  describe "transformResponse", ->
    beforeEach ->
      class Book extends Resource
        @urlEndpoint: '/api/v1/books/'
        @defaults:
          title: ""
          subtitle: ""
        @transformResponse: (data, info) ->
          if info.what == 'All'
            newData = []
            for k, v of data
              newData.push v
            return { data: newData }
          else if info.what == 'Get'
            return { data: data[0] }
          else if info.what == '$save'
            return { data: data[0] }
          return info.response

    it "should work for .All()", ->
      collection = Book.All()

      $httpBackend.when('GET', '/api/v1/books/').respond(200,
        {
          0: { id: 1, title: "The Jungle", subtitle: "" },
          1: { id: 2, title: "Robinson Crusoe" }
        })
      $httpBackend.flush()

      collection.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(collection.length).toEqual(2)
      expect(collection[0] instanceof Book).toBeTruthy()
      expect(collection[0].$id).toEqual(1)
      expect(collection[0].title).toEqual("The Jungle")
      expect(collection[1] instanceof Book).toBeTruthy()
      expect(collection[1].$id).toEqual(2)
      expect(collection[1].title).toEqual("Robinson Crusoe")
      return

    it "should work for .Get()", ->
      book = Book.Get(1)

      $httpBackend.when('GET', '/api/v1/books/1').respond(200,
        {
          0: { id: 1, title: "The Jungle", subtitle: "" }
        })
      $httpBackend.flush()

      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.$id).toEqual(1)
      expect(book.title).toEqual("The Jungle")
      return

    it "should work for .$ave() for fresh instance", ->
      book = new Book({ title: "The Jungle" })
      book.$save()
      $httpBackend.when('POST', '/api/v1/books/').respond(200,
        {
          0: { id: 1, title: "The Jungle" }
        })
      $httpBackend.flush()

      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      expect(book.$id).toEqual(1)
      expect(book.title).toEqual("The Jungle")
      return

    it "should work for .$ave() for existing instance", ->
      book = Book.Get(1)
      $httpBackend.when('GET', '/api/v1/books/1').respond(200,
        {
          0: { id: 1, title: "The Jungle" }
        })
      $httpBackend.flush()
      book.$promise.then jasmine.createSpy('success')
      $rootScope.$digest()
      book.title = "The Jungle 2.0"
      book.$save()
      $httpBackend.when('PUT', '/api/v1/books/1').respond(200,
        {
          0: { id: 1, title: "The Jungle 2.0" }
        })
      $httpBackend.flush()
      expect(book.$id).toEqual(1)
      expect(book.title).toEqual("The Jungle 2.0")
      return

    return

  return
