describe "headers functionality:", ->
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

  describe "function headers", ->
    it "should work", ->
      class Book extends Resource
        @urlEndpoint: '/api/v1/books/'
        @defaults:
          title: ""
        @headers: (info) ->
          {
            "X-My-Auth": "AAA-...-ZZZ"
            "X-Operation": info.what
            "X-Method": info.method
            "X-Class": info.klass.name
          }
      $httpBackend.expect('POST', '/api/v1/books/', undefined, (headers) ->
        return (headers["X-My-Auth"] == "AAA-...-ZZZ") and
          (headers["X-Operation"] == "$save") and
          (headers['X-Method'] == 'POST') and
          (headers['X-Class'] == 'Book')
      ).respond(200, { id: 1, title: "" } )

      book = Book.Create()

      $httpBackend.flush()
      return
    return

  describe "object headers", ->
    it "should work", ->
      class Book extends Resource
        @urlEndpoint: '/api/v1/books/'
        @defaults:
          title: ""
        @headers:
          "X-My-Auth": "AAA-...-ZZZ"
          "X-Operation": (info) -> info.what
          "X-Method": (info) -> info.method
          "X-Class": (info) -> info.klass.name
          "X-ID": (info) -> if info.instance?.$id? then "#{info.instance.$id}" else null
      $httpBackend.expect('POST', '/api/v1/books/', undefined, (headers) ->
        return (headers["X-My-Auth"] == "AAA-...-ZZZ") and
          (headers["X-Operation"] == "$save") and
          (headers['X-Method'] == 'POST') and
          (headers['X-Class'] == 'Book') and
          (headers['X-ID'] is undefined)
      ).respond(200, { id: 1, title: "" } )

      book = Book.Create()

      $httpBackend.flush()
      return
    return

  describe "object headers with op/method", ->
    it "should work", ->
      class Book extends Resource
        @urlEndpoint: '/api/v1/books/'
        @defaults:
          title: ""
        @headers:
          common:
            "X-My-Auth": "AAA-...-ZZZ"
            "X-Operation": (info) -> info.what
            "X-Method": (info) -> info.method
            "X-Class": (info) -> info.klass.name
            "X-ID": (info) -> if info.instance?.$id? then "#{info.instance.$id}" else null
          "$save":
            "X-Save": "TRUE"
          POST:
            "X-POST": "TRUE"
      $httpBackend.expect('POST', '/api/v1/books/', undefined, (headers) ->
        return (headers["X-My-Auth"] == "AAA-...-ZZZ") and
          (headers["X-Operation"] == "$save") and
          (headers['X-ID'] is undefined) and
          (headers['X-Save'] == "TRUE") and
          (headers['X-POST'] == "TRUE")
      ).respond(200, { id: 1, title: "" } )

      book = Book.Create()

      $httpBackend.flush()
      return
    return

  return
