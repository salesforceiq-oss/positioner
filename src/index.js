var capitalize = require('capitalize');
var transitionEnd = require('@util/transition-end');

var polarPositions = {
    bottom: 'top',
    top: 'bottom',
    right: 'left',
    left: 'right'
};
var positions = ['top', 'right', 'bottom', 'left'];
var hiddenDisplayRegEx = /^(none|table(?!-c[ea]).+)/;
var showStyles = {
    position: 'absolute',
    left: '-10000px', // needed so element does not wrap when positioned relative to a static <body>
    display: '',
    visibility: getVisibilityForShowStyles
};

/*
 * elem: element to be positioned relative to 'relativeElem'
 * relativeElem: the target element that that 'elem' will be positioned relative to
 * options: (Object) contains
 *      containerCushion: (int) pixels of space to give the 'elem' distance from the 4 sides of the window
 *      elementCushion: (int) pixels of space to give the 'elem' in its relative direction
 *      arrowElement: (jq element) arrow (nose triangle) element
 */
module.exports = function position(elem, relativeElem, options) {
    var elemBCR = getVisibleBCR(elem);
    var relElemBCR = getVisibleBCR(relativeElem);
    options = options || {};

    var props = {
        elem: elem,
        relElem: relativeElem,
        arrowEl: options.arrowElement,
        elemSize: {
            width: elemBCR.width,
            height: elemBCR.height
        },
        elemPos: {
            top: elemBCR.top + window.pageYOffset - document.body.scrollTop,
            bottom: elemBCR.bottom + window.pageYOffset - document.body.scrollTop,
            left: elemBCR.left + window.pageXOffset - document.body.scrollLeft,
            right: elemBCR.right + window.pageXOffset - document.body.scrollLeft
        },
        relElemSize: {
            width: relElemBCR.width,
            height: relElemBCR.height
        },
        relElemPos: {
            top: relElemBCR.top + window.pageYOffset - document.body.scrollTop,
            bottom: relElemBCR.bottom + window.pageYOffset - document.body.scrollTop,
            left: relElemBCR.left + window.pageXOffset - document.body.scrollLeft,
            right: relElemBCR.right + window.pageXOffset - document.body.scrollLeft
        },
        offsetParentProps: getOffsetParentProps(elem, options.containerElement),
        elementCushion: parseSpacingProperties(options.elementCushion || ''),
        containerCushion: parseSpacingProperties(options.containerCushion || ''),
        alignmentOffset: options.alignmentOffset || 0,
        options: options
    };

    return {
        at: doSetPosition.bind(this, props),
        below: doSetPosition.bind(this, props, 'bottom', false),
        above: doSetPosition.bind(this, props, 'top', false),
        left: doSetPosition.bind(this, props, 'left', false),
        right: doSetPosition.bind(this, props, 'right', false),
        arrow: doPositionArrow.bind(this, props)
    };
};

function doSetPosition(props, positionString, optimizePlacement, alignmentString) {
    props.positioningOrder = getPositioningOrder(positionString, optimizePlacement);
    props.alignment = getAlignment(alignmentString);
    setPosition(props);
}

function setPosition(props) {
    var finalPlacement = '';
    var standardPosition = null;
    var boundedOffset = null;
    var unoptimizedStanfordPosition = null;
    var unoptimizedBoundedOffset = null;

    removePositionClasses(props);

    props.positioningOrder.every(function(placement, i) {
        standardPosition = getStandardPosition(props, placement);
        boundedOffset = getBoundedOffset(props, standardPosition, placement);

        if (i === 0) {
            unoptimizedStanfordPosition = standardPosition;
            unoptimizedBoundedOffset = boundedOffset;
        }

        if ((boundedOffset.left !== 0 && boundedOffset.top !== 0) || //if both axes don't fit in window, check next placement) {
            (boundedOffset.left > 0 && placement === 'left') || //if over left side, slide reposition ineffective
            (boundedOffset.left < 0 && placement === 'right') || //if over right side, slide reposition ineffective
            (boundedOffset.top > 0 && placement === 'top') || //if over top side, slide reposition ineffective
            (boundedOffset.top < 0 && placement === 'bottom')) { //if over bottom side, slide reposition ineffective
            return true;
        }

        finalPlacement = placement;
        return false;
    });

    if (finalPlacement) {
        applyFinalPosition(props, finalPlacement, standardPosition, boundedOffset);
    } else {
        //if nothing works, go back to the original placement value
        applyFinalPosition(props, props.positioningOrder[0], unoptimizedStanfordPosition, unoptimizedBoundedOffset);
    }
}

