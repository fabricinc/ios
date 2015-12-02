    var HeaderModel = Backbone.Model.extend({
        defaults: {
            home: false,
			player: false,
            slider: false,
            self: false,
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
            },
            facebookID: null,
        },
        initialize: function(){

            this.set('facebookID', APP.gameState.facebookID);

        },
    });

    var HeaderView = Backbone.View.extend({
        tagName: "header",
        model: null,

        initialize: function(options, callback) { // Pass options value to the Model
            this.model = new HeaderModel(options);


            this.listenTo(this.model, 'change:facebookID', this.updateFacebookID);
            this.render(options, callback);
            return this;
        },
        events: {

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

        updateFacebookID: function() {

            var facebookID = this.model.get('facebookID');

            if(!facebookID) { return; }

            
            var image = "https://graph.facebook.com/"+ facebookID +"/picture?height=170&width=170";

            
            this.$('#profile-nav').css({'background-image' : 'url(' + image + ')' });


        },

        bindEvents: function() {
            return this;
        },

        setFacebookID: function(){

            this.model.set('facebookID', APP.gameState.facebookID);
        
        },

        dealloc: function() {
            return this;
        }
    });

