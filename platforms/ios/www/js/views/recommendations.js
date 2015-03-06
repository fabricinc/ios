var RecommendationsModel = Backbone.Model.extend({
		view: null,
        filter: "recent",
        feedData: null,
        shareInfo: null,

		initialize: function(options) {

	    },
	    init: function(callback) {
            /*Api.getMovieRecommendations("recent", function(response){
                callback(response);
            });*/

	    },
        getFeed: function(feedType, callback) {
            var self = this;
            Api.getMovieRecommendations(feedType, function(response) {
                callback(response);
            });
        },
        filterShowHide: function() {
            var show = $("#settings-mask").hasClass("show") ? "" : "show",
                tall = $("#rec-filter-block").height() === 25 ? 163 : 25,
                data = $("#rec-filter").data("filter"),
                mask = $("#settings-mask");

            $(".check.mark").removeClass("mark");
            $("#"+ data +"-button .check").addClass("mark");

            if(show === "show") {
                mask.show();
            } else {
                setTimeout(function() { mask.hide(); }, 200);
            }

            setTimeout(function() {
                mask.attr({ class: show });
                $("#rec-filter-block").height(tall);
            }, 100);
        },
        bindVideoEvents: function() {
            var self = this,
                player = $("video"), //object for video player
                trailer = player[0], //object for current trailer (play - pause)
                loader = $("#trailer-loader"),
                exit = $("#exit-trailer-load");

            loader.click(function() {});
            
            trailer.addEventListener("loadstart", function() {
                setTimeout(function() {
                    loader.add(exit).show();
                }, 250);

            }, false);

            trailer.addEventListener("playing", function() {
                trailer.currentTime = 0;
                loader.add(exit).hide();
            }, false);

            //pressed 'done' and exited full screen
            trailer.addEventListener("webkitendfullscreen", function() {
                setTimeout(function(){
                    player.css({ "top": "460px" });
                    loader.add(exit).hide();
                },250);
                setTimeout(function(){
                    player.hide();
                    player.remove();
                },400);
            }, false);

            // Error occurs with playback
            trailer.addEventListener("error", function() {
                player.css({ "top": "460px" });
                loader.add(exit).hide();
                setTimeout(function(){
                    player.hide();
                    player.remove();
                },400);
            });

            // Trailer ends and exits full screen then disappears 
            trailer.addEventListener("ended", function(){
                trailer.webkitExitFullscreen();
                setTimeout(function(){
                    player.css({ "top": "460px" });
                    
                },250);
                setTimeout(function(){
                    player.hide();
                    player.remove();
                },400);
            }, false);
        },
        createFeed: function(request, response){
            var friends = request === "friends" ? true : false,
                newAndU = request === "recent" ? true : false,
                date = new Date(),
                feedData = [],
                self = this,
                z = 0;

            //filter out movies without trailer stills
            if(response.success){
                if(response.data.length){
                    for(x = 0; x < response.data.length; x++){
                        if (response.data[x].trailer_still != null && response.data[x].trailer_still != ""){
                            feedData[z] = response.data[x];
                            z++;
                        };
                    }
                }
            } else {
                feedData = false;
            }

            var html = APP.load("recFeedItems", { 
                friends: friends, 
                filter: request,
                feed: feedData,
                date: date,  
            });
            $("#feed").empty();
            $("#feed").html(html);

            // lay out cards in masonry (Pinterest) fashion
            $('.js-masonry').masonry();

            self.feedData = feedData;
        },
        bindEvents: function(){
            var self = this,
                feedData = [];
            feedData = self.feedData;

            self.bindVideoEvents();
        // watch trailer 
            $(".poster").unbind().click(function(){
                var videoPlayer = "<video id='trailer-player'></video>",
                    z = $(this).parents(".feed-item").data("count"),
                    src = feedData[z].link,
                    params = {
                        movieID: feedData[z].movieID,
                        title: feedData[z].title,
                        filter: $("#rec-filter").html()
                    };

                if (!$("video").length){
                    $("#recommendations-feed").append(videoPlayer);
                    self.bindVideoEvents();
                };

                $("video").css("display", "block").attr("src", src);
                $("video")[0].load();

                setTimeout(function(){
                    $("video").css({"top": "0"});
                    setTimeout(function(){
                        $("video")[0].play();
                    },800);
                },50);

                if(Analytics)  Analytics.eventAndParams("Recommendations - Trailer watched", params); 
            });
            $(".view-all-seen").unbind().click(function(){
                var route = self.filter === "social-feed" ? "recommendedByList/" : "userLists/",
                    z = $(this).parents(".feed-item").data("count"),
                    publishedID = feedData[z].publishedid;

                Backbone.history.navigate(route + publishedID, true);
            });
        // Show and Hide the filter options
            $("#rec-filter-block").unbind().fastClick(function(e){
                e.preventDefault();
                e.stopPropagation();

                self.filterShowHide();
                return false;
            });
        // Aplly Filter to the feed 
            $(".filter-button").unbind().fastClick(function(e){
                e.preventDefault();
                e.stopPropagation();
                var filter = $(this)[0].id.slice(0,-7),
                    text = $(this).text().toLowerCase(),
                    request = filter == "social-feed" ? "friends" : filter,
                    videoPlayer = "<video id='trailer-player'></video>";

                UI.mask();

                self.filter = filter;
                APP.recFilter = filter;

                //Update the data filter on rec-filter
                $("#rec-filter").data("filter", filter).html(text);
                self.filterShowHide();

                self.getFeed(request, function(response){

                    self.createFeed(request, response);
                    $("#recommendations-feed").append(videoPlayer);
                    
                    UI.scroller.scrollTo(0,0,80);
                    
                    self.bindEvents();

                    UI.unmask();
                    UI.scroller.refresh();
                });
                return false;
            });
            $(".add-queue").click(function(){
                var z = $(this).parents(".feed-footer").data("count"),
                    set = $(this).hasClass("active") ? false : true,
                    publishedID = feedData[z].publishedid,
                    params = {
                        movieID: feedData[z].movieID,
                        title: feedData[z].title,
                        filter: $("#rec-filter").html()
                    };
                
                $(this).toggleClass("active");

                Api.setMovieToFabricList(
                    publishedID,
                    APP.gameState.watchListID,
                    set 
                );
                if(set) {
                    Api.createFeed("queue", feedData[z].movieID);
                    if(Analytics)  Analytics.eventAndParams("Recommendations - Movie Queued", params);
                }
                if(Analytics)  Analytics.eventAndParams("Recommendations - Trailer watched", params); 
            });
            $(".share").click(function() {
                var z = $(this).parents(".feed-footer").data("count"),
                    publishedID = feedData[z].publishedid,
                    title = feedData[z].title;

                // set movie to be share on the model
                self.shareInfo = feedData[z];

                UI.showShareOptions("recommendations-feed");
            });
            $(".movie-info").click(function(){
                var z = $(this).parents(".feed-footer").data("count"),
                    movieID = feedData[z].movieID;

                Backbone.history.navigate("movieLobby/"+ movieID, true);
            });
            // Share functions
            $("#popup-options div").unbind().click(function(e){
                e.preventDefault();
                e.stopPropagation();
                var action = $(this)[0].id,
                    movie = self.shareInfo;

                if(movie){
                    if(action === "facebook-share"){
                        var options = {
                            method: 'feed',
                            name: movie.title,
                            link: "www.trailerpop.com/play_trailer/play/" + movie.publishedid,
                            picture: movie.trailer_still,
                            description: "Discover more movies @trailerpop"
                        }
                        
                        FB.ui(options, function(response){});
                    } else if(action === "twitter-share"){

                        User.tweet({ 
                            title: movie.title, 
                            publishedid: movie.publishedid, 
                            poster: "",
                        }, 
                        "shareMovie", 
                        function(){});
                    }
                }
                self.shareInfo = null; // clear shareinfo
                UI.putAwaySlideUp();
                return false;
            });
        }
	});
	
	var RecommendationsView = Backbone.View.extend({
        id: "recommendations-feed",
		model: null,
		header: null,

        initialize: function(options, callback){
            callback = callback || function() {};

            this.model = new RecommendationsModel(options);

            return this;
        },
        render: function(callback){
			var self = this,
                filter = typeof APP.recFilter === "undefined" ? "recent" : APP.recFilter,
                request = filter == "social-feed" ? "friends" : filter,
                text = {
                    "recent": "New and Upcoming",
                    "social-feed": "Popular with Friends",
                    "popular": "Popular All-Time"
                };

			callback = callback || function(){ };

			self.model.getFeed(request, function(response){
                var feedData = [],
                    html = APP.load("recommendations");

                self.$el.html(html);

                if (!self.header){ 
                    self.header = new HeaderView({ 
                        leftButton: { class: "slide" },
                        title: "recommendations"
                    }); 
                    self.$el.prepend(self.header.el);
                }

                $("#wrapper").html(self.$el);

                //Update the data filter on rec-filter
                $("#rec-filter").data("filter", filter).html(text[filter]);

                self.model.createFeed(request, response);
                
                self.model.bindEvents();
                UI.initScroller($("#feed-container")[0]);
                
                // Give posters time to finish loading and refresh the scroller 
                setTimeout(function(){ 
                    UI.scroller.refresh();
                },2000);

                callback();
            });
            mixpanel.track("Recommendations Accessed");
        },
        dealloc: function(){ }
    });