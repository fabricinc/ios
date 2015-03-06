var ListModel = Backbone.Model.extend({
    title: null,
    listType: null,
    objectID: null,
    action: null,
    template: null,
    scrollerID: null,
    bindEvents: function() { },

    initialize: function(options) {
        this.listType = options.listType || null;
        this.objectID = options.objectID || null;
    },

    fetchData: function(callback) {
        var self = this;
        callback = callback || function() { };

        switch(self.listType) {
            case "favInCommon":
                self.action = "getFavsInCommon";
                self.template = "listRow";
                self.scrollerID = "list-row-wrapper";
                self.title = "Favorites";
                self.bindEvents = function() {
                    UI.bindMovieRowEvents();
                }
                break;
            case "queueInCommon":
                self.action = "getQueueInCommon";
                self.template = "listRow";
                self.scrollerID = "list-row-wrapper";
                self.title = "Want-Tos";
                self.bindEvents = function() {
                    UI.bindMovieRowEvents();
                }
                break;
            default:
                break;
        }

        Api[self.action](self.objectID, function(response) {
            self.set(response);

            callback();
        });

        return this;
    }
});

var ListView = Backbone.View.extend({
    model: null,

    initialize: function(options, callback) {
        callback = callback || function() { };

        this.model = new ListModel(options);

        callback();
        return this;
    },

    render: function(callback, update) {
        var self = this;
        callback = callback || function() { };

        self.model.fetchData(function() {
            var obj = self.model.toJSON();
            obj.listType = self.model.listType;
            obj.objectID = self.model.objectID;

            var payload = {};
            if(obj.listType == "favInCommon" || obj.listType == "queueInCommon") {
                payload = {
                    items: obj.data,
                    userLists: APP.gameState,
                    ownQueue: false
                };
            }
            var html = APP.load(self.model.template, payload);
            self.$el.html(html);

            if (!self.header) {
                var t = self.model.title || "List";
                self.header = new HeaderView({ title: t });
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);

            setTimeout(function() {
                UI.initScroller($("#" + self.model.scrollerID)[0]);
            }, 1000);

            self.model.bindEvents();

            //self.bindTileEvents();
            //self.setTimeouts();

            callback();
        });

        return this;
    },

    bindTileEvents: function() {
        var self = this;
    },

    dealloc: function() {
        var self = this;

        return this;
    }
});