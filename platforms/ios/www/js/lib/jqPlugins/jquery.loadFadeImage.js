	// Create the defaults once
    var pluginName = "loadFadeImage",
        defaults = {};

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            this.loadFadeImage(this.element, this.options);
        },

        loadFadeImage: function(el, options) {
            var imageEl = el, //document.createElement("div"),
                img = new Image(),
                url = el.getAttribute("data-image");

            img.onload = function() {
                imageEl.style.backgroundImage = "url(" + url + ")";
                imageEl.style.backgroundRepeat = "no-repeat";
                if (!options.customSize)
                    imageEl.style.backgroundSize = "auto 100%";
                imageEl.className += " fade-in";
                delete img;
                return true;
            }

            img.src = url;

        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };