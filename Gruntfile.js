module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	concat: {
		index: {
            options: {
                process: function(src, filepath) {
                
                	var file = src,
                		version = grunt.file.readJSON('package.json').version;
                	
                	file = file.replace(/<!--\WBlocksJS\WFramework\WCSS\WSTART\W-->([\s\S]*?)END\W-->/, '<link rel="stylesheet" href="css/blocksjs-' + version + '.min.css">');
                    //file = file.replace(/<!--\W\BlocksJS\WFramework\WJavaScript\W-\START\W-->\([\s\S]*?)END\W-->/, '<script src="thirdParty/blocksjs/js/blocksjs-<%= pkg.version %>.min.css"></script>');
                    
                    file = file.replace(/<!--\WBlocksJS\WFramework\WJS\WSTART\W-->([\s\S]*?)END\W-->/, '<script src="js/blocksjs-' + version + '.min.js"></script>');
                    //file = file.replace(/<!--\W[BLOCKSJS\WENGINE\W-\WSTART\]\W-->([\s\S]*?)END\]\W-->/, '<script src="thirdParty/blocksjs/js/blocksjs.min.js"></script>');
                    
                    return file;
                }
            },
            files: [{
					src: 'src/index.html',
                    dest: 'build/<%= pkg.version %>/index.html'
				}
			]
        }
	},
	copy: {
        /*archive: {
            files: [
                {
                    expand: true, 
                    cwd: '',
                    src: '**',
                    dest: 'archive/<%= pkg.version %>/', 
                    filter: 'isFile'
                }
            ]
        },*/
        build: {
            files: [
                {
                    expand: true, 
                    cwd: 'images',
                    src: '**',
                    dest: 'build/<%= pkg.version %>/images/', 
                    filter: 'isFile'
                },
                {
                    expand: true,
                    cwd: 'css',
                    src: '**',
                    dest: 'build/<%= pkg.version %>/css/', 
                    filter: 'isFile'
                },
                {
                    expand: true, 
                    cwd: 'fonts',
                    src: '**',
                    dest: 'build/<%= pkg.version %>/fonts/', 
                    filter: 'isFile'
                },
                {
                    expand: true, 
                    cwd: 'audio',
                    src: '**',
                    dest: 'build/<%= pkg.version %>/audio/', 
                    filter: 'isFile'
                }
            ]
        }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>\n\nCopyright (c) 2014 William Malone (www.williammalone.com)\n\n' + 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\n' + 'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\n' + 'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n*/\n\n'
      },
      build: {
        src: 'src/**/*.js',
        dest: 'build/<%= pkg.version %>/js/blocksjs-<%= pkg.version %>.min.js'
      }
    },
    cssmin: {
        build: {
            src: 'src/**/*.css',
            dest: 'build/<%= pkg.version %>/css/blocksjs-<%= pkg.version %>.min.css'
        }
    },
	jshint: {
		src: 'src/blocks/**/*.js',
		options: {
			"bitwise"       : true,
			"curly"         : true,
			"eqeqeq"        : true,
			"forin"         : true,
			"immed"         : true,
			"latedef"       : true,
			"newcap"        : true,
			"noarg"         : true,
			"noempty"       : true,
			"nonew"         : true,
			"plusplus"      : true,
			"regexp"        : true,
			"undef"         : true,
			"strict"        : true,
			"trailing"      : false,
			"asi"           : false,
			"boss"          : false,
			"debug"         : false,
			"eqnull"        : false,
			"es5"           : false,
			"esnext"        : false,
			"evil"          : false,
			"expr"          : false,
			"funcscope"     : false,
			"globalstrict"  : false,
			"iterator"      : false,
			"lastsemic"     : false,
			"laxbreak"      : false,
			"laxcomma"      : false,
			"loopfunc"      : false,
			"multistr"      : false,
			"onecase"       : false,
			"proto"         : false,
			"regexdash"     : false,
			"scripturl"     : false,
			"smarttabs"     : false,
			"shadow"        : false,
			"sub"           : false,
			"supernew"      : false,
			"validthis"     : false,
			"browser"       : true,
			"couch"         : false,
			"devel"         : false,
			"dojo"          : false,
			"jquery"        : false,
			"mootools"      : false,
			"node"          : false,
			"nonstandard"   : false,
			"prototypejs"   : false,
			"rhino"         : false,
			"wsh"           : false,
			"nomen"         : false,
			"onevar"        : false,
			"passfail"      : false,
			"white"         : false,
			"maxerr"        : 100,
			"predef"        : [
			],
			"indent"        : 4,
			"globals"       : [
				"BLOCKS",
				"window"
			]
		}
	}
  });

  // Load the plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-compress');
	
	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'copy']);

};
