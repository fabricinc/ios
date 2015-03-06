var EventsModel = Backbone.Model.extend({
    eventID: null,
    action: null,

    initialize: function(opts) {
        this.eventID = opts.eventID || null;
        this.moviePublishedID = opts.moviePublishedID || null;
        this.action = opts.action || null;
    },

    fetchData: function(callback) {
        callback = callback || function() { };

        if(this.eventID) {
            Api.getMeetup(this.eventID, function(response) {
                if(response.success) {
                    callback({
                        meetup: response.data.meetup,
                        attendees: response.data.attendees
                    });
                } else {
                    callback(null);
                }
            });
        } else {
            Api.getMeetups(function(response) {
                callback({
                    meetups: response.data
                });
            });
        }
    },

    bindEvents: function(callback) {
        callback = callback || function () { };

        callback();
    },

    bindEvent: function(callback) {
        callback = callback || function () { };

        callback();
    },

    bindCreateEvent: function(callback) {
        callback = callback || function () { };

        callback();
    }
});

var EventsView = Backbone.View.extend({
    model: null,
    header: null,

    initialize: function(options, callback) {
        callback = callback || function() { };
        options = options || { };

        this.model = new EventsModel(options);

        callback();
        return this;
    },

    render: function(callback) {
        callback = callback || function() {};
        var self = this;

        if(this.model.action == "view") {
            this.model.fetchData(function(data) {
                if(self.model.eventID) {
                    var html = APP.load("event", data);
                    var title = "Event";
                    var cb = function() {
                        self.model.bindEvent(function() {
                            callback();
                        });
                    }
                } else {
                    var html = APP.load("events", data);
                    var title = "Events";
                    var cb = function() {
                        self.model.bindEvents(function() {
                            callback();
                        });
                    };
                }

                $("#wrapper").html(html);

                if (!self.header) {
                    self.header = new HeaderView({ title: title });
                    $("#wrapper").prepend(self.header.el);
                }

                cb();
            });
        } else if(this.model.action == "create") {

            // if we have a moviePublishedID, then grab that movie information to pre-load the event information

            var html = APP.load("createEvent");
            var title = "Create Event";
            var cb = function() {
                self.model.bindCreateEvent(function() {
                    callback();
                });
            }

            $("#wrapper").html(html);

            if (!self.header) {
                self.header = new HeaderView({
                    title: title
                });
                $("#wrapper").prepend(self.header.el);
            }

            cb();
        }

        return this;
    },

    dealloc: function() {
        var self = this;

        return this;
    }
});