function applyFinalPosition(props, finalPlacement, standardPosition, boundedOffset) {
    var result = standardPosition;

    addPositionClass(props, finalPlacement);

    if (props.arrowEl) {
        adjustPositionForArrowEl(props, result, finalPlacement, boundedOffset);
    } else {
        adjustForOptimalPosition(props, result, boundedOffset, finalPlacement, 'left', 'width');
        adjustForOptimalPosition(props, result, boundedOffset, finalPlacement, 'top', 'height');
    }

    adjustForContainerOffset(props, result);
    maybeCallPrePosition(props, result);
    maybeSetPositionWithTransition(props, result);
}

function maybeSetPositionWithTransition(props, result) {
    if (typeof props.options.complete === 'function') {
        var transitionProps = '';

        if (parseFloat(props.elem.style.left) !== result.left) {
            transitionProps += 'left ';
        }

        if (parseFloat(props.elem.style.top) !== result.top) {
            transitionProps += 'top';
        }

        if (transitionProps) {
            setPositionStyles(props.elem, result.top, result.left);
            transitionEnd(props.elem, props.options.complete, transitionProps, true);
        } else {
            setPositionStyles(props.elem, result.top, result.left);
            props.options.complete();
        }
    } else {
        setPositionStyles(props.elem, result.top, result.left);
    }
}

function maybeCallPrePosition(props, result) {
    if (typeof props.options.prePosition === 'function') {
        props.options.prePosition(props.elem, result.left, result.top);
    }
}

function doPositionArrow(props) {
    if (props.arrowEl) {
        var currentElemPos = {
            top: props.elemPos.top,
            left: props.elemPos.left
        };

        adjustPositionForArrowEl(props, currentElemPos, getCurrentPlacement(props), {
            top: 0,
            left: 0
        });
    }
}

//assumes that the arrow css includes defaults of left === 50% and margin-(left/top) === half width/height
function adjustPositionForArrowEl(props, result, finalPlacement, boundedOffset) {
    //calculate the arrowElBCR once the position class is added
    var arrowElBCR = getVisibleBCR(props.arrowEl, props.elem);
    props.arrowElSize = {
        width: arrowElBCR.width,
        height: arrowElBCR.height
    };
    setPositionStyles(props.arrowEl);

    var capitalPos = capitalize(finalPlacement);
    var computedStyle = window.getComputedStyle(props.elem);
    var borderLeftWidth = parseFloat(computedStyle['borderLeftWidth']) || 0;
    var borderTopWidth = parseFloat(computedStyle['borderTopWidth']) || 0;
    var borderRadiusNear, borderRadiusFar;
    if (finalPlacement === 'top' || finalPlacement === 'bottom') {
        borderRadiusNear = parseFloat(computedStyle['border' + capitalPos + 'LeftRadius']) || 0;
        borderRadiusFar = parseFloat(computedStyle['border' + capitalPos + 'RightRadius']) || 0;
        doAdjustPositionAndArrowEl(props, result, boundedOffset, finalPlacement, 'left', 'width', borderLeftWidth, borderRadiusNear, borderRadiusFar);
        props.arrowEl.style.top = (finalPlacement === 'top' ? props.elemSize.height : -props.arrowElSize.height) - borderTopWidth + 'px';
    } else if (finalPlacement === 'left' || finalPlacement === 'right') {
        borderRadiusNear = parseFloat(computedStyle['borderTop' + capitalPos + 'Radius']) || 0;
        borderRadiusFar = parseFloat(computedStyle['borderBottom' + capitalPos + 'Radius']) || 0;
        doAdjustPositionAndArrowEl(props, result, boundedOffset, finalPlacement, 'top', 'height', borderTopWidth, borderRadiusNear, borderRadiusFar);
        props.arrowEl.style.left = (finalPlacement === 'left' ? props.elemSize.width : -props.arrowElSize.width) - borderLeftWidth + 'px';
    }
}


