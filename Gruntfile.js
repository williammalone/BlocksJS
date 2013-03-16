module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	concat: {
    // concat task configuration goes here.
  	},
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/blocks/**/*.js',
        dest: 'build/blocks/js/<%= pkg.name %>.min.js'
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
				"window",
			]
		}
	}
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint', 'uglify']);

};
