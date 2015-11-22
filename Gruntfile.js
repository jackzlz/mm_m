module.exports = function(grunt) {

    var transport = require('grunt-cmd-transport');
    var style = transport.style.init(grunt);
    var text = transport.text.init(grunt);
    var script = transport.script.init(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),


        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            build: ['js/src/**/*.js']
        },

	   	transport: {
            options: {
				debug : true,
                parsers : {
                    '.js' : [script.jsParser],
                    '.css' : [style.css2jsParser],
                    '.html' : [text.html2jsParser]
                }
            },

            build : {
                files: [{
					expand : true,
                	cwd: 'js/src',
                	src: ['css/*.css', 'tpl/**/*.html', 'tpl/**/*.js', 'lib/**/*.js', '!lib/bootstrap.min.js', '!lib/html5shiv.min.js',
                				'!lib/juicer-min.js','!lib/respond.min.js', 'common/tips.js','common/pagebar.js',
                				'common/protemplate.js','common/ueditor_custom.js','common/ueditor.js','common/*.js',
                                'biz/*.js'],
                	dest: 'js/.build/'
                }]
            }
        },
        concat: {  
            options: {  
            	paths: ['js/dist', 'js/.build'],
                include: 'relative',
                css2js: transport.style.css2js
            },
            styles : {
                files: [{
                    expand: true,
                    cwd: 'js/.build/',
                    src: ['css/*.js'],
                    dest: 'js/dist/'
                }]
            },
            build: {
                files: [{  
                	expand: true,
                	cwd: 'js/.build/',
                	src: ['tpl/**/*.js', 'lib/**/*.js', 'common/tips.js','common/pagebar.js',
                				'common/protemplate.js','common/ueditor_custom.js','common/ueditor.js',
                                'common/*.js', 'biz/*.js'],
                	dest: 'js/dist/'
                }]
            }
        },
        uglify : {
            build : {
                files: [
                    {
                        expand: true,
                        cwd: 'js/dist/',
                        src: ['biz/*.js', '!biz/*-debug.js'],
                        dest: 'js/dist/',
                        ext: '.js'
                    }
                ]
            }
        },
        watch: {
            build: {
                files: ['js/src/biz/*.js'],
                tasks: ['transport', 'concat', 'uglify', 'copy'],
                options: {spawn: false}
            }
        },
        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: 'js/dist/',
                    src: ['biz/*'],
                    dest: 'js/',
                    filter: 'isFile'
                }]
            }
        },
        clean: {
            build: {
                files: [{
                    src: ['js/.build', 'js/dist']
                }]
            }
        }
	});

    grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-cmd-transport');
	grunt.loadNpmTasks('grunt-cmd-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
	

    grunt.registerTask('styles', ['transport:styles']);

    grunt.registerTask('hint', ['jshint']);
	grunt.registerTask('transfer', ['transport']);
	grunt.registerTask('combine', ['concat']);
	grunt.registerTask('compress', ['uglify']);
    grunt.registerTask('cc', ['clean']);


    grunt.registerTask('default', ['transport', 'concat', 'uglify', 'copy', 'clean']);

    grunt.registerTask('w', ['transport', 'concat', 'uglify', 'copy', 'clean', 'watch']);
};