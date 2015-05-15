'use strict';

var fs = require('fs');
var tasks = fs.readdirSync('./gulp/tasks/');
var gulp = require('gulp');

require('./config');


var karmaConfig = {};
require('./../karma.conf.js')({
    set: function(conf) {
        karmaConfig = conf;
    }
});

gulp.task('release', function(cb) {
    cb(); // no op for version task
});

gulp.task('testsNoWatch', ['karma']); // need this task name for version task

require('gulp-tasks-riq/version')();

require('gulp-tasks-riq/karma')({
    karmaConf: karmaConfig,
    configure: function() {

    },
    testGlobs: [
        'src/**/*.spec.js'
    ]
});




tasks.forEach(function(task) {
    require('./tasks/' + task);
});