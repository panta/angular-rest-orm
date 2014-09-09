Angular REST ORM
================

[![Build Status](https://travis-ci.org/panta/angular-rest-orm.svg)](https://travis-ci.org/panta/angular-rest-orm) [![Bower version](https://badge.fury.io/bo/angular-rest-orm.svg)](http://badge.fury.io/bo/angular-rest-orm)

Angular REST ORM provides an easy to use, Active Record-like, ORM for your RESTful APIs.

It's meant to be more natural and fun to use than `$resource`.

It supports advanced features, such as collections and relations.

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
  for (var i = 0; i < books.length; i++) {
    var book = books[i];
    $log.info("" + book.$id + ": " + book.title);
  }
});
```

or in CoffeeScript:

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

* Usable **easily** both from **JavaScript** and **CoffeeScript**.
* Object oriented ORM, with an **Active Record like feeling**.
* Like with `$resource`, **usable models and collections are returned immediately**.
* In addition, **models and collection also provide promises** to handle completion of transactions.
* **Directly usable in `$routeProvides.resolve`**: this means that the models and collections will be injected into the controller when ready and complete.
* **Support for one-to-many and many-to-many relations.**
* **Automatic fetch of relations.**
* **Array-based collections.**
* **`id` name mapping** (primary key).
* **Re-mapping** of field names between remote endpoint and model.
* Base URL configuration.
* **Custom headers** easily generated via objects and/or functions.
* **Special responses** easily pre-processed via custom handler.
* **Fully tested.**
* **Bower support.**


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

### Relations

In JavaScript:

```javascript
var Author = Resource.Subclass({}, {
  urlEndpoint: '/api/v1/authors/',
  fields: {
    name: { default: "" }
  }
});

var Tag = Resource.Subclass({}, {
  urlEndpoint: '/api/v1/tags/',
  fields: {
    name: { default: "" }
  }
});

var Book = Resource.Subclass({}, {
  urlEndpoint: '/api/v1/books/',
  fields: {
    title: { default: "" },
    author: { type: Resource.Reference, model: Author, default: null },
    tags: { type: Resource.ManyToMany, model: Tag, default: [] },
  }
});

var books = Book.All();
books.$promise.then(function() {
  for (var i = 0; i < books.length; i++) {
    var book = books[i];
    $log.info(book.title + " author: " + book.author.name);
    for (var j = 0; j < book.tags.length; j++) {
      var tag = book.tags[j];
      $log.info("  tagged " + tag.name);
    }
  }
});
```

or in CoffeeScript:

```coffeescript
class Author extends Resource
  @urlEndpoint: '/api/v1/authors/'
  @fields:
    name: { default: "" }

class Tag extends Resource
  @urlEndpoint: '/api/v1/tags/'
  @fields:
    name: { default: "" }

class Book extends Resource
  @urlEndpoint: '/api/v1/books/'
  @fields:
    title: { default: "" }
    author:
      type: Resource.Reference
      model: Author
      default: null
    tags:
      type: Resource.ManyToMany
      model: Tag
      default: []

books = Book.All()
books.$promise.then ->
  for book in books
    $log.info "#{book.title} author: #{book.author.name}"
    for tag in book.tags
      $log.info "  tagged #{tag.name}"
```

## Reference documentation

Please see the [API reference documentaion][API-docs].

## Get help

If you need assistance, please open a ticket on the [GitHub issues page][issues].

## How to help

We need you!

Documentation and examples would need some love, so if you want to help,
please head to GitHub issues [#1][issue-1] and [#2][issue-1] and ask
how you could contribute.

## Alternatives

If Angular REST ORM is not your cup of tea, there are other alternatives:

* **$resource**: perhaps the most known REST interface for AngularJS, albeit 
* **Restmod**: a very good and complete library, similar in spirit to Angular REST ORM but with a different flavour.
* **Restangular**: another popular choice, but without a succulent model abstraction.

We've got some inspiration from all of these, trying to summarize the best parts of each into a unique, coherent API.

## License

This software is licensed under the terms of the [MIT license](LICENSE.md).

[repo]: https://github.com/panta/angular-rest-orm
[issues]: https://github.com/panta/angular-rest-orm/issues
[issue-1]: https://github.com/panta/angular-rest-orm/issues/1
[issue-2]: https://github.com/panta/angular-rest-orm/issues/2
[API-docs]: http://panta.github.io/angular-rest-orm/
