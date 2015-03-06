var HomeModel = Backbone.Model.extend({
    start: 0,
    limit: 50,
    fetchData: function(callback) {
        var self = this;
        callback = callback || function() {};

        Api.getDiscoveryFeedPart(self.start, self.limit, function(response) {
            self.set(response);
            callback();
        });

        return this;
    }
});

var HomeView = Backbone.View.extend({
    id: "home",
    model: null,
    scroller: null,

    initialize: function(callback) {
        callback = callback || function() {};

        this.model = new HomeModel();

        callback();
        return this;
    },

    render: function(callback, update) {
        var self = this;
        callback = callback || function() { };
        // get newest data
        User.fetchData(function(success) {
            self.model.fetchData(function() {
                var html = APP.load("home", self.model.toJSON());
                self.$el.html(html);

                if (!self.header) {
                    self.header = new HeaderView({
                        slider: true,
                        leftButton: {class: "slide"},
                        title: "Discovery"
                        //home: true
                    });
                    self.$el.prepend(self.header.el);
                }

                $("#wrapper").html(self.$el);
                self.bindTileEvents();
                self.setTimeouts();

                callback();
            });
        });

        return this;
    },

	bindTileEvents: function() {
        var self = this;

        $("#status-update").on("input", function(e) {
            var title = $(this).val();

            if(title.length > 2) {
                Api.findMoviesLikeTitle($(this).val(), function(response) {
                    if(response.data.length > 0) {
                        var html = APP.load("feedSearchResults", { data: response.data });

                        $("#status-drop div").html(html);
                        $("#status-drop").addClass("on");

                        $("#status-drop .result").unbind("click").click(function() {
                            var movieID = $(this).data("movieid");
                            Backbone.history.navigate("statusUpdate/" + movieID, true);
                        });

                        //APP.feedPos = UI.scroller.y;s
                        UI.deallocScroller();
                        UI.initScroller($("#status-drop")[0]);
                        setTimeout(function() {
                            UI.scroller.on('scrollStart', function () {
                                $("#status-update").blur();
                            });
                        }, 500);
                    } else {
                        // hide the thing
                        $("#status-drop div").html("");
                        $("#status-drop").removeClass("on");
                        // remove scroller from it
                        UI.deallocScroller();
                        self.setTimeouts(200);
                    }
                });
            } else {
                // hide the thing
                $("#status-drop div").html("");
                $("#status-drop").removeClass("on");
                // remove scroller from it
                UI.deallocScroller();

                self.setTimeouts();
            }
        });

        $("#close-status-drop").fastClick(function(e) {
            e.preventDefault();
            e.stopPropagation();

            $("#status-update").val("");
            $("#status-drop div").html("");
            $("#status-drop").removeClass("on");

            UI.deallocScroller();
            self.setTimeouts();

            return false;
        });

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
	},

    setTimeouts: function(time) {
        time = time || 1000;
        var self = this;

        setTimeout(function() {
            if(APP.feedPos && APP.feedPos != 0) {
                UI.initScrollerOpts($("#feed-container")[0], {
                    vScrollbar: false,
                    hScroll: false,
                    bounce: true,
                    click: true,
                    startY: APP.feedPos
                });
                APP.feedPos = 0;
            } else {
                UI.initScroller($("#feed-container")[0]);
            }
        }, 100);

        // refresh after 1 second to give the posters enough time to space themselves
        setTimeout(function() {
            UI.scroller.refresh();
            UI.scroller.on("scrollEnd", function() {
                if(Math.abs(this.maxScrollY) - Math.abs(this.y) < 10) {
                    self.model.start = self.model.start + self.model.limit;
                    Api.getDiscoveryFeedPart(self.model.start, self.model.limit, function(response) {
                        var html = APP.load("feedItem", { feed: response.feed });
                        $("#feed").append(html);
                        UI.scroller.refresh();
                        self.bindTileEvents();
                        setTimeout(function() { UI.scroller.refresh() }, 1000); // we refresh again in 1 second to give the images time to load more properly
                    });
                }
            });
        }, time);
    },

    dealloc: function() {
        var self = this;
        this.click = false;
		
        return this;
    }
});