function doAdjustPositionAndArrowEl(props, result, boundedOffset, placement, pos, sizeProp, borderNearWidth, borderRadiusNear, borderRadiusFar) {
    //set optimal positioning for posEl first before setting arrow position so that we can use the posEl position for calculations
    adjustForOptimalPosition(props, result, boundedOffset, placement, pos, sizeProp, props.arrowElSize[sizeProp] + borderRadiusFar, props.arrowElSize[sizeProp] + borderRadiusNear);

    var lowestPositionOnPosEl = borderRadiusNear - borderNearWidth;
    var highestPositionOnPosEl = props.elemSize[sizeProp] - borderRadiusFar - borderNearWidth - props.arrowElSize[sizeProp];

    var relElNearOffsetFromPosEl = props.relElemPos[pos] - result[pos];
    var relElFarOffsetFromPosEl = props.relElemPos[polarPositions[pos]] - result[pos];
    var lowestPositionOnRelEl = relElNearOffsetFromPosEl - borderRadiusNear - borderNearWidth;
    var highestPositionOnRelEl = relElFarOffsetFromPosEl - props.arrowElSize[sizeProp] - borderNearWidth;
    var centeredPositionOnRelEl = relElNearOffsetFromPosEl + props.relElemSize[sizeProp] / 2 - props.arrowElSize[sizeProp] / 2 - borderNearWidth;

    var lowestPosition = Math.max(lowestPositionOnPosEl, lowestPositionOnRelEl);
    var highestPosition = Math.min(highestPositionOnPosEl, highestPositionOnRelEl);

    props.arrowEl.style[pos] = Math.max(lowestPosition, Math.min(centeredPositionOnRelEl, highestPosition)) + 'px';
}

function adjustForOptimalPosition(props, result, boundedOffset, placement, position, sizeProp, lowerPadding, higherPadding) {
    var lowestPosition = props.relElemPos[position] - getSizeWithCushion(props, props.elemSize, placement)[sizeProp] + (lowerPadding || 0);
    var highestPosition = props.relElemPos[position] + getSizeWithCushion(props, props.relElemSize, placement)[sizeProp] - (higherPadding || 0);
    var standardOptimizedPosition = result[position] + boundedOffset[position];
    result[position] = Math.max(lowestPosition, Math.min(standardOptimizedPosition, highestPosition));
}

function adjustForContainerOffset(props, result) {
    result.left = result.left - props.offsetParentProps.elem.offsetLeft + props.offsetParentProps.scrollLeft;
    result.top = result.top - props.offsetParentProps.elem.offsetTop + props.offsetParentProps.scrollTop;
}

function getStandardPosition(props, pos) {
    var cushion = getElementCushionForPlacement(props, pos);
    var result = {};

    switch (pos) {
        case 'left':
            result.left = props.relElemPos.left - props.elemSize.width - cushion;
            result.top = getTopForSidePlacement(props);
            break;
        case 'right':
            result.left = props.relElemPos.right + cushion;
            result.top = getTopForSidePlacement(props);
            break;
        case 'top':
            result.left = getLeftForVerticalPlacement(props);
            result.top = props.relElemPos.top - props.elemSize.height - cushion;
            break;
        case 'bottom':
        default:
            result.left = getLeftForVerticalPlacement(props);
            result.top = props.relElemPos.bottom + cushion;
            break;
    }

    return result;
}

