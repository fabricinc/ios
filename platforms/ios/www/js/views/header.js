    var HeaderModel = Backbone.Model.extend({
        defaults: {
            home: false,
			player: false,
            slider: false,
            title: "",
            leftButton: {
                label: "Back",
                action: "back",
                visibility: "visible",
                class: "back"
            },
            rightButton: {
                label: "",
                action: "edit",
                visibility: "hidden",
                class: "edit"
            }
        }
    });

    var HeaderView = Backbone.View.extend({
        tagName: "header",
        model: null,

        initialize: function(options, callback) { // Pass options value to the Model
            this.model = new HeaderModel(options);

            this.render(options, callback);
            return this;
        },

        render: function(options, callback) {
            callback = callback || function() {};
            options = options || {};
            options.leftButton = options.leftButton || {};
            options.rightButton = options.rightButton || {};

            var tmp = this.model.get("home") ? "homeHeader" : "header",
                sections = ["all", "movie", "tv", "travel", "music"],
                data = this.model.toJSON();
                data.label = sections[APP.sectionID];
                var html = APP.load(tmp, data);

            this.$el.html(html);

            callback();

            return this;
        },

        bindEvents: function() {
            return this;
        },

        dealloc: function() {
            return this;
        }
    });

