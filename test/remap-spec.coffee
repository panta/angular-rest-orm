describe "field mapping functionality:", ->
  $rootScope = undefined
  $httpBackend = undefined
  $q = undefined
  Resource = undefined
  Book = undefined
  Author = undefined
  Tag = undefined

  beforeEach module("restOrm")

  beforeEach inject(($injector) ->
    $rootScope = $injector.get("$rootScope")
    $httpBackend = $injector.get("$httpBackend")
    $q = $injector.get("$q")
    Resource = $injector.get("Resource")

    class Author extends Resource
      @urlEndpoint: '/api/v1/authors/'
      @fields:
        name: { remote: 'NOME', default: "" }

    class Tag extends Resource
      @urlEndpoint: '/api/v1/tags/'
      @fields:
        name: { remote: 'NOME', default: "" }

    class Book extends Resource
      @urlEndpoint: '/api/v1/books/'
      @fields:
        title: { remote: 'TITOLO', default: "" }
        author:
          remote: 'AUTORE'
          type: Resource.Reference
          model: Author
          default: null
        tags:
          remote: 'ETICHETTE'
          type: Resource.ManyToMany
          model: Tag
          default: []
  )

  describe "Resource models", ->
    it "should properly create instances from passed data", ->
      book = new Book({ title: "The Jungle" })
      expect(book.title).toEqual("The Jungle")
      expect(book.author).toEqual(null)
      return

    it "should remap field names on read", ->
      $httpBackend.expect('GET', '/api/v1/books/1').respond(200, { id: 1, TITOLO: "Moby Dick", AUTORE: 2, ETICHETTE: [2, 5] } )
      $httpBackend.expect('GET', '/api/v1/authors/2').respond(200, { id: 2, NOME: "Herman Melville" } )
      $httpBackend.expect('GET', '/api/v1/tags/2').respond(200, { id: 2, NOME: "novel" } )
      $httpBackend.expect('GET', '/api/v1/tags/5').respond(200, { id: 5, NOME: "fiction" } )

      book = Book.Get(1)

      book.$promise.then ->
        expect(book).toBeDefined()
        expect(book instanceof Book).toBeTruthy()
        expect(book.$id).toEqual(1)
        expect(book.title).toEqual("Moby Dick")
        expect(book.author).toBeDefined()
        expect(book.author instanceof Author).toBeTruthy()
        expect(book.author.$id).toEqual(2)
        expect(book.author.name).toEqual("Herman Melville")
        expect(book.tags.length).toEqual(2)
        expect(book.tags[0] instanceof Tag).toBeTruthy()
        expect(book.tags[0].$id).toEqual(2)
        expect(book.tags[0].name).toEqual("novel")
        expect(book.tags[1] instanceof Tag).toBeTruthy()
        expect(book.tags[1].$id).toEqual(5)
        expect(book.tags[1].name).toEqual("fiction")

      $rootScope.$digest()
      $httpBackend.flush()
      return

    it "should remap field names on save (empty relations)", ->
      book = new Book({ title: "The Jungle" })
      expect(book.title).toEqual("The Jungle")

      $httpBackend.expect('POST', '/api/v1/books/', {
        TITOLO: "The Jungle"
        AUTORE: null
        ETICHETTE: []
      }).respond(200, { id: 1, TITOLO: "The Jungle", AUTORE: null } )

      book.$save().$promise.then ->
        expect(book.$id).toEqual(1)
        expect(book.title).toEqual("The Jungle")
        expect(book.author).toEqual(null)

      $rootScope.$digest()
      $httpBackend.flush()
      return

    it "should remap field names on save (non-empty relations)", ->
      $httpBackend.expect('GET', '/api/v1/authors/3').respond(200, { id: 3, NOME: "Upton Sinclair" } )
      $httpBackend.expect('GET', '/api/v1/tags/2').respond(200, { id: 2, NOME: "novel" } )
      $httpBackend.expect('GET', '/api/v1/tags/5').respond(200, { id: 5, NOME: "fiction" } )

      author = Author.Get(3)
      tag_2 = Tag.Get(2)
      tag_5 = Tag.Get(5)

      $rootScope.$digest()
      $httpBackend.flush()

      $q.all([ author.$promise, tag_2.$promise, tag_5.$promise ]).then ->
        book = new Book({ title: "The Jungle", author: author, tags: [tag_2, tag_5] })

        $httpBackend.expect('POST', '/api/v1/books/', {
          TITOLO: "The Jungle"
          AUTORE: 3
          ETICHETTE: [2, 5]
        }).respond(200, { id: 1, TITOLO: "The Jungle", AUTORE: 3, ETICHETTE: [2, 5] } )

        book.$save().$promise.then ->
          expect(book.$id).toEqual(1)
          expect(book.title).toEqual("The Jungle")
          expect(book.author).toBeDefined()
          expect(book.author instanceof Author).toBeTruthy()
          expect(book.author.$id).toEqual(3)
          expect(book.author.name).toEqual("Upton Sinclair")
          expect(angular.isArray(book.tags)).toBeTruthy()
          expect(book.tags.length).toEqual(2)
          expect(book.tags[0] instanceof Tag).toBeTruthy()
          expect(book.tags[0].$id).toEqual(2)
          expect(book.tags[0].name).toEqual("novel")
          expect(book.tags[1] instanceof Tag).toBeTruthy()
          expect(book.tags[1].$id).toEqual(5)
          expect(book.tags[1].name).toEqual("fiction")

        $rootScope.$digest()
        $httpBackend.flush()
      return

    return

  return