function getBoundedOffset(props, standardPosition, placement) {
    var elemSizeWithCushion = getSizeWithCushion(props, props.elemSize, placement);
    return {
        left: getBoundedOffsetForPosition(props, standardPosition.left, elemSizeWithCushion.width, 'left', 'width'),
        top: getBoundedOffsetForPosition(props, standardPosition.top, elemSizeWithCushion.height, 'top', 'height')
    };
}

function removePositionClasses(props) {
    positions.forEach(function(className) {
        props.elem.classList.remove(className);
        if (props.arrowEl) {
            props.arrowEl.classList.remove(className);
        }
    });
}

function addPositionClass(props, className) {
    if (className) {
        props.elem.classList.add(className);
        if (props.arrowEl) {
            props.arrowEl.classList.add(polarPositions[className]);
        }
    }
}

function setPositionStyles(el, top, left) {
    el.style.top = typeof top === 'number' ? top + 'px' : '';
    el.style.left = typeof left === 'number' ? left + 'px' : '';
}

function getTopForSidePlacement(props) {
    if (props.alignment.bottom) {
        return props.relElemPos.bottom - props.elemSize.height + props.alignmentOffset;
    } else if (!props.alignment.top) {
        return props.relElemPos.top + props.relElemSize.height / 2 - props.elemSize.height / 2;
    } else {
        return props.relElemPos.top + props.alignmentOffset;
    }
}

function getLeftForVerticalPlacement(props) {
    if (props.alignment.right) {
        return props.relElemPos.right - props.elemSize.width + props.alignmentOffset;
    } else if (!props.alignment.left) {
        return props.relElemPos.left + props.relElemSize.width / 2 - props.elemSize.width / 2;
    } else {
        return props.relElemPos.left + props.alignmentOffset;
    }
}

function getBoundedOffsetForPosition(props, position, size, offsetType, measurementType) {
    var cushion = props.containerCushion[offsetType];
    var nearBound = Math.max(0, props.offsetParentProps[offsetType]) + cushion;
    var farBound = Math.min(window['inner' + capitalize(measurementType)], props.offsetParentProps[offsetType] + props.offsetParentProps[measurementType]) - cushion;

    if (position <= nearBound) {
        return nearBound - position;
    }

    var lengthPos = position + size;
    if (lengthPos >= farBound) {
        if (farBound - nearBound >= size) { //if the position using farBound still fits past nearBound
            return farBound - lengthPos;
        } else {
            return nearBound - position;
        }
    }
    return 0;
}

function getPositioningOrder(positionString, optimizePlacement) {
    var order = splitByCommaAndSpaces(positionString);

    if (order.length === 1 && optimizePlacement) {
        return getOptimizedPositioningOrder(order[0]);
    }

    return order;
}

function getOptimizedPositioningOrder(placement) {
    var order = [placement];
    var secondPlacement = polarPositions[placement];
    order.push(secondPlacement);
    order.push(secondPlacement === 'bottom' || secondPlacement === 'top' ? 'right' : 'bottom');
    order.push(polarPositions[order[order.length - 1]]);
    return order;
}

function getAlignment(str) {
    str = str ? str.toLowerCase() : '';
    return {
        top: str.indexOf('top') >= 0,
        right: str.indexOf('right') >= 0,
        bottom: str.indexOf('bottom') >= 0,
        left: str.indexOf('left') >= 0
    };
}

