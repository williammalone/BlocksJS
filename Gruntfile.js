module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	concat: {
    // concat task configuration goes here.
	},
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>\n\nCopyright (c) 2014 William Malone (www.williammalone.com)\n\n' + 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\n' + 'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\n' + 'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n*/\n\n'
      },
      build: {
        src: 'src/**/*.js',
        dest: 'build/js/blocksjs-<%= pkg.version %>.min.js'
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

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint', 'uglify']);

};
