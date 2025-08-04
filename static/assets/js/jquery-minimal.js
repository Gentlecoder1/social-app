(function (global, factory) {
  "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document
      ? factory(global, true)
      : function (w) {
          if (!w.document) {
            throw new Error("jQuery requires a window with a document");
          }
          return factory(w);
        };
  } else {
    factory(global);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";

  var arr = [];
  var document = window.document;
  var getProto = Object.getPrototypeOf;
  var slice = arr.slice;
  var concat = arr.concat;
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};

  var version = "3.3.1-minimal";

  // Main jQuery function
  var jQuery = function (selector, context) {
    return new jQuery.fn.init(selector, context);
  };

  var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  var rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;

  jQuery.fn = jQuery.prototype = {
    jquery: version,
    constructor: jQuery,
    length: 0,

    toArray: function () {
      return slice.call(this);
    },

    get: function (num) {
      if (num == null) {
        return slice.call(this);
      }
      return num < 0 ? this[num + this.length] : this[num];
    },

    pushStack: function (elems) {
      var ret = jQuery.merge(this.constructor(), elems);
      ret.prevObject = this;
      return ret;
    },

    each: function (callback) {
      return jQuery.each(this, callback);
    },

    map: function (callback) {
      return this.pushStack(
        jQuery.map(this, function (elem, i) {
          return callback.call(elem, i, elem);
        })
      );
    },

    slice: function () {
      return this.pushStack(slice.apply(this, arguments));
    },

    first: function () {
      return this.eq(0);
    },

    last: function () {
      return this.eq(-1);
    },

    eq: function (i) {
      var len = this.length,
        j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },

    end: function () {
      return this.prevObject || this.constructor();
    },
  };

  jQuery.extend = jQuery.fn.extend = function () {
    var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    if (typeof target === "boolean") {
      deep = target;
      target = arguments[i] || {};
      i++;
    }

    if (typeof target !== "object" && !jQuery.isFunction(target)) {
      target = {};
    }

    if (i === length) {
      target = this;
      i--;
    }

    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          src = target[name];
          copy = options[name];

          if (target === copy) {
            continue;
          }

          if (
            deep &&
            copy &&
            (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))
          ) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Array.isArray(src) ? src : [];
            } else {
              clone = src && jQuery.isPlainObject(src) ? src : {};
            }

            target[name] = jQuery.extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    return target;
  };

  jQuery.extend({
    expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),

    isReady: true,

    error: function (msg) {
      throw new Error(msg);
    },

    noop: function () {},

    isFunction: function (obj) {
      return typeof obj === "function";
    },

    isArray: Array.isArray,

    isWindow: function (obj) {
      return obj != null && obj === obj.window;
    },

    isNumeric: function (obj) {
      var type = jQuery.type(obj);
      return (
        (type === "number" || type === "string") &&
        !isNaN(obj - parseFloat(obj))
      );
    },

    isPlainObject: function (obj) {
      var proto, Ctor;
      if (!obj || toString.call(obj) !== "[object Object]") {
        return false;
      }
      proto = getProto(obj);
      if (!proto) {
        return true;
      }
      Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
      return (
        typeof Ctor === "function" &&
        fnToString.call(Ctor) === ObjectFunctionString
      );
    },

    isEmptyObject: function (obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },

    type: function (obj) {
      if (obj == null) {
        return obj + "";
      }
      return typeof obj === "object" || typeof obj === "function"
        ? class2type[toString.call(obj)] || "object"
        : typeof obj;
    },

    each: function (obj, callback) {
      var length,
        i = 0;

      if (isArrayLike(obj)) {
        length = obj.length;
        for (; i < length; i++) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      } else {
        for (i in obj) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      }

      return obj;
    },

    trim: function (text) {
      return text == null ? "" : (text + "").replace(rtrim, "");
    },

    makeArray: function (arr, results) {
      var ret = results || [];

      if (arr != null) {
        if (isArrayLike(Object(arr))) {
          jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
        } else {
          push.call(ret, arr);
        }
      }

      return ret;
    },

    inArray: function (elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
    },

    merge: function (first, second) {
      var len = +second.length,
        j = 0,
        i = first.length;

      for (; j < len; j++) {
        first[i++] = second[j];
      }

      first.length = i;

      return first;
    },

    grep: function (elems, callback, invert) {
      var callbackInverse,
        matches = [],
        i = 0,
        length = elems.length,
        callbackExpected = !invert;

      for (; i < length; i++) {
        callbackInverse = !callback(elems[i], i);
        if (callbackInverse !== callbackExpected) {
          matches.push(elems[i]);
        }
      }

      return matches;
    },

    map: function (elems, callback, arg) {
      var length,
        value,
        i = 0,
        ret = [];

      if (isArrayLike(elems)) {
        length = elems.length;
        for (; i < length; i++) {
          value = callback(elems[i], i, arg);

          if (value != null) {
            ret.push(value);
          }
        }
      } else {
        for (i in elems) {
          value = callback(elems[i], i, arg);

          if (value != null) {
            ret.push(value);
          }
        }
      }

      return concat.apply([], ret);
    },

    // Document ready functionality
    ready: function (fn) {
      if (
        document.readyState === "complete" ||
        (document.readyState !== "loading" &&
          !document.documentElement.doScroll)
      ) {
        window.setTimeout(jQuery.ready);
      } else {
        document.addEventListener("DOMContentLoaded", completed);
        window.addEventListener("load", completed);
      }

      function completed() {
        document.removeEventListener("DOMContentLoaded", completed);
        window.removeEventListener("load", completed);
        jQuery.ready();
      }

      if (document.readyState === "complete") {
        window.setTimeout(fn);
      } else {
        jQuery(document).on("ready", fn);
      }

      return this;
    },
  });

  function isArrayLike(obj) {
    var length = !!obj && "length" in obj && obj.length,
      type = jQuery.type(obj);

    if (type === "function" || jQuery.isWindow(obj)) {
      return false;
    }

    return (
      type === "array" ||
      length === 0 ||
      (typeof length === "number" && length > 0 && length - 1 in obj)
    );
  }

  // Element selection
  var init = (jQuery.fn.init = function (selector, context, root) {
    var match, elem;

    if (!selector) {
      return this;
    }

    root = root || document;

    if (typeof selector === "string") {
      if (
        selector[0] === "<" &&
        selector[selector.length - 1] === ">" &&
        selector.length >= 3
      ) {
        match = [null, selector, null];
      } else {
        match = rquickExpr.exec(selector);
      }

      if (match && (match[1] || !context)) {
        if (match[1]) {
          context = context instanceof jQuery ? context[0] : context;
          jQuery.merge(
            this,
            jQuery.parseHTML(
              match[1],
              context && context.nodeType
                ? context.ownerDocument || context
                : document,
              true
            )
          );
          return this;
        } else {
          elem = document.getElementById(match[2]);
          if (elem) {
            this[0] = elem;
            this.length = 1;
          }
          return this;
        }
      } else if (!context || context.jquery) {
        return (context || root).find(selector);
      } else {
        return this.constructor(context).find(selector);
      }
    } else if (selector.nodeType) {
      this[0] = selector;
      this.length = 1;
      return this;
    } else if (jQuery.isFunction(selector)) {
      return root.ready !== undefined ? root.ready(selector) : selector(jQuery);
    }

    return jQuery.makeArray(selector, this);
  });

  init.prototype = jQuery.fn;

  // Find implementation
  jQuery.fn.extend({
    find: function (selector) {
      var i,
        ret,
        len = this.length,
        self = this;

      if (typeof selector !== "string") {
        return this.pushStack(
          jQuery(selector).filter(function () {
            for (i = 0; i < len; i++) {
              if (jQuery.contains(self[i], this)) {
                return true;
              }
            }
          })
        );
      }

      ret = this.pushStack([]);

      for (i = 0; i < len; i++) {
        jQuery.find(selector, self[i], ret);
      }

      return ret;
    },
  });

  // Basic DOM manipulation
  jQuery.fn.extend({
    addClass: function (value) {
      var classes,
        elem,
        cur,
        curValue,
        clazz,
        j,
        finalValue,
        i = 0;

      if (jQuery.isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).addClass(value.call(this, j, getClass(this)));
        });
      }

      if (typeof value === "string" && value) {
        classes = value.match(/\S+/g) || [];

        while ((elem = this[i++])) {
          curValue = getClass(elem);
          cur =
            elem.nodeType === 1 &&
            (" " + curValue + " ").replace(/[\t\r\n\f]/g, " ");

          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {
              if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
              }
            }

            finalValue = cur.trim();
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }

      return this;
    },

    removeClass: function (value) {
      var classes,
        elem,
        cur,
        curValue,
        clazz,
        j,
        finalValue,
        i = 0;

      if (jQuery.isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).removeClass(value.call(this, j, getClass(this)));
        });
      }

      if (!arguments.length) {
        return this.attr("class", "");
      }

      if (typeof value === "string" && value) {
        classes = value.match(/\S+/g) || [];

        while ((elem = this[i++])) {
          curValue = getClass(elem);
          cur =
            elem.nodeType === 1 &&
            (" " + curValue + " ").replace(/[\t\r\n\f]/g, " ");

          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {
              while (cur.indexOf(" " + clazz + " ") > -1) {
                cur = cur.replace(" " + clazz + " ", " ");
              }
            }

            finalValue = cur.trim();
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }

      return this;
    },

    toggleClass: function (value, stateVal) {
      var type = typeof value;

      if (typeof stateVal === "boolean" && type === "string") {
        return stateVal ? this.addClass(value) : this.removeClass(value);
      }

      if (jQuery.isFunction(value)) {
        return this.each(function (i) {
          jQuery(this).toggleClass(
            value.call(this, i, getClass(this), stateVal),
            stateVal
          );
        });
      }

      return this.each(function () {
        var className, i, self, classNames;

        if (type === "string") {
          i = 0;
          self = jQuery(this);
          classNames = value.match(/\S+/g) || [];

          while ((className = classNames[i++])) {
            if (self.hasClass(className)) {
              self.removeClass(className);
            } else {
              self.addClass(className);
            }
          }
        } else if (value === undefined || type === "boolean") {
          className = getClass(this);
          if (className) {
            this._className = className;
          }

          this.setAttribute(
            "class",
            className || value === false ? "" : this._className || ""
          );
        }
      });
    },

    hasClass: function (selector) {
      var className,
        elem,
        i = 0;

      className = " " + selector + " ";
      while ((elem = this[i++])) {
        if (
          elem.nodeType === 1 &&
          (" " + getClass(elem) + " ")
            .replace(/[\t\r\n\f]/g, " ")
            .indexOf(className) > -1
        ) {
          return true;
        }
      }

      return false;
    },
  });

  function getClass(elem) {
    return (elem.getAttribute && elem.getAttribute("class")) || "";
  }

  // Basic traversal
  jQuery.fn.extend({
    parent: function (selector) {
      var matched = jQuery.map(this, function (elem) {
        var parent = elem.parentNode;
        return parent && parent.nodeType !== 11 ? parent : null;
      });

      return matched.length > 1 ? jQuery.uniqueSort(matched) : matched;
    },

    parents: function (selector) {
      return this.dir("parentNode", selector);
    },

    children: function (selector) {
      return jQuery.map(this, function (elem) {
        return jQuery.makeArray(elem.childNodes).filter(function (node) {
          return node.nodeType === 1;
        });
      });
    },

    siblings: function (selector) {
      return this.map(function () {
        return jQuery.grep(
          jQuery.makeArray(this.parentNode ? this.parentNode.childNodes : []),
          function (elem) {
            return elem.nodeType === 1 && elem !== this;
          }.bind(this)
        );
      });
    },

    dir: function (dir, until) {
      var matched = [],
        truncate = until !== undefined;

      while ((dir = dir[dir]) && dir.nodeType !== 9) {
        if (dir.nodeType === 1) {
          if (truncate && jQuery(dir).is(until)) {
            break;
          }
          matched.push(dir);
        }
      }
      return matched;
    },
  });

  // Event handling
  var rkeyEvent = /^key/;
  var rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/;

  jQuery.event = {
    global: {},
    add: function (elem, types, handler, data, selector) {
      var handleObjIn,
        eventHandle,
        tmp,
        events,
        t,
        handleObj,
        special,
        handlers,
        type,
        namespaces,
        origType,
        elemData = jQuery._data(elem);

      if (!elemData) {
        return;
      }

      if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      }

      if (!handler.guid) {
        handler.guid = jQuery.guid++;
      }

      if (!(events = elemData.events)) {
        events = elemData.events = {};
      }

      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function (e) {
          return typeof jQuery !== "undefined" &&
            jQuery.event.triggered !== e.type
            ? jQuery.event.dispatch.apply(elem, arguments)
            : undefined;
        };
      }

      types = (types || "").match(/\S+/g) || [""];
      t = types.length;
      while (t--) {
        tmp = types[t].split(".");
        type = origType = tmp[0];
        namespaces = (tmp[1] || "").split(".").sort();

        if (!type) {
          continue;
        }

        handleObj = {
          type: type,
          origType: origType,
          data: data,
          handler: handler,
          guid: handler.guid,
          selector: selector,
          needsContext: selector && /^\s*[>~+]/.test(selector),
          namespace: namespaces.join("."),
        };

        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0;
        }

        handlers.push(handleObj);

        if (!jQuery.event.global[type]) {
          jQuery.event.global[type] = true;
        }
      }

      elem.addEventListener(types[0], eventHandle);
    },

    dispatch: function (event) {
      event = jQuery.event.fix(event);

      var i,
        j,
        ret,
        matched,
        handleObj,
        handlerQueue = [],
        args = slice.call(arguments),
        handlers = (jQuery._data(this, "events") || {})[event.type] || [],
        special = jQuery.event.special[event.type] || {};

      args[0] = event;
      event.delegateTarget = this;

      handlerQueue = handlerQueue.concat(handlers);

      i = 0;
      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;

        j = 0;
        while (
          (handleObj = matched.handlers[j++]) &&
          !event.isImmediatePropagationStopped()
        ) {
          if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;

            ret = handleObj.handler.apply(matched.elem, args);

            if (ret !== undefined) {
              if ((event.result = ret) === false) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      }

      return event.result;
    },

    fix: function (event) {
      if (event[jQuery.expando]) {
        return event;
      }

      var i,
        prop,
        copy,
        type = event.type,
        originalEvent = event,
        fixHook = this.fixHooks[type];

      if (!fixHook) {
        this.fixHooks[type] = fixHook = rmouseEvent.test(type)
          ? this.mouseHooks
          : rkeyEvent.test(type)
          ? this.keyHooks
          : {};
      }
      copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;

      event = new jQuery.Event(originalEvent);

      i = copy.length;
      while (i--) {
        prop = copy[i];
        event[prop] = originalEvent[prop];
      }

      if (!event.target) {
        event.target = document;
      }

      if (event.target.nodeType === 3) {
        event.target = event.target.parentNode;
      }

      return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
    },

    special: {},
    fixHooks: {},
    keyHooks: {
      props: "char charCode key keyCode".split(" "),
      filter: function (event, original) {
        if (event.which == null) {
          event.which =
            original.charCode != null ? original.charCode : original.keyCode;
        }
        return event;
      },
    },
    mouseHooks: {
      props:
        "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(
          " "
        ),
      filter: function (event, original) {
        var eventDoc,
          doc,
          body,
          button = original.button;

        if (event.pageX == null && original.clientX != null) {
          eventDoc = event.target.ownerDocument || document;
          doc = eventDoc.documentElement;
          body = eventDoc.body;

          event.pageX =
            original.clientX +
            ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
            ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
          event.pageY =
            original.clientY +
            ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
            ((doc && doc.clientTop) || (body && body.clientTop) || 0);
        }

        if (!event.which && button !== undefined) {
          event.which = button & 1 ? 1 : button & 2 ? 3 : button & 4 ? 2 : 0;
        }

        return event;
      },
    },

    props:
      "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(
        " "
      ),
  };

  jQuery.Event = function (src, props) {
    if (!(this instanceof jQuery.Event)) {
      return new jQuery.Event(src, props);
    }

    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;
      this.isDefaultPrevented =
        src.defaultPrevented ||
        (src.defaultPrevented === undefined && src.returnValue === false)
          ? returnTrue
          : returnFalse;
    } else {
      this.type = src;
    }

    if (props) {
      jQuery.extend(this, props);
    }

    this.timeStamp = (src && src.timeStamp) || jQuery.now();

    this[jQuery.expando] = true;
  };

  function returnFalse() {
    return false;
  }

  function returnTrue() {
    return true;
  }

  jQuery.Event.prototype = {
    constructor: jQuery.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,

    preventDefault: function () {
      var e = this.originalEvent;

      this.isDefaultPrevented = returnTrue;

      if (e) {
        e.preventDefault();
      }
    },

    stopPropagation: function () {
      var e = this.originalEvent;

      this.isPropagationStopped = returnTrue;

      if (e) {
        e.stopPropagation();
      }
    },

    stopImmediatePropagation: function () {
      var e = this.originalEvent;

      this.isImmediatePropagationStopped = returnTrue;

      if (e) {
        e.stopImmediatePropagation();
      }

      this.stopPropagation();
    },
  };

  jQuery.fn.extend({
    on: function (types, selector, data, fn) {
      return on(this, types, selector, data, fn);
    },

    off: function (types, selector, fn) {
      var handleObj, type;
      if (types && types.preventDefault && types.handleObj) {
        handleObj = types.handleObj;
        jQuery(types.delegateTarget).off(
          handleObj.namespace
            ? handleObj.origType + "." + handleObj.namespace
            : handleObj.origType,
          handleObj.selector,
          handleObj.handler
        );
        return this;
      }
      if (typeof types === "object") {
        for (type in types) {
          this.off(type, selector, types[type]);
        }
        return this;
      }
      if (selector === false || typeof selector === "function") {
        fn = selector;
        selector = undefined;
      }
      if (fn === false) {
        fn = returnFalse;
      }
      return this.each(function () {
        jQuery.event.remove(this, types, fn, selector);
      });
    },
  });

  function on(elem, types, selector, data, fn, one) {
    var origFn, type;

    if (typeof types === "object") {
      if (typeof selector !== "string") {
        data = data || selector;
        selector = undefined;
      }
      for (type in types) {
        on(elem, type, selector, data, types[type], one);
      }
      return elem;
    }

    if (data == null && fn == null) {
      fn = selector;
      data = selector = undefined;
    } else if (fn == null) {
      if (typeof selector === "string") {
        fn = data;
        data = undefined;
      } else {
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if (fn === false) {
      fn = returnFalse;
    } else if (!fn) {
      return elem;
    }

    if (one === 1) {
      origFn = fn;
      fn = function (event) {
        jQuery().off(event);
        return origFn.apply(this, arguments);
      };
      fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }

    return elem.each(function () {
      jQuery.event.add(this, types, fn, data, selector);
    });
  }

  // Basic effects (slideUp, slideToggle)
  jQuery.fn.extend({
    slideUp: function (duration, complete) {
      return this.animate({ height: "0px" }, duration || 400, function () {
        this.style.display = "none";
        if (complete) complete.call(this);
      });
    },

    slideToggle: function (duration, complete) {
      return this.each(function () {
        var $this = jQuery(this);
        if ($this.is(":visible")) {
          $this.slideUp(duration, complete);
        } else {
          $this.slideDown(duration, complete);
        }
      });
    },

    slideDown: function (duration, complete) {
      return this.animate({ height: "auto" }, duration || 400, function () {
        this.style.display = "block";
        if (complete) complete.call(this);
      });
    },

    animate: function (properties, duration, complete) {
      return this.each(function () {
        var elem = this;
        var start = {};
        var end = {};

        for (var prop in properties) {
          start[prop] = elem.style[prop] || getComputedStyle(elem)[prop];
          end[prop] = properties[prop];
        }

        var startTime = Date.now();
        var dur = typeof duration === "number" ? duration : 400;

        function step() {
          var progress = Math.min(1, (Date.now() - startTime) / dur);

          for (var prop in properties) {
            if (prop === "height") {
              if (end[prop] === "0px") {
                elem.style.height =
                  parseFloat(start[prop]) * (1 - progress) + "px";
              } else if (end[prop] === "auto") {
                elem.style.height = parseFloat(start[prop]) * progress + "px";
              }
            }
          }

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            if (complete) complete.call(elem);
          }
        }

        requestAnimationFrame(step);
      });
    },
  });

  // Attributes and properties
  jQuery.fn.extend({
    attr: function (name, value) {
      return access(this, jQuery.attr, name, value, arguments.length > 1);
    },

    prop: function (name, value) {
      return access(this, jQuery.prop, name, value, arguments.length > 1);
    },

    text: function (value) {
      return access(
        this,
        function (value) {
          return value === undefined
            ? this.textContent
            : this.empty().each(function () {
                this.textContent = value;
              });
        },
        null,
        value,
        arguments.length
      );
    },
  });

  jQuery.extend({
    attr: function (elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType;

      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }

      if (typeof elem.getAttribute === "undefined") {
        return jQuery.prop(elem, name, value);
      }

      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        hooks =
          jQuery.attrHooks[name.toLowerCase()] ||
          (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
      }

      if (value !== undefined) {
        if (value === null) {
          jQuery.removeAttr(elem, name);
          return;
        }

        if (
          hooks &&
          "set" in hooks &&
          (ret = hooks.set(elem, value, name)) !== undefined
        ) {
          return ret;
        }

        elem.setAttribute(name, value + "");
        return value;
      }

      if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }

      ret = elem.getAttribute(name);
      return ret == null ? undefined : ret;
    },

    prop: function (elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType;

      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }

      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        name = jQuery.propFix[name] || name;
        hooks = jQuery.propHooks[name];
      }

      if (value !== undefined) {
        if (
          hooks &&
          "set" in hooks &&
          (ret = hooks.set(elem, value, name)) !== undefined
        ) {
          return ret;
        }

        return (elem[name] = value);
      }

      if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }

      return elem[name];
    },

    attrHooks: {},
    propHooks: {},
    propFix: {
      for: "htmlFor",
      class: "className",
    },
  });

  var boolHook = {
    set: function (elem, value, name) {
      if (value === false) {
        jQuery.removeAttr(elem, name);
      } else {
        elem.setAttribute(name, name);
      }
      return name;
    },
  };

  function access(elems, fn, key, value, chainable, emptyGet, raw) {
    var i = 0,
      length = elems.length,
      bulk = key == null;

    if (jQuery.type(key) === "object") {
      chainable = true;
      for (i in key) {
        access(elems, fn, i, key[i], true, emptyGet, raw);
      }
    } else if (value !== undefined) {
      chainable = true;

      if (!jQuery.isFunction(value)) {
        raw = true;
      }

      if (bulk) {
        if (raw) {
          fn.call(elems, value);
          fn = null;
        } else {
          bulk = fn;
          fn = function (elem, key, value) {
            return bulk.call(jQuery(elem), value);
          };
        }
      }

      if (fn) {
        for (; i < length; i++) {
          fn(
            elems[i],
            key,
            raw ? value : value.call(elems[i], i, fn(elems[i], key))
          );
        }
      }
    }

    if (chainable) {
      return elems;
    }

    if (bulk) {
      return fn.call(elems);
    }

    return length ? fn(elems[0], key) : emptyGet;
  }

  // Data storage
  var dataUser = {};
  var dataPriv = {};

  jQuery.extend({
    acceptData: function (elem) {
      var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()];
      return (
        !noData || (noData !== true && elem.getAttribute("classid") === noData)
      );
    },

    _data: function (elem, name, data) {
      return internalData(elem, name, data, dataPriv);
    },

    _removeData: function (elem, name) {
      return internalRemoveData(elem, name, dataPriv);
    },
  });

  function internalData(elem, name, data, pvt) {
    if (!jQuery.acceptData(elem)) {
      return;
    }

    var ret,
      thisCache,
      internalKey = jQuery.expando,
      isNode = elem.nodeType,
      cache = isNode ? pvt : elem,
      id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;

    if (
      (!id || !cache[id] || (!pvt && !cache[id].data)) &&
      data === undefined &&
      typeof name === "string"
    ) {
      return;
    }

    if (!id) {
      if (isNode) {
        id = elem[internalKey] = jQuery.guid++;
      } else {
        id = internalKey;
      }
    }

    if (!cache[id]) {
      cache[id] = isNode
        ? {}
        : {
            toJSON: jQuery.noop,
          };
    }

    if (typeof name === "object" || typeof name === "function") {
      if (pvt) {
        cache[id] = jQuery.extend(cache[id], name);
      } else {
        cache[id].data = jQuery.extend(cache[id].data, name);
      }
    }

    thisCache = cache[id];

    if (!pvt) {
      if (!thisCache.data) {
        thisCache.data = {};
      }

      thisCache = thisCache.data;
    }

    if (data !== undefined) {
      thisCache[name] = data;
    }

    return typeof name === "string" ? thisCache[name] : thisCache;
  }

  function internalRemoveData(elem, name, pvt) {
    if (!jQuery.acceptData(elem)) {
      return;
    }

    var thisCache,
      i,
      isNode = elem.nodeType,
      cache = isNode ? pvt : elem,
      id = isNode ? elem[jQuery.expando] : jQuery.expando;

    if (!cache[id]) {
      return;
    }

    if (name) {
      thisCache = pvt ? cache[id] : cache[id].data;

      if (thisCache) {
        if (!jQuery.isArray(name)) {
          if (name in thisCache) {
            name = [name];
          } else {
            name = name.split(" ");
          }
        } else {
          name = name.concat(
            jQuery.map(name, function (name) {
              return name.split(" ");
            })
          );
        }

        i = name.length;
        while (i--) {
          delete thisCache[name[i]];
        }

        if (
          pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache)
        ) {
          return;
        }
      }
    }

    if (!pvt) {
      delete cache[id].data;

      if (!isEmptyDataObject(cache[id])) {
        return;
      }
    }

    if (isNode) {
      delete elem[jQuery.expando];
    } else {
      delete elem[jQuery.expando];
    }
  }

  function isEmptyDataObject(obj) {
    var name;
    for (name in obj) {
      if (name === "data" && jQuery.isEmptyObject(obj[name])) {
        continue;
      }
      if (name !== "toJSON") {
        return false;
      }
    }

    return true;
  }

  // Setup ready event
  jQuery.ready.promise = function (obj) {
    if (!readyList) {
      readyList = jQuery.Deferred();

      if (document.readyState === "complete") {
        window.setTimeout(jQuery.ready);
      } else {
        document.addEventListener("DOMContentLoaded", completed);
        window.addEventListener("load", completed);
      }
    }
    return readyList.promise(obj);
  };

  var readyList;

  function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
    window.removeEventListener("load", completed);
    jQuery.ready();
  }

  jQuery.ready = function () {
    if (jQuery.isReady) {
      return;
    }

    jQuery.isReady = true;

    if (readyList) {
      readyList.resolve(jQuery);
    }
  };

  // Utilities
  jQuery.guid = 1;
  jQuery.now = Date.now;

  // Support utilities (minimal)
  jQuery.support = support;

  if (typeof Symbol === "function") {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
  }

  // Map over jQuery in case of overwrite
  var _jQuery = window.jQuery,
    _$ = window.$;

  jQuery.noConflict = function (deep) {
    if (window.$ === jQuery) {
      window.$ = _$;
    }

    if (deep && window.jQuery === jQuery) {
      window.jQuery = _jQuery;
    }

    return jQuery;
  };

  if (!noGlobal) {
    window.jQuery = window.$ = jQuery;
  }

  return jQuery;
});