function getOffsetParentProps(positionElem, containerElem) {
    var offsetParent = containerElem;

    if (!offsetParent) {
        offsetParent = tempStyle(positionElem, showStyles, function() {
            return positionElem.offsetParent;
        }) || document.body;
    }

    var bcr = getVisibleBCR(offsetParent);
    var isStaticBody = offsetParent === document.body && window.getComputedStyle(document.body).position === 'static';
    var scrollLeft = isStaticBody ? window.pageXOffset : offsetParent.scrollLeft;
    var scrollTop = isStaticBody ? window.pageYOffset : offsetParent.scrollTop;

    return {
        elem: offsetParent,
        width: isStaticBody ? window.innerWidth : bcr.width,
        height: isStaticBody ? window.innerHeight : bcr.height,
        left: scrollLeft + (isStaticBody ? 0 : bcr.left),
        top: scrollTop + (isStaticBody ? 0 : bcr.top),
        scrollLeft: scrollLeft,
        scrollTop: scrollTop
    };
}

function getVisibleBCR(el, parentDisplayEl) {
    if (parentDisplayEl && isNotDisplayed(parentDisplayEl)) {
        return tempStyle(parentDisplayEl, showStyles, function() {
            return getVisibleBCR(el);
        });
    } else if (isNotDisplayed(el)) {
        return tempStyle(el, showStyles, function() {
            return el.getBoundingClientRect();
        });
    }

    return el.getBoundingClientRect();
}

function getSizeWithCushion(props, elSize, placement) {
    var cushion = getElementCushionForPlacement(props, placement);
    return {
        width: elSize.width + (placement === 'left' || placement === 'right' ? cushion : 0),
        height: elSize.height + (placement === 'top' || placement === 'bottom' ? cushion : 0)
    };
}

function getElementCushionForPlacement(props, placement) {
    return props.elementCushion[polarPositions[placement]];
}

function parseSpacingProperties(spacing) {
    if (typeof spacing === 'number') {
        return fillObjectWithValues(positions, spacing);
    } else if (typeof spacing === 'string') {
        var values = splitByCommaAndSpaces(spacing);

        if (values.length <= 1) {
            return fillObjectWithValues(positions, parseFloat(values[0]) || 0);
        } else {
            var result = {};
            positions.forEach(function(pos, i) {
                var valueIdx = values.length === 2 ? i % 2 : values.length === 3 ? (i % 2 || i) : i;
                result[pos] = parseFloat(values[valueIdx]);
            });
            return result;
        }
    }
    return fillObjectWithValues(positions, 0);
}

function fillObjectWithValues(keys, value) {
    var result = {};
    keys.forEach(function(key) {
        result[key] = value;
    });
    return result;
}

function splitByCommaAndSpaces(str) {
    return str.trim().toLowerCase().split(/[ ,]+/);
}

function isNotDisplayed(el) {
    var computed = window.getComputedStyle(el);
    var display = computed ? computed.display : undefined;
    return el.offsetWidth === 0 && hiddenDisplayRegEx.test(display);
}

function getCurrentPlacement(props) {
    if (props.elemPos.bottom <= props.relElemPos.top) {
        return 'top';
    } else if (props.elemPos.top >= props.relElemPos.bottom) {
        return 'bottom';
    } else if (props.elemPos.right <= props.relElemPos.left) {
        return 'left';
    } else if (props.elemPos.left >= props.relElemPos.right) {
        return 'right';
    }
}

function tempStyle(elem, styles, callback) {
    var old = {};
    var name, ret;
    var convertedStyles = {};

    for (name in styles) {
        var valOrFn = styles[name];
        convertedStyles[name] = typeof valOrFn === 'function' ? valOrFn(elem) : valOrFn;
    }

    for (name in convertedStyles) {
        old[name] = {
            value: elem.style.getPropertyValue(name),
            priority: elem.style.getPropertyPriority(name)
        };

        elem.style.removeProperty(name);
        if (name) {
            elem.style.setProperty(name, convertedStyles[name], 'important');
        }
    }

    ret = callback.apply(elem);

    for (name in convertedStyles) {
        elem.style.removeProperty(name);
        elem.style.setProperty(name, old[name].value, old[name].priority);
    }

    return ret;
}

function getVisibilityForShowStyles(el) {
    return isNotDisplayed(el) ? 'hidden' : '';
}