Angular REST ORM
================

Angular REST ORM provides an easy to use, Active Record-like, ORM for your RESTful APIs.

It's meant to be more natural and fun to use than `$resource`.

It supports advanced features, such as collections and relations.

**IMPORTANT**: this is a very young project, and even if it is already used in production, some features are still missing.

```javascript
var Book = Resource.Subclass({}, {
  urlEndpoint: '/api/v1/books/',
  defaults: {
    author: "",
    title: "",
    subtitle: ""
  }
});

var book = new Book({ 'title': "Moby Dick" });
book.$save();
book.$promise.then(function() {
  $log.info("Book saved on server with id " + book.$id);
});

book = Book.Get(2);
book.$promise.then(function() {
  $log.info("Got book with id 2");
  $log.info("Title: " + book.title);
});

var books = Book.All();
books.$promise.then(function() {
  for(var i = 0; i < books.length; i++) {
    var book = books[i];
    $log.info("" + book.$id + ": " + book.title);
  }
});
```

or from CoffeeScript:

```coffeescript
class Book extends Resource
  @urlEndpoint: '/api/v1/books/'
  @defaults:
    author: ""
    title: ""
    subtitle: ""

book = new Book({ 'title': "Moby Dick" })
book.$save()
book.$promise.then ->
  $log.info "Book saved on server with id #{book.$id}"

book = Book.Get(2)
book.$promise.then ->
  $log.info "Got book with id 2"
  $log.info "Title: #{book.title}"

books = Book.All()
books.$promise.then ->
  for book in books
    $log.info "#{book.$id}: #{book.title}"
```

## Features

* Usable easily both from **JavaScript** and CoffeeScript.
* Object oriented ORM, with an **Active Record like feeling**.
* Like with `$resource`, **usable models and collections are returned immediately**.
* In addition, **models and collection also provide promises** to handle completion of transactions.
* **Directly usable in `$routeProvides.resolve`**: this means that the real, complete, models and collections will be injected into the controller when ready.
* **Support for one-to-many and many-to-many relations.**
* **Automatic fetch of relations.**
* **Array-based collections.**
* **`id` name mapping** (primary key).
* Base URL configuration.
* **Fully tested.**
* **Bower support.**

## TODO

* extensive documentation
* examples
* field name mapping

## Usage

### Installation

Using `bower`

```
bower install angular-rest-orm --save
```

alternatively you can clone the project from github.

### Use

Include the library in your HTML

```html
<script type="text/javascript" src="bower_components/angular-rest-orm/angular-rest-orm.min.js"></script>
```

and declare the dependency on `restOrm` in your module

```javascript
app = angular.module('MyApp', ['restOrm'])
```
