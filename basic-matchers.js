(function () {

    function makeFakePosRange(t, l, r, b) {
        return {top: t, left: l, right: r, bottom: b};
    }

    function maybeAddPx(v) {
        return typeof v === 'string' ? v : v + 'px';
    }


    var $ = require('jquery');
    var tools = require('./index.js');

    var matchers = {

        toBeANumber: tools.defineBasicMatcher(function (actual) {
            return angular.isNumber(actual);
        }),
        toBeAFunction: tools.defineBasicMatcher(function (actual) {
            return angular.isFunction(actual);
        }),

        toBeAnObject: tools.defineBasicMatcher(function (actual) {
            return angular.isObject(actual);
        }),

        toBeAnArray: tools.defineBasicMatcher(function (actual) {
            return angular.isArray(actual);
        }),
        toBeAString: tools.defineBasicMatcher(function (actual) {
            return angular.isString(actual);
        }),
        toBeNully: tools.defineBasicMatcher(function (actual) {
            return actual === undefined || actual === null;
        }),
        toBeAnElement: tools.defineBasicMatcher(function (actual) {
            return !!(actual &&
                (actual.nodeName || // we are a direct element
                    (actual.prop && actual.attr && actual.find)));
        }),
        toHaveField: tools.defineBasicMatcher(function (actual, exp) {
            return exp in actual;
        }, function (actual, exp, pass) {
            return tools.expectedObjectWithNot(actual, pass) + ' to have field: ' + exp;
        }),
        toContainAll: tools.defineBasicMatcher(function (actual, array) {
            array.forEach(function (item) {
                if (actual.indexOf(item) === -1) {
                    return false;
                }
            });
            return true;
        }),
        toHaveClass: tools.defineBasicMatcher(function (actual, className) {
            return $(actual).hasClass(className);
        }, function (actual, expected, pass) {
            return 'Expected "' + $(actual).attr('class') + '"' + (pass ? ' not' : '') + ' to have class "' + expected + '"';
        }),
        toBePositioned: function () {
            return {
                compare: function (actual, t, l, b, r) {
                    var top = $(actual).css('top');
                    var left = $(actual).css('left');
                    var right = $(actual).css('right');
                    var bottom = $(actual).css('bottom');
                    var pos = $(actual).css('position');
                    var pass = top === maybeAddPx(t) &&
                        left === maybeAddPx(l) &&
                        right === maybeAddPx(r) &&
                        bottom === maybeAddPx(b) &&
                        pos === 'absolute';
                    return {
                        pass: pass,
                        message: tools.expectedObjectWithNot(actual, pass, makeFakePosRange(top, left, right, bottom)) + ' to be positioned ' + JSON.stringify(makeFakePosRange(t, l, r, b))
                    };
                }
            };
        },
        toHaveOnlyTruthyProperty: tools.defineBasicMatcher(function (actual, propertyName, includeFunctionReturnValues) {
            return Object.keys(this).every(function (key) {
                var value = typeof this[key] === 'function' && includeFunctionReturnValues ? this[key]() : this[key];
                return key === propertyName ? !!value : !value;
            }, function (actual, expected, pass) {
                return 'Expected "' + propertyName + '"' + (pass ? ' not' : '') + ' to be only truthy value of the given object.';
            });
        })

    };

    beforeEach(function () {
        jasmine.addMatchers(matchers);
    });
})
();