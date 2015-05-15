global.PUBLIC_WEBAPP_PATH = global.PUBLIC_WEBAPP_PATH || 'src/main/webapp/public/';
module.exports = function(config) {
    config.set({

        frameworks: ['browserify', 'jasmine'],

        basePath: '',

        files: [
            global.PUBLIC_WEBAPP_PATH + 'bower_components/jquery/jquery.js',
            global.PUBLIC_WEBAPP_PATH + 'bower_components/numeral/numeral.js',
            global.PUBLIC_WEBAPP_PATH + 'bower_components/sugar/release/sugar-full.min.js',
            global.PUBLIC_WEBAPP_PATH + 'js/riq-utils.js',
            'node_modules/angular/angular.js',
            'node_modules/angular-ui-router/release/angular-ui-router.js',
            'node_modules/angular-sanitize/angular-sanitize.js',
            'node_modules/angular-cookies/angular-cookies.js',
            'node_modules/angular-mocks/angular-mocks.js',
            global.PUBLIC_WEBAPP_PATH + 'bower_components/angular-ui/build/angular-ui.js',
            global.PUBLIC_WEBAPP_PATH + 'js/thrift.js',
            global.PUBLIC_WEBAPP_PATH + 'js/thrift-riq.js',
            global.PUBLIC_WEBAPP_PATH + 'js/*.js',
            global.PUBLIC_WEBAPP_PATH + 'js/angular-app/test/helpers/jasmine-jquery.js',
            global.PUBLIC_WEBAPP_PATH + 'js/angular-app/!(test)/**/!(*@(app|.spec)).js',
            global.PUBLIC_WEBAPP_PATH + 'js/angular-app/templates.js'
        ],

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