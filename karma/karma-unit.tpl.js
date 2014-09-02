module.exports = function ( karma ) {
  karma.set({
    /** 
     * From where to look for files, starting with the location of this file.
     */
    basePath: '../',

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      <% scripts.forEach( function ( file ) { %>'<%= file %>',
      <% }); %>
      //'src/**/*.js',
      'src/**/*.coffee',

      // tests
      { pattern: 'test/**/*-spec.coffee', included: true },
      { pattern: 'test/**/*-spec.js', included: true }
    ],
    exclude: [
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'jasmine' ],

    plugins: [ 'karma-jasmine', 'karma-firefox-launcher', 'karma-phantomjs-launcher', 'karma-coverage', 'karma-coffee-preprocessor' ],
    preprocessors: {
      // source files, that we wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul via Ibrik)
      'src/*.coffee': 'coverage',

      // project files will already be converted to
      // JavaScript via coverage preprocessor.
      // Thus, we'll have to limit the CoffeeScript preprocessor
      // to uncovered files (test files).
      'test/**/*.coffee': 'coffee'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'coverage'],

    coffeePreprocessor: {
      options: {
        sourceMap: true
      }
    },

    coverageReporter : {
      type: 'html',
      dir: 'coverage/'
    },

    /**
     * On which port should the browser connect, on which port is the test runner
     * operating, and what is the URL path for the browser to use.
     */
    port: 9018,
    runnerPort: 9100,
    urlRoot: '/',

    /** 
     * Disable file watching by default.
     */
    autoWatch: false,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: karma.LOG_INFO,

    /**
     * The list of browsers to launch to test on. This includes only "Firefox" by
     * default, but other browser names include:
     * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
     *
     * Note that you can also use the executable name of the browser, like "chromium"
     * or "firefox", but that these vary based on your operating system.
     *
     * You may also leave this blank and manually navigate your browser to
     * http://localhost:9018/ when you're running tests. The window/tab can be left
     * open and the tests will automatically occur there during the build. This has
     * the aesthetic advantage of not launching a browser every time you save.
     */
    browsers: [
      //'Firefox',
      'PhantomJS'
    ]
  });
};

