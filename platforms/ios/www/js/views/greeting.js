var GreetingModel = Backbone.Model.extend({
    userID: null,
    suggestion: null,
    greetedUser: null,

    initialize: function(opts) {
        this.userID = opts.userID || null;
    },

    init: function(callback) {
        var self = this;
        callback = callback || function() { };

        Api.getSuggestedGreeting(this.userID, function(response) {
            if(response.greeted) {
                Backbone.history.navigate("messages/" + self.userID, true);
                return false;
            } else {
                var user = response.data.user[0], fName = user.uName.split(" ")[0];
                self.greetedUser = user;

                if(response.data.suggestion) {
                    var listSUM = parseInt(response.data.suggestion[0].listSUM),
                        movieTitle = response.data.suggestion[0].title;

                    switch(listSUM) {
                        case 9:
                            self.suggestion = "Hi " + fName + ". What did you think of " + movieTitle + "?";
                            break;
                        case 7:
                            self.suggestion = "Hi " + fName + ". Would you say " + movieTitle + " is worth seeing?";
                            break;
                        case 12:
                            self.suggestion = "Hi " + fName + ". Looks like we both love " + movieTitle + ". Isn't it great?";
                            break;
                        default:
                            self.suggestion = "Hi " + fName + ". I think you have great taste in movies. Seen anything good lately?";
                    }
                    callback(user, response.data.suggestion[0], self.suggestion);
                } else {
                    self.suggestion = "Hi, " + fName + ". I think you have great taste in movies. Seen anything good lately?";
                    callback(user, null, self.suggestion);
                }
            }
        });
    },

    bindEvents: function() {
        var gS = APP.gameState,
            self = this;
        var params = {
                "Match Name": self.greetedUser.uName,
                "Facebook Account": gS.isFacebook,
                "Location": gS.city,
                "Age": gS.age
            };

        $("#send-suggestion").fastClick(function() {
            if(parseInt(APP.gameState.credits) > 0) {
                Api.sendGreeting(self.userID, self.suggestion, function(response) {
                    if(response.success) {
                        APP.gameState.credits = (parseInt(APP.gameState.credits) - 1).toString();
                        Backbone.history.navigate("matches", true);
                        params = { "Greeting type": "Suggested" }
                        mixpanel.track("Greeting sent ", params);
                        if(Analytics) { Analytics.eventAndParams("Greeting Sent", params ); }
                    }
                });
            } else {
                Util.alert("No worries - your credits are restored each day so you'll be back in action tomorrow", "Out Of Credits");
            }
        });

        $("#send-message").fastClick(function() {
            if(parseInt(APP.gameState.credits) > 0) {
                var msg = $("#custom-message").val();
                Api.sendGreeting(self.userID, msg, function(response) {
                    if(response.success) {
                        APP.gameState.credits = (parseInt(APP.gameState.credits) - 1).toString();
                        Backbone.history.navigate("back", true);
                        params = { "Greeting type": "Custom" }
                        mixpanel.track("Greeting sent ", params);
                        if(Analytics) { Analytics.eventAndParams("Greeting Sent", params); }
                    }
                });
            } else {
                Util.alert("No worries - your credits are restored each day so you'll be back in action tomorrow", "Out Of Credits");
            }
        });
    }
});

var GreetingView = Backbone.View.extend({
    model: null,

    initialize: function(options, callback) {
        options = options || {};
        callback = callback || function() {};

        this.model = new GreetingModel(options);

        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};

        APP.models.greeting = self.model;

        self.model.init(function(user, data, suggestion) {
            var html = APP.load("greeting", { user: user, data: data, suggestion: suggestion });
            self.$el.html(html);

            self.header = new HeaderView({ title: "Greeting" });
            self.$el.prepend(self.header.el);

            $("#wrapper").html(self.$el.html());

            self.model.bindEvents();

            callback();
        });
    },

    dealloc: function() {

    }
});