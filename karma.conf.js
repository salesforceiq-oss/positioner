global.PUBLIC_WEBAPP_PATH = global.PUBLIC_WEBAPP_PATH || 'src/main/webapp/public/';
module.exports = function(config) {
    config.set({

        frameworks: ['browserify', 'jasmine'],

        basePath: '',

        files: [],

        autoWatch: true,

        reporters: ['progress', 'notify'],

        browsers: ['PhantomJS'],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        },

        notifyReporter: {
            reportSuccess: false // Default: true, Will notify when a suite was successful
        },

        browserNoActivityTimeout: 3000000,

        //enable if you need output about what files karma and browserify are matching
        //logLevel: config.LOG_DEBUG
    });
};