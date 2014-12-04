exports.defineBasicMatcher =
    function defineBasicMatcher(passFn, messageFn) {
        return function () {
            return {
                compare: function (actual, expected) {
                    var pass = passFn(actual, expected);
                    return {
                        pass: pass,
                        message: messageFn && messageFn(actual, expected, pass)
                    };
                }
            };
        };
    };

exports.expectedObjectWithNot = function expectedObjectWithNot(actual, pass, obj) {
    try {
        actual = JSON.stringify(obj || actual);
    } catch (e) {
        actual = 'actual';
    }
    return 'Expected ' + actual + (!pass ? '' : ' not' );
};

exports.angularDeps = function () {
    var self = this;
    var depNames = Array.prototype.slice.call(arguments, 0);
    depNames.push(function actualInjectedFunction() {
        var depsArray = Array.prototype.slice.call(arguments, 0);
        depsArray.forEach(function (dep, i) {
            self[depNames[i]] = dep;
        });
    });
    inject.call(this, depNames)
};
