'use strict';

describe('Use from JavaScript', function() {

  var $rootScope, $httpBackend, $q, Resource;

  beforeEach(module('restOrm'));

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    Resource = $injector.get('Resource');
  }));

  describe('Resource subclasses', function() {

    it('should be well formed', function() {
      var Book = Resource.Subclass();
      expect(Book).toBeDefined();
      expect(Book.prototype instanceof Resource).toBeTruthy();
    });

    it('should be instantiable', function() {
      var Book = Resource.Subclass();
      expect(Book).toBeDefined();
      var book = new Book();
      expect(book).toBeDefined();
    });

    it('should be able to define instance properties', function() {
      var Book = Resource.Subclass({
        myVar: 5
      });
      var book = new Book();
      expect(book.myVar).toBeDefined();
      expect(book.myVar).toEqual(5);
    });

    it('should be able to define class (static) properties', function() {
      var Book = Resource.Subclass({}, {
        myClassVar: 6
      });
      var book = new Book();
      expect(Book.myClassVar).toBeDefined();
      expect(Book.myClassVar).toEqual(6);
      expect(book.myClassVar).toBeUndefined();
    });

    it('should be able to define and call methods', function() {
      var Book = Resource.Subclass({
        myMethod: function() {
          return 9;
        }
      });
      var book = new Book();
      expect(book.myMethod).toBeDefined();
      expect(book.myMethod()).toEqual(9);
    });

    it('should be able to define and call class (static) methods', function() {
      var Book = Resource.Subclass({}, {
        MyClassMethod: function() {
          return 11;
        }
      });
      expect(Book.MyClassMethod).toBeDefined();
      expect(Book.MyClassMethod()).toEqual(11);
      var book = new Book();
      expect(book.MyClassMethod).toBeUndefined();
    });

    it('should be able to call a Resource class method', function() {
      var Book = Resource.Subclass();
      expect(Book).toBeDefined();
      var book = Book.Get(1);
      expect(book).toBeDefined();
    });

    it('should be able to use $super', function() {
      var Book = Resource.Subclass({
        $save: function() {
          this.abcd = 456;
          return this.$super('$save').apply(this, arguments);
        }
      }, {
        urlEndpoint: '/api/v1/books/'
      });

      var book = new Book({ title: "The Jungle" });
      book.$save();
      $httpBackend.when('POST', '/api/v1/books/').respond(200, { id: 1, title: "The Jungle" });
      $httpBackend.flush();
      book.$promiseDirect.then(jasmine.createSpy('success'));
      $rootScope.$digest();
      expect(book.$id).toBeDefined();
      expect(book.$id).toEqual(1);
      expect(book.abcd).toBeDefined();
      expect(book.abcd).toEqual(456);
    });

    it('should call $initialize', function() {
      var Book = Resource.Subclass({
        $initialize: function() { this.abc = 42; }
      });
      spyOn(Book.prototype, '$initialize').andCallThrough()
      var book = new Book();
      expect(Book.prototype.$initialize).toHaveBeenCalled();
      expect(book.abc).toBeDefined();
      expect(book.abc).toEqual(42);
    });

  });

});
