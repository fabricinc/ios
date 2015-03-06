var FeedModel = Backbone.Model.extend({
    userID: null,

    initialize: function(opts) {
        this.userID = opts.userID || null;
	},

    init: function(callback) {
        callback = callback || function() { };

        Api.getUserFeed(this.userID, function(response) {
            if(response.success) {
                callback(response.feed);
            } else {
                callback(response.success);
            }
        });
    },

	bindEvents: function() {

    }
});

var FeedView = Backbone.View.extend({
    model: null,

    // new
    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() {};

        this.model = new FeedModel(options);

        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};
        APP.models.feed = self.model;

        this.model.init(function(data) {
            self.loadUserFeed(data, callback);
        });
    },

    loadUserFeed: function(feed, callback) {
        var self = this;
        callback = callback || function() { };

        var html = APP.load("activityFeed", { feed: feed });
        $("#wrapper").html("<div id=\"feed-container\"><div id=\"feed\">" + html + "</div></div>");

        if (!self.header) {
            self.header = new HeaderView({ title: "Activity" });
            self.$el.prepend(self.header.el);
        }

        $("#wrapper").prepend(self.$el.html());

        self.bindUserFeedEvents();

        callback();
    },

    bindUserFeedEvents: function() {
        UI.initScroller($("#feed-container")[0]);

        $(".poster img").click(function() {
            var movieID = $(this).data("movieid");
            var categoryID = $(this).data("catid");

            APP.feedPos = UI.scroller.y;
            if(movieID) {
                Backbone.history.navigate("movieLobby/" + movieID, true);
            } else if(categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=null", true);
            }
        });

        $(".like").click(function() {
            var el = $(this);
            var feedID = $(this).parent().data("feedid");

            Api.likeFeed(feedID, function(response) {
                if(response.success) {
                    var tl = $("#like_"+feedID+" .totalLikes");
                    var tlNum = parseInt(tl.html());

                    if(el.hasClass("liked")) {
                        tlNum--;
                    } else {
                        tlNum++;
                    }

                    el.toggleClass("liked");
                    tl.html(tlNum);

                    if(tlNum <= 0) {
                        $("#like_"+feedID).hide();
                    } else {
                        $("#like_"+feedID).show();
                    }
                }
            });

            return false;
        });

        $(".comment").click(function(e) {
            var feedID = $(this).parent().data("feedid");
            var discussion = $("#feed"+feedID+" .feed-discussion");

            APP.feedPos = UI.scroller.y;
            Backbone.history.navigate("feedDiscussion/" + feedID, true);

            return false;
        });

        $(".likes").click(function(e) {
            var feedID = this.id.split("_")[1];
            Backbone.history.navigate("feedLikes/" + feedID, true);

            return false;
        });


        $(".avatar").click(function() {
            var actorID = $(this).data("actorid");

            APP.feedPos = UI.scroller.y;
            Backbone.history.navigate("profile/" + actorID, true);

            return false;
        });
        setTimeout(function(){
            UI.scroller.refresh();
        }, 4000);
    },

    dealloc: function() {

    }
});