var MatchesModel = Backbone.Model.extend({
    matchID: null,

    initialize: function() { },

    fetchData: function(callback) {
        callback = callback || function() { };

        Api.getUserMatches(function(response) {
            callback(response.data.reverse());
        });
    },

    bindMatchEvents: function() {
        $(".follow").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            var ele = this;
            var userID = $(this).parent().data("userid");
            var name = $(this).parent().parent().find(".name").html();

            // follow / don't follow
            if($(this).hasClass("following")) {

                var message = "Are you sure you want to unfollow " + name;
                navigator.notification.confirm(message, function(button){
                   if(button === 2) {
                        Api.unFollowUser(userID, function(response) {
                            if(response.success) {
                                $(ele).removeClass("following");
                                $(ele).html("Follow");
                            }
                        });
                    }
                }, null, ["Cancel", "Unfollow"]);
                /*Api.unFollowUser(userID, function(response) {
                    if(response.success) {
                        $(ele).removeClass("following");
                        $(ele).html("Follow");
                    }
                });*/
            } else {
                Api.followUser(userID, function(response) {
                    if(response.success) {
                        $(ele).addClass("following");
                        $(ele).html("Following");
                    }
                });
            }

            return false;
        });

        $(".greet").fastClick(function(e) {
            e.preventDefault();
            e.stopPropagation();

            var userID = $(this).parent().data("userid");

            if(!$(this).hasClass("greeted")) {
                Backbone.history.navigate("greeting/" + userID, true);
            } else {
                Backbone.history.navigate("messages/" + userID, true);
            }

            return false;
        });

        $(".avatar").click(function() {
            var userID = $(this).data("userid");
            if(userID) {
                Backbone.history.navigate("profile/" + userID, true);
                if(Analytics) Analytics.eventAndParams("Profile (other) viewed", { from: "match screen" });
            }
        });

        $("#user-matches #match-config").click(function() {
            // go to the settings page
            Backbone.history.navigate("settings/settingsSocial", true);
        });
    }
});

var MatchesView = Backbone.View.extend({
    model: null,
    header: null,
    id: "user-matches-wrapper",

    initialize: function(callback) {
        callback = callback || function() { };

        this.model = new MatchesModel();

        callback();
        return this;
    },

    render: function(callback) {
        callback = callback || function() { };
        var self = this;

        self.model.fetchData(function(matches) {
            var html = APP.load("userMatches", { matches: matches });
            self.$el.html(html);

            if (!self.header) {
                self.header = new HeaderView({
                    title: "People Like You",
                    leftButton: {class: "slide"}
                });
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);

            self.model.bindMatchEvents();
            setTimeout(function() { UI.initScroller($("#user-matches")[0]) }, 250);

            callback();
        });

        return this;
    },

    dealloc: function() {
        var self = this;

        return this;
    }
});