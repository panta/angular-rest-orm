Angular REST ORM
================

Angular REST ORM provides an easy to use, Active Record-like, ORM for your RESTful APIs.

It's meant to be more natural and fun to use than `$service`.

It supports advanced features, such as collections and relations.

**IMPORTANT**: this is a very young project, and even if it is already used in production, some features are missing (for the moment).

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

* object oriented ORM
* support for one-to-many and many-to-many relations
* automatic relations fetch
* Array based collections
* both models and collections provide promises to handle completion of transactions
* `id` name mapping (primary key)
* base URL configuration
* fully tested
* bower support

## TODO

* support for easy use from plain JavaScript (`extend` function)
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
