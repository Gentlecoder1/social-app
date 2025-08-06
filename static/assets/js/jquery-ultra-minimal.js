/*!
 * jQuery Ultra-Minimal Build for Social Media App
 * Contains only essential functionality used in the project
 * Based on jQuery v3.3.1 | https://jquery.com/
 */
(function (window) {
  "use strict";

  var document = window.document;
  var slice = Array.prototype.slice;

  // Main jQuery function
  function jQuery(selector, context) {
    return new jQuery.fn.init(selector, context);
  }

  jQuery.fn = jQuery.prototype = {
    jquery: "3.3.1-ultra-minimal",
    constructor: jQuery,
    length: 0,

    each: function (callback) {
      for (var i = 0; i < this.length; i++) {
        if (callback.call(this[i], i, this[i]) === false) {
          break;
        }
      }
      return this;
    },

    get: function (num) {
      return num == null
        ? slice.call(this)
        : this[num < 0 ? this.length + num : num];
    },
  };

  // Element selection and initialization
  jQuery.fn.init = function (selector, context) {
    var match, elem;

    if (!selector) {
      return this;
    }

    if (typeof selector === "string") {
      // Simple ID selector
      if (selector.charAt(0) === "#" && selector.indexOf(" ") === -1) {
        elem = document.getElementById(selector.slice(1));
        if (elem) {
          this[0] = elem;
          this.length = 1;
        }
        return this;
      }
      // Use querySelectorAll for other selectors
      var nodeList = (context || document).querySelectorAll(selector);
      for (var i = 0; i < nodeList.length; i++) {
        this[i] = nodeList[i];
      }
      this.length = nodeList.length;
      return this;
    } else if (selector.nodeType) {
      this[0] = selector;
      this.length = 1;
      return this;
    } else if (typeof selector === "function") {
      return jQuery.ready(selector);
    }

    return this;
  };

  jQuery.fn.init.prototype = jQuery.fn;

  // Essential utilities
  jQuery.extend = jQuery.fn.extend = function () {
    var target = arguments[0] || {};
    var length = arguments.length;
    var i = 1;

    if (length === 1) {
      target = this;
      i = 0;
    }

    for (; i < length; i++) {
      var options = arguments[i];
      if (options != null) {
        for (var name in options) {
          target[name] = options[name];
        }
      }
    }
    return target;
  };

  jQuery.extend({
    isFunction: function (obj) {
      return typeof obj === "function";
    },

    ready: function (callback) {
      if (document.readyState !== "loading") {
        callback();
      } else {
        document.addEventListener("DOMContentLoaded", callback);
      }
    },
  });

  // DOM manipulation methods
  jQuery.fn.extend({
    // Class manipulation
    addClass: function (className) {
      return this.each(function () {
        if (this.nodeType === 1) {
          var classes = className.split(/\s+/);
          for (var i = 0; i < classes.length; i++) {
            if (classes[i]) {
              this.classList.add(classes[i]);
            }
          }
        }
      });
    },

    removeClass: function (className) {
      return this.each(function () {
        if (this.nodeType === 1) {
          if (className) {
            var classes = className.split(/\s+/);
            for (var i = 0; i < classes.length; i++) {
              if (classes[i]) {
                this.classList.remove(classes[i]);
              }
            }
          } else {
            this.className = "";
          }
        }
      });
    },

    toggleClass: function (className) {
      return this.each(function () {
        if (this.nodeType === 1) {
          var classes = className.split(/\s+/);
          for (var i = 0; i < classes.length; i++) {
            if (classes[i]) {
              this.classList.toggle(classes[i]);
            }
          }
        }
      });
    },

    hasClass: function (className) {
      for (var i = 0; i < this.length; i++) {
        if (this[i].nodeType === 1 && this[i].classList.contains(className)) {
          return true;
        }
      }
      return false;
    },

    // DOM traversal
    parent: function () {
      var matched = [];
      this.each(function () {
        var parent = this.parentNode;
        if (parent && parent.nodeType !== 11) {
          matched.push(parent);
        }
      });
      return jQuery(matched);
    },

    children: function () {
      var matched = [];
      this.each(function () {
        var children = this.children;
        for (var i = 0; i < children.length; i++) {
          matched.push(children[i]);
        }
      });
      return jQuery(matched);
    },

    siblings: function () {
      var matched = [];
      this.each(function () {
        var siblings = this.parentNode ? this.parentNode.children : [];
        for (var i = 0; i < siblings.length; i++) {
          if (siblings[i] !== this) {
            matched.push(siblings[i]);
          }
        }
      });
      return jQuery(matched);
    },

    find: function (selector) {
      var matched = [];
      this.each(function () {
        var found = this.querySelectorAll(selector);
        for (var i = 0; i < found.length; i++) {
          matched.push(found[i]);
        }
      });
      return jQuery(matched);
    },

    // Text and properties
    text: function (value) {
      if (value === undefined) {
        return this[0] ? this[0].textContent : "";
      }
      return this.each(function () {
        this.textContent = value;
      });
    },

    prop: function (name, value) {
      if (value === undefined) {
        return this[0] ? this[0][name] : undefined;
      }
      return this.each(function () {
        this[name] = value;
      });
    },

    // Event handling
    on: function (events, handler) {
      var eventTypes = events.split(/\s+/);
      return this.each(function () {
        var element = this;
        for (var i = 0; i < eventTypes.length; i++) {
          element.addEventListener(eventTypes[i], handler, false);
        }
      });
    },

    // Basic animations
    slideUp: function (duration, callback) {
      duration = duration || 400;
      return this.each(function () {
        var element = this;
        var height = element.offsetHeight;
        var startTime = Date.now();

        function animate() {
          var elapsed = Date.now() - startTime;
          var progress = Math.min(elapsed / duration, 1);

          element.style.height = height * (1 - progress) + "px";
          element.style.overflow = "hidden";

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            element.style.display = "none";
            element.style.height = "";
            element.style.overflow = "";
            if (callback) callback.call(element);
          }
        }
        requestAnimationFrame(animate);
      });
    },

    slideToggle: function (duration, callback) {
      return this.each(function () {
        var $this = jQuery(this);
        if (window.getComputedStyle(this).display === "none") {
          // slideDown
          this.style.display = "block";
          var height = this.offsetHeight;
          this.style.height = "0px";
          this.style.overflow = "hidden";

          var startTime = Date.now();
          var dur = duration || 400;

          function animate() {
            var elapsed = Date.now() - startTime;
            var progress = Math.min(elapsed / dur, 1);

            this.style.height = height * progress + "px";

            if (progress < 1) {
              requestAnimationFrame(animate.bind(this));
            } else {
              this.style.height = "";
              this.style.overflow = "";
              if (callback) callback.call(this);
            }
          }
          requestAnimationFrame(animate.bind(this));
        } else {
          $this.slideUp(duration, callback);
        }
      });
    },
  });

  // Document ready
  jQuery.ready = function (callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  };

  // Export to global
  window.jQuery = window.$ = jQuery;
})(window);
