describe('positioner', function() {
    require('phantomjs-polyfill');
    var tools = require('jasmine-tools-riq');
    var positioner = require('./');
    var positions = ['bottom', 'top', 'right', 'left'];

    beforeEach(function() {
        jasmine.addMatchers({
            toBePositionedAt: tools.defineBasicMatcher(function(el, left, top, description) {
                return parseInt(el.style.left) === left && parseInt(el.style.top) === top;
            }, function(el, left, top, description, pass) {
                if (!pass) {
                    return description + ': expected ' + parseInt(el.style.left) + ', ' + parseInt(el.style.top) + ' to be ' + left + ', ' + top;
                }
            })
        });
    });

    beforeEach(function() {
        this.options = {};
    });

    afterEach(function(done) {
        setPositionerOptions.call(this);

        if (this.testPositioningArrow) {
            positioner(this.posEl, this.relEl, this.options).arrow();
        } else {
            positioner(this.posEl, this.relEl, this.options).at(this.placement, this.optimizePlacement !== false, this.alignment);
        }

        expect(this.posEl).toBePositionedAt(this.left, this.top, 'Positioned element');

        if (this.arrowEl) {
            expect(this.arrowEl).toBePositionedAt(this.arrowLeft, this.arrowTop, 'Arrow element');
        }

        document.body.style.position = '';
        document.body.style.margin = '';

        if (this.options.complete) {
            var self = this;
            setTimeout(function() {
                expect(self.options.complete).toHaveBeenCalled();
                done();
            }, 51);
        } else {
            done();
        }
    });

    describe('- normal positioning -', function() {
        testNormalPositioning.call(this);
    });

    describe('- normal positioning within non-static body -', function() {
        afterEach(function() {
            var bodyMargin = 10;
            document.body.style.position = 'absolute';
            document.body.style.width = document.body.style.height = '100%'; //make the body visible
            document.body.style.margin = bodyMargin + 'px'; //position is different with margin, most browsers default body margin to 8px

            this.left += bodyMargin;
            this.top += bodyMargin;
        });

        testNormalPositioning.call(this);
    });

    describe('- normal positioning within container (not body) -', function() {
        afterEach(function() {
            createContainerEl.call(this);
            this.relEl.style.left = this.containerElWidth / 2 - this.relElWidth / 2 + 'px';
            this.relEl.style.top = this.containerElHeight / 2 - this.relElHeight / 2 + 'px';

            this.left -= this.containerElLeft;
            this.top -= this.containerElTop;
        });

        testNormalPositioning.call(this);
    });

    describe('- normal positioning with elementCushion -', function() {
        afterEach(function() {
            this.elementCushion = 10;

            switch (this.placement) {
                case 'bottom':
                    this.top += this.elementCushion;
                    break;
                case 'top':
                    this.top -= this.elementCushion;
                    break;
                case 'left':
                    this.left -= this.elementCushion;
                    break;
                case 'right':
                    this.left += this.elementCushion;
                    break;
            }
        });

        testNormalPositioning.call(this);
    });

    describe('- normal positioning with arrowElement -', function() {
        testNormalPositioningWithArrow.call(this);
    });

    describe('- normal positioning with arrowElement on element with border -', function() {
        afterEach(function() {
            var borderWidth = 5;
            this.posEl.style.boxSizing = 'border-box';
            this.posEl.style.border = borderWidth + 'px solid red';

            this.arrowTop -= borderWidth;
            this.arrowLeft -= borderWidth;
        });

        testNormalPositioningWithArrow.call(this);
    });

    describe('- optimized positioning -', function() {
        testOptimizedPositioning.call(this);
    });

    describe('- optimized positioning with elementCushion -', function() {
        afterEach(function() {
            this.elementCushion = 10;

            switch (this.optimizedPlacement) {
                case 'bottom':
                    this.top += this.elementCushion;
                    break;
                case 'top':
                    this.top -= this.elementCushion;
                    break;
                case 'left':
                    this.left -= this.elementCushion;
                    break;
                case 'right':
                    this.left += this.elementCushion;
                    break;
            }
        });

        testOptimizedPositioning.call(this);
    });

    describe('- optimized positioning with arrowElement -', function() {
        afterEach(function() {
            createArrowEl.call(this);
            var leftForVerticalPlacement = this.failedPlacement.left ? 45 : this.failedPlacement.right ? 145 : 95;
            var topForSidePlacement = this.failedPlacement.top ? 15 : this.failedPlacement.bottom ? 175 : 95;

            switch (this.optimizedPlacement) {
                case 'bottom':
                    this.arrowTop = -10;
                    this.arrowLeft = leftForVerticalPlacement;
                    break;
                case 'top':
                    this.arrowTop = 200;
                    this.arrowLeft = leftForVerticalPlacement;
                    break;
                case 'left':
                    this.arrowTop = topForSidePlacement;
                    this.arrowLeft = 200;
                    break;
                case 'right':
                    this.arrowTop = topForSidePlacement;
                    this.arrowLeft = -10;
                    break;
            }
        });

        testOptimizedPositioning.call(this);
    });

    describe('- containerCushion -', function() {
        afterEach(function() {
            var sideCushion = this.relElWidth;
            var vertCushion = this.relElHeight;
            this.containerCushion = vertCushion + ' ' + sideCushion;

            switch (this.optimizedPlacement) {
                case 'bottom':
                case 'top':
                    this.left = this.failedPlacement.left ? sideCushion : this.failedPlacement.right ? 800 - sideCushion : 400;
                    break;
                case 'left':
                case 'right':
                    this.top = this.failedPlacement.top ? vertCushion : this.failedPlacement.bottom ? 800 - vertCushion : 400;
                    break;
            }
        });

        testOptimizedPositioning.call(this);
    });

    describe('- min/max positioning -', function() {
        afterEach(function() {
            var maxSideCushion = this.relElWidth;
            var maxVertCushion = this.relElHeight;
            //make the cushion +1 the given relative element size to push the positioning to it's min or max
            this.containerCushion = (maxVertCushion + 1) + ' ' + (maxSideCushion + 1);

            switch (this.optimizedPlacement) {
                case 'bottom':
                case 'top':
                    this.left = this.failedPlacement.left ? maxSideCushion : this.failedPlacement.right ? 800 - maxSideCushion : 400;
                    break;
                case 'left':
                case 'right':
                    this.top = this.failedPlacement.top ? maxVertCushion : this.failedPlacement.bottom ? 800 - maxVertCushion : 400;
                    break;
            }
        });

        testOptimizedPositioning.call(this);
    });

    describe('- min/max positioning with arrowElement -', function() {
        testMinMaxPositioningWithArrowEl.call(this);
    });

    describe('- min/max positioning with arrowElement and border-radius -', function() {
        afterEach(function() {
            var borderRadius = 7;
            this.posEl.style.borderRadius = borderRadius + 'px';

            var leftDiff = this.relElLeft > 0 ? borderRadius : -borderRadius;
            var topDiff = this.relElTop > 0 ? borderRadius : -borderRadius;

            switch (this.placement) {
                case 'top':
                case 'bottom':
                    this.left += leftDiff;
                    this.arrowLeft -= leftDiff;
                    break;
                case 'left':
                case 'right':
                    this.top += topDiff;
                    this.arrowTop -= topDiff;
                    break;
            }
        });

        testMinMaxPositioningWithArrowEl.call(this);
    });

    describe('optimized alignment for large content height -', function() {
        afterEach(function() {
            document.body.style.margin = '0px'; //clear body margin for easier test

            switch (this.placement) {
                case 'bottom':
                case 'top':
                    this.posEl.style.width = '1000px';
                    this.left = 0;
                    break;
                case 'left':
                case 'right':
                    this.posEl.style.height = '1000px';
                    this.top = 0;
                    break;
            }

        });

        testNormalAlignment.call(this);
    });

    describe('alignment offset -', function() {
        afterEach(function() {
            this.alignmentOffset = this.alignment === 'top' || this.alignment === 'left' ? -1 : 1;

            //this example simulates aligning the content (not the border)
            switch (this.alignment) {
                case 'top':
                case 'bottom':
                    this.top += this.alignmentOffset;
                    break;
                case 'left':
                case 'right':
                    this.left += this.alignmentOffset;
                    break;
            }
        });

        testNormalAlignment.call(this);
    });

    describe('prePosition function -', function() {
        beforeEach(function() {
            createPositionedEl.call(this);
            createRelativeEl.call(this, 450, 480);
            this.placement = 'bottom';
            this.left = 400;
            this.top = 520;
            this.posEl.style.top = '0px';
            this.posEl.style.left = '0px';
        });

        it('should call the complete function without a transition', function() {
            this.options.prePosition = function() {
                expect(this.posEl).toBePositionedAt(0, 0, 'Positioned element');
                expect(this.options.prePosition).toHaveBeenCalledWith(this.posEl, this.left, this.top);
            };
            spyOn(this.options, 'prePosition');
        });
    });

    describe('complete function -', function() {
        beforeEach(function() {
            createPositionedEl.call(this);
            createRelativeEl.call(this, 450, 480);
            this.placement = 'bottom';
            this.left = 400;
            this.top = 520;
        });

        it('should call the complete function without a transition', function() {
            createCompleteSpy.call(this);
        });

        it('should call the complete function with a transition', function() {
            this.posEl.style.transition = '1ms';
            createCompleteSpy.call(this);
        });

        it('should call the complete function when the position does not change', function() {
            positioner(this.posEl, this.relEl).at(this.placement);
            createCompleteSpy.call(this);
        });

    });

    describe('repositioning only the arrow -', function() {
        beforeEach(function() {
            this.testPositioningArrow = true;
        });

        afterEach(function() {
            // the arrowEl pos should change with the targetElement but the tip should stay the same

            // set normal positioning
            positioner(this.posEl, this.relEl, setPositionerOptions.call(this)).at(this.placement, this.optimizePlacement !== false, this.alignment);

            // move target el
            switch (this.placement) {
                case 'left':
                case 'right':
                    this.relEl.style.top = this.relElTop + positionDiff + 'px';
                    this.arrowTop = Math.max(0, this.arrowTop + positionDiff);
                    break;
                case 'top':
                case 'bottom':
                    this.relEl.style.left = this.relElLeft + positionDiff + 'px';
                    this.arrowLeft = Math.max(0, this.arrowLeft + positionDiff);
                    break;
            }
        });

        var positionDiff = 20;
        testNormalPositioningWithArrow.call(this);
        positionDiff = -20;
        testNormalPositioningWithArrow.call(this);
    });


    function testNormalPositioning() {
        beforeEach(function() {
            createRelativeEl.call(this, 450, 480);
            createPositionedEl.call(this);
        });

        it('should position the element at the bottom', function() {
            this.placement = 'bottom';
            this.left = 400;
            this.top = 520;
        });

        it('should position the element at the top', function() {
            this.placement = 'top';
            this.left = 400;
            this.top = 280;
        });

        it('should position the element at the left', function() {
            this.placement = 'left';
            this.left = 250;
            this.top = 400;
        });

        it('should position the element at the right', function() {
            this.placement = 'right';
            this.left = 550;
            this.top = 400;
        });

        testNormalAlignment.call(this);
    }

    function testNormalAlignment() {
        beforeEach(function() {
            if (!this.relEl) {
                createRelativeEl.call(this, 450, 480);
            }
            if (!this.posEl) {
                createPositionedEl.call(this);
            }
        });

        describe('alignment -', function() {
            it('should align element to the bottom-left', function() {
                this.placement = 'bottom';
                this.alignment = 'left';
                this.left = 450;
                this.top = 520;
            });

            it('should align element to the bottom-right', function() {
                this.placement = 'bottom';
                this.alignment = 'right';
                this.left = 350;
                this.top = 520;
            });

            it('should align element to the top-left', function() {
                this.placement = 'top';
                this.alignment = 'left';
                this.left = 450;
                this.top = 280;
            });

            it('should align element to the top-right', function() {
                this.placement = 'top';
                this.alignment = 'right';
                this.left = 350;
                this.top = 280;
            });

            it('should align element to the left-top', function() {
                this.placement = 'left';
                this.alignment = 'top';
                this.left = 250;
                this.top = 480;
            });

            it('should align element to the left-bottom', function() {
                this.placement = 'left';
                this.alignment = 'bottom';
                this.left = 250;
                this.top = 320;
            });

            it('should align element to the right-top', function() {
                this.placement = 'right';
                this.alignment = 'top';
                this.left = 550;
                this.top = 480;
            });

            it('should align element to the right-bottom', function() {
                this.placement = 'right';
                this.alignment = 'bottom';
                this.left = 550;
                this.top = 320;
            });
        });
    }

    function testOptimizedPositioning() {
        beforeEach(function() {
            createPositionedEl.call(this);
        });

        positions.forEach(function(failedPlacementStr) {
            positions.forEach(function(optimizedPlacement) {
                if (failedPlacementStr !== optimizedPlacement) {
                    var placementStr = failedPlacementStr + ' ' + optimizedPlacement;
                    it('should optimize placement to ' + optimizedPlacement + ' with placement: ' + placementStr, function() {
                        this.placement = placementStr;
                        this.failedPlacement = {};
                        this.failedPlacement[failedPlacementStr] = true;
                        this.optimizedPlacement = optimizedPlacement;

                        positionRelativeElementAtMiddleBoundaries.call(this, failedPlacementStr);

                        switch (optimizedPlacement) {
                            case 'left':
                            case 'right':
                                this.left = this.relElLeft + (optimizedPlacement === 'left' ? -this.posElWidth : this.relElWidth);
                                this.top = failedPlacementStr === 'bottom' ? 800 : failedPlacementStr === 'top' ? 0 : 400;
                                break;
                            case 'top':
                            case 'bottom':
                                this.left = failedPlacementStr === 'right' ? 800 : failedPlacementStr === 'left' ? 0 : 400;
                                this.top = this.relElTop + (optimizedPlacement === 'top' ? -this.posElHeight : this.relElHeight);
                                break;
                        }
                    });
                }
            });
        });

        describe('relativeElement position at top-left corner', function() {
            beforeEach(function() {
                createRelativeEl.call(this, 0, 0);
                this.failedPlacement = {
                    top: true,
                    left: true
                };
            });

            it('should optimize placement to right with placement: top left right bottom', function() {
                this.placement = 'top left right bottom';
                this.optimizedPlacement = 'right';
                this.left = this.relElWidth;
                this.top = this.relElTop;
            });

            it('should optimize placement to bottom with placement: top left bottom right', function() {
                this.placement = 'top left bottom right';
                this.optimizedPlacement = 'bottom';
                this.left = this.relElLeft;
                this.top = this.relElHeight;
            });
        });

        describe('relativeElement position at top-right corner', function() {
            beforeEach(function() {
                createRelativeEl.call(this, 900, 0);
                this.failedPlacement = {
                    top: true,
                    right: true
                };
            });
            it('should optimize placement to left with placement: top right left bottom', function() {
                this.placement = 'top right left bottom';
                this.optimizedPlacement = 'left';
                this.left = 700;
                this.top = this.relElTop;
            });

            it('should optimize placement to bottom with placement: top right bottom left', function() {
                this.placement = 'top right bottom left';
                this.optimizedPlacement = 'bottom';
                this.left = 800;
                this.top = this.relElHeight;
            });
        });

        describe('relativeElement position at bottom-left corner', function() {
            beforeEach(function() {
                createRelativeEl.call(this, 0, 960);
                this.failedPlacement = {
                    bottom: true,
                    left: true
                };
            });

            it('should optimize placement to right with placement: bottom left right top', function() {
                this.placement = 'bottom left right top';
                this.optimizedPlacement = 'right';
                this.left = this.relElWidth;
                this.top = 800;
            });

            it('should optimize placement to top with placement: bottom left top right', function() {
                this.placement = 'bottom left top right';
                this.optimizedPlacement = 'top';
                this.left = this.relElLeft;
                this.top = 760;
            });
        });

        describe('relativeElement position at bottom-right corner', function() {
            beforeEach(function() {
                createRelativeEl.call(this, 900, 960);
                this.failedPlacement = {
                    bottom: true,
                    right: true
                };
            });
            it('should optimize placement to left with placement: bottom right left top', function() {
                this.placement = 'bottom right left top';
                this.optimizedPlacement = 'left';
                this.left = 700;
                this.top = 800;
            });

            it('should optimize placement to top with placement: bottom right top left', function() {
                this.placement = 'bottom right top left';
                this.optimizedPlacement = 'top';
                this.left = 800;
                this.top = 760;
            });
        });
    }

    function testMinMaxPositioningWithArrowEl() {
        describe('- min/max positioning with arrowElement -', function() {
            beforeEach(function() {
                createPositionedEl.call(this);
                createArrowEl.call(this);
            });

            afterEach(function() {
                this.containerCushion = (this.relElHeight + 1) + ' ' + (this.relElWidth + 1);
            });

            describe('relativeElement position at top-left corner', function() {
                beforeEach(function() {
                    createRelativeEl.call(this, 0, 0);
                });

                it('should place on right and account for arrow size', function() {
                    this.placement = 'right';
                    this.left = this.relElWidth;
                    this.top = this.relElHeight - this.arrowElHeight;
                    this.arrowLeft = -this.arrowElWidth;
                    this.arrowTop = 0;
                });

                it('should place on bottom and account for arrow size', function() {
                    this.placement = 'bottom';
                    this.left = this.relElWidth - this.arrowElWidth;
                    this.top = this.relElHeight;
                    this.arrowLeft = 0;
                    this.arrowTop = -this.arrowElHeight;
                });
            });

            describe('relativeElement position at top-right corner', function() {
                beforeEach(function() {
                    createRelativeEl.call(this, 900, 0);
                });

                it('should place on left and account for arrow size', function() {
                    this.placement = 'left';
                    this.left = 1000 - this.relElWidth - this.posElWidth;
                    this.top = this.relElHeight - this.arrowElHeight;
                    this.arrowLeft = this.posElWidth;
                    this.arrowTop = 0;
                });

                it('should place on bottom and account for arrow size', function() {
                    this.placement = 'bottom';
                    this.left = 1000 - this.relElWidth - this.posElWidth + this.arrowElWidth;
                    this.top = this.relElHeight;
                    this.arrowLeft = this.posElWidth - this.arrowElWidth;
                    this.arrowTop = -this.arrowElHeight;
                });
            });

            describe('relativeElement position at bottom-left corner', function() {
                beforeEach(function() {
                    createRelativeEl.call(this, 0, 960);
                });

                it('should place on right and account for arrow size', function() {
                    this.placement = 'right';
                    this.left = this.relElWidth;
                    this.top = 1000 - this.relElHeight - this.posElHeight + this.arrowElHeight;
                    this.arrowLeft = -this.arrowElWidth;
                    this.arrowTop = this.posElHeight - this.arrowElHeight;
                });

                it('should place on top and account for arrow size', function() {
                    this.placement = 'top';
                    this.left = this.relElWidth - this.arrowElWidth;
                    this.top = 1000 - this.relElHeight - this.posElHeight;
                    this.arrowLeft = 0;
                    this.arrowTop = this.posElHeight;
                });
            });

            describe('relativeElement position at bottom-right corner', function() {
                beforeEach(function() {
                    createRelativeEl.call(this, 900, 960);
                });

                it('should place on left and account for arrow size', function() {
                    this.placement = 'left';
                    this.left = 1000 - this.relElWidth - this.posElWidth;
                    this.top = 1000 - this.relElHeight - this.posElHeight + this.arrowElHeight;
                    this.arrowLeft = this.posElWidth;
                    this.arrowTop = this.posElHeight - this.arrowElHeight;
                });

                it('should place on top and account for arrow size', function() {
                    this.placement = 'top';
                    this.left = 1000 - this.relElWidth - this.posElWidth + this.arrowElWidth;
                    this.top = 1000 - this.relElHeight - this.posElHeight;
                    this.arrowLeft = this.posElWidth - this.arrowElWidth;
                    this.arrowTop = this.posElHeight;
                });
            });
        });
    }

    function testNormalPositioningWithArrow() {
        afterEach(function() {
            createArrowEl.call(this);

            switch (this.placement) {
                case 'bottom':
                    this.arrowTop = -10;
                    this.arrowLeft = 95;
                    break;
                case 'top':
                    this.arrowTop = 200;
                    this.arrowLeft = 95;
                    break;
                case 'left':
                    this.arrowTop = 95;
                    this.arrowLeft = 200;
                    break;
                case 'right':
                    this.arrowTop = 95;
                    this.arrowLeft = -10;
                    break;
            }


            //for alignment only
            switch (this.alignment) {
                case 'bottom':
                    this.arrowTop = this.posElHeight - this.relElHeight / 2 - this.arrowElHeight / 2;
                    break;
                case 'top':
                    this.arrowTop = this.relElHeight / 2 - this.arrowElHeight / 2;
                    break;
                case 'left':
                    this.arrowLeft = this.relElWidth / 2 - this.arrowElWidth / 2;
                    break;
                case 'right':
                    this.arrowLeft = this.posElWidth - this.relElWidth / 2 - this.arrowElWidth / 2;
                    break;
            }
        });

        testNormalPositioning.call(this);
    }

    function positionRelativeElementAtMiddleBoundaries(placement) {
        switch (placement) {
            case 'left':
                createRelativeEl.call(this, 0, 480);
                break;
            case 'right':
                createRelativeEl.call(this, 900, 480);
                break;
            case 'top':
                createRelativeEl.call(this, 450, 0);
                break;
            case 'bottom':
                createRelativeEl.call(this, 450, 960);
                break;
        }
    }

    function createPositionedEl(customWidth, customHeight) {
        this.posElWidth = customWidth || 200;
        this.posElHeight = customHeight || 200;
        this.posEl = createElement('div', this.posElWidth, this.posElHeight);
    }

    function createRelativeEl(left, top, customWidth, customHeight) {
        this.relElWidth = customWidth || 100;
        this.relElHeight = customHeight || 40;
        this.relElLeft = left;
        this.relElTop = top;
        this.relEl = createElement('button', this.relElWidth, this.relElHeight, this.relElLeft, this.relElTop);
    }

    function createArrowEl(customWidth, customHeight) {
        this.arrowElWidth = customWidth || 10;
        this.arrowElHeight = customHeight || 10;
        this.arrowEl = createElement('div', this.arrowElWidth, this.arrowElHeight, null, null, this.posEl);
    }

    function createContainerEl(left, top, customWidth, customHeight) {
        this.containerElLeft = left || 250;
        this.containerElTop = top || 250;
        this.containerElWidth = customWidth || 500;
        this.containerElHeight = customHeight || 500;
        this.containerEl = createElement('div', this.containerElWidth, this.containerElHeight, this.containerElLeft, this.containerElTop);
        this.containerEl.appendChild(this.posEl);
        this.containerEl.appendChild(this.relEl);
    }

    function createElement(tag, width, height, left, top, appendToEl) {
        var el = document.createElement(tag);

        el.style.width = width + 'px';
        el.style.height = height + 'px';
        el.style.position = 'absolute';

        if (typeof top === 'number') {
            el.style.top = top + 'px';
        }

        if (typeof left === 'number') {
            el.style.left = left + 'px';
        }

        (appendToEl || document.body).appendChild(el);
        return el;
    }

    function createCompleteSpy() {
        this.options.complete = function() {};
        spyOn(this.options, 'complete');
    }

    function setPositionerOptions() {
        this.options.arrowElement = this.arrowEl;
        this.options.containerElement = this.containerEl;
        this.options.elementCushion = this.elementCushion;
        this.options.containerCushion = this.containerCushion;
        this.options.alignmentOffset = this.alignmentOffset;
        return this.options;
    }
});