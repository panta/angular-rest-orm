module.exports = function (grunt) {
  
  /**
   * This is the configuration object Grunt uses to give each plugin its 
   * instructions.
   */
  grunt.initConfig({
    /**
     * We read in our `package.json` file so we can access the package name and
     * version. It's already there, so we don't repeat ourselves here.
     */
    pkg: grunt.file.readJSON('bower.json'),

    build_dir: 'build',
    dist_dir: 'dist',
    src_files: {
      js: [ 'src/**/*.js' ],
      coffee: [ 'src/**/*.coffee' ]
    },

    vendor_files: {
      js: [
        'vendor/angular/angular.js'
      ]
    },

    // used only during testing
    test_files: {
      js: [
        'vendor/angular-mocks/angular-mocks.js'
      ]
    },

    /**
     * The banner is the comment that is placed at the top of our compiled 
     * source files. It is first processed as a Grunt template, where the `<%=`
     * pairs are evaluated based on this very configuration object.
     */
    meta: {
      banner: 
        '/**\n' +
        ' * <%= pkg.description %>\n' +
        ' * @version <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @author <%= pkg.authors.join(", ") %>\n' +
        ' *\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.authors.join(", ") %>\n' +
        ' * Licensed under the MIT License, http://opensource.org/licenses/MIT\n' +
        ' */\n'
    },

    /**
     * Creates a changelog on a new version.
     */
    changelog: {
      options: {
        dest: 'CHANGELOG.md',
        template: 'changelog.tpl'
      }
    },

    /**
     * Increments the version number, etc.
     */
    bump: {
      options: {
        files: [
          "package.json", 
          "bower.json"
        ],
        updateConfigs: ['pkg'],
        commit: false,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
          "package.json", 
          "bower.json"
        ],
        createTag: false,
        tagName: '%VERSION%',
        tagMessage: 'Release %VERSION% version',
        push: false,
        pushTo: 'origin'
      }
    },

    gitcommit: {
      bump: {
        options: {
          message: 'chore(release): v<%= pkg.version %>'
        },
        files: {
          src: [
            "package.json",
            "bower.json",
            '<%= dist_dir %>/<%= pkg.name %>.js',
            '<%= dist_dir %>/<%= pkg.name %>.min.js'
          ]
        }
      }
    },

    gittag: {
      bump: {
        options: {
          tag: '<%= pkg.version %>',
          message: 'Release <%= pkg.version %> version'
        }
      }
    },

    gitpush: {
      bump_branch: {
        options: {
          remote: 'origin'
        }
      },
      bump_tags: {
        options: {
          remote: 'origin',
          tags: true
        }
      }
    },

    /**
     * The directories to delete when `grunt clean` is executed.
     */
    clean: [ 
      '<%= build_dir %>', 
      '<%= dist_dir %>'
    ],

    /**
     * The `copy` task just copies files from A to B. We use it here to copy
     * our project assets (images, fonts, etc.) and javascripts into
     * `build_dir`, and then to copy the assets to `dist_dir`.
     */
    copy: {
      build: {
        files: [
          {
            src: [ '<%= src_files.js %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      }
    },

    /**
     * `grunt concat` concatenates multiple source files into a single file.
     */
    concat: {
      /**
       * The `dist_js` target is the concatenation of our application source
       * code and all specified vendor source code into a single file.
       */
      dist_js: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [ 
          'module.prefix', 
          '<%= build_dir %>/src/**/*.js', 
          'module.suffix' 
        ],
        dest: '<%= dist_dir %>/<%= pkg.name %>.js'
      },
      /**
       * The `dist_min_js` target is the concatenation of our application source
       * code and all specified vendor source code into a single file and will
       * be minified later by uglify.
       */
      dist_min_js: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [ 
          'module.prefix', 
          '<%= build_dir %>/src/**/*.js', 
          'module.suffix' 
        ],
        dest: '<%= dist_dir %>/<%= pkg.name %>.min.js'
      }
    },

    /**
     * `grunt coffee` compiles the CoffeeScript sources. To work well with the
     * rest of the build, we have a separate compilation task for sources and
     * specs so they can go to different places. For example, we need the
     * sources to live with the rest of the copied JavaScript so we can include
     * it in the final build, but we don't want to include our specs there.
     */
    coffee: {
      source: {
        options: {
          bare: true
        },
        expand: true,
        cwd: '.',
        src: [ '<%= src_files.coffee %>' ],
        dest: '<%= build_dir %>',
        ext: '.js'
      }
    },

    /**
     * `ng-min` annotates the sources before minifying. That is, it allows us
     * to code without the array syntax.
     */
    ngAnnotate: {
      options: {
        // Tells if ngAnnotate should add annotations (true by default).
        add: true,
        // Tells if ngAnnotate should remove annotations (false by default).
        remove: false,
        // Switches the quote type for strings in the annotations array to single
        // ones; e.g. '$scope' instead of "$scope" (false by default).
        singleQuotes: true
      },
      dist: {
        files: [
          {
            src: [ '<%= src_files.js %>' ],
            cwd: '<%= build_dir %>',
            dest: '<%= build_dir %>',
            expand: true
          }
        ]
      }
    },

    /**
     * Minify the sources!
     */
    uglify: {
      dist: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          '<%= concat.dist_min_js.dest %>': '<%= concat.dist_min_js.dest %>'
        }
      }
    },

    /**
     * `jshint` defines the rules of our linter as well as which files we
     * should check. This file, all javascript sources, and all our unit tests
     * are linted based on the policies listed in `options`. But we can also
     * specify exclusionary patterns by prefixing them with an exclamation
     * point (!); this is useful when code comes from a third party but is
     * nonetheless inside `src/`.
     */
    jshint: {
      src: [ 
        '<%= src_files.js %>'
      ],
      // test: [
      //   '<%= app_files.jsunit %>'
      // ],
      gruntfile: [
        'Gruntfile.js'
      ],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true
      },
      globals: {}
    },

    /**
     * `coffeelint` does the same as `jshint`, but for CoffeeScript.
     * CoffeeScript is not the default in ngBoilerplate, so we're just using
     * the defaults here.
     */
    coffeelint: {
      src: {
        files: {
          src: [ '<%= src_files.coffee %>' ]
        }
      },
      // test: {
      //   files: {
      //     src: [ '<%= src_files.coffeeunit %>' ]
      //   }
      // },
      options: {
        configFile: 'coffeelint.json'
      }
    },

    /**
     * The Karma configurations.
     */
    karma: {
      options: {
        configFile: '<%= build_dir %>/karma-unit.js'
      },
      unit: {
        port: 9019,
        background: true
      },
      continuous: {
        singleRun: true
      }
    },

    /**
     * This task compiles the karma template so that changes to its file array
     * don't have to be managed manually.
     */
    karmaconfig: {
      unit: {
        dir: '<%= build_dir %>',
        src: [
          '<%= vendor_files.js %>',
          '<%= test_files.js %>'
        ]
      }
    },

    /**
     * And for rapid development, we have a watch set up that checks to see if
     * any of the files listed below change, and then to execute the listed 
     * tasks when they do. This just saves us from having to type "grunt" into
     * the command-line every time we want to see what we're working on; we can
     * instead just leave "grunt watch" running in a background terminal. Set it
     * and forget it, as Ron Popeil used to tell us.
     *
     * But we don't need the same thing to happen for all the files. 
     */
    delta: {
      /**
       * By default, we want the Live Reload to work for all tasks; this is
       * overridden in some tasks (like this file) where browser resources are
       * unaffected. It runs by default on port 35729, which your browser
       * plugin should auto-detect.
       */
      options: {
        livereload: true
      },

      /**
       * When the Gruntfile changes, we just want to lint it. In fact, when
       * your Gruntfile changes, it will automatically be reloaded!
       */
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: [ 'jshint:gruntfile' ],
        options: {
          livereload: false
        }
      },

      /**
       * When our JavaScript source files change, we want to run lint them and
       * run our unit tests.
       */
      jssrc: {
        files: [ 
          '<%= src_files.js %>'
        ],
        tasks: [ 'jshint:src', 'karma:unit:run', 'copy:build' ]
      },

      /**
       * When our CoffeeScript source files change, we want to run lint them and
       * run our unit tests.
       */
      coffeesrc: {
        files: [ 
          '<%= src_files.coffee %>'
        ],
        tasks: [ 'coffeelint:src', 'coffee:source', 'karma:unit:run', 'copy:build' ]
      },

      /**
       * When a JavaScript unit test file changes, we only want to lint it and
       * run the unit tests. We don't want to do any live reloading.
       */
      jsunit: {
        files: [
          '<%= app_files.jsunit %>'
        ],
        tasks: [ 'jshint:test', 'karma:unit:run' ],
        options: {
          livereload: false
        }
      },

      /**
       * When a CoffeeScript unit test file changes, we only want to lint it and
       * run the unit tests. We don't want to do any live reloading.
       */
      coffeeunit: {
        files: [
          '<%= app_files.coffeeunit %>'
        ],
        tasks: [ 'coffeelint:test', 'karma:unit:run' ],
        options: {
          livereload: false
        }
      }
    }
  });

  // Load required Grunt tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-git');

  /**
   * In order to make it safe to just compile or copy *only* what was changed,
   * we need to ensure we are starting from a clean, fresh build. So we rename
   * the `watch` task to `delta` (that's why the configuration var above is
   * `delta`) and then add a new task called `watch` that does a clean build
   * before watching for changes.
   */
  grunt.renameTask( 'watch', 'delta' );
  grunt.registerTask( 'watch', [ 'build', 'karma:unit', 'delta' ] );

  // Default task: `build` and `dist`
  grunt.registerTask( 'default', [ 'build', 'dist' ] );

  // build task: get the library ready for development and testing
  grunt.registerTask( 'build', [
    'clean', 'jshint', 'coffeelint', 'coffee',
    'copy:build', 'karmaconfig',
    'karma:continuous'
  ]);

  // dist task: get the library ready for distribution
  grunt.registerTask( 'dist', [
    'ngAnnotate', 'concat:dist_js', 'concat:dist_min_js', 'uglify'
  ]);

  // release task: build, dist, bump, commit & tag
  grunt.registerTask( 'release', "Perform a release.", function(versionType, incOrCommitOnly) {
    var doBump = true, doCommit = true;
    if (incOrCommitOnly === 'bump-only') {
      grunt.verbose.writeln('Only incrementing the version.');
      doCommit = false;
    } else if (incOrCommitOnly === 'commit-only') {
      grunt.verbose.writeln('Only committing/tagging/pushing.');
      doBump = false;
    }
    if (doBump) {
      grunt.verbose.writeln("Bump kind: '" + (versionType || 'patch') + "'");
      grunt.task.run('bump:' + (versionType || 'patch'));
    }
    grunt.task.run([
      'build', 'dist'
    ]);
    if (doCommit) {
      grunt.task.run([
        'gitcommit:bump', 'gittag:bump', 'gitpush:bump_branch', 'gitpush:bump_tags'
      ]);
    }
  });

  // ALIASES
  grunt.registerTask('release-bump-only',
      "Perform a release incrementing the version only, no tag/commit.",
      function(versionType) {
    grunt.task.run('release:' + (versionType || '') + ':bump-only');
  });

  grunt.registerTask('release-commit',
      "Commit, tag, push without incrementing the version.",
      'release::commit-only');

  /**
   * A utility function to get all JavaScript sources.
   */
  function filterForJS ( files ) {
    return files.filter( function ( file ) {
      return file.match( /\.js$/ );
    });
  }

  /**
   * In order to avoid having to specify manually the files needed for karma to
   * run, we use grunt to manage the list for us. The `karma/*` files are
   * compiled as grunt templates for use by Karma. Yay!
   */
  grunt.registerMultiTask( 'karmaconfig', 'Process karma config templates', function () {
    var jsFiles = filterForJS( this.filesSrc );
    
    grunt.file.copy( 'karma/karma-unit.tpl.js', grunt.config( 'build_dir' ) + '/karma-unit.js', { 
      process: function ( contents, path ) {
        return grunt.template.process( contents, {
          data: {
            scripts: jsFiles
          }
        });
      }
    });
  });
};
