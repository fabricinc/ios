var MovieLobbyModel = Backbone.Model.extend({
    movieID: null,
    movie: null,
    gtiOS5: false,
    player: null,
    playing: false,
    services: false,
    friendData: null,
    seenData: null,
    kce: false,
    favorited: false,
    queued: false,

    initialize: function(opts) {
        this.kce = opts.kce || false;
        this.movieID = opts.movieID || null;
    },

    init: function(callback) {
        var self = this;
        callback = callback || function() { };

        Util.iOSVersion()[0] > 5 ? self.gtiOS5 = true : self.gtiOS5 = false;

	    // get the movie information and supply the html
	    Api.getMovieData(self.movieID, null, function(response) {
            if(!response.success) {
                Util.alert("Sorry! There was an error gathering movie data!", "Oops!");
                return false;
            }

            self.movie = response.movie;
            Api.getShoppingLinks(self.movie.moviePublishedID, function(response) {
                console.log(response);
                if(response.success){
                    self.services = response.data;
                } 
                
                callback(self.movie, self.services);
                Api.getMovieCommonUsers(self.movie.moviePublishedID, function(response) { 
                    self.loadSeenUsers(response); 
                });
            });
	    });

    },

    popupHide: function() {
        $("#popup-options").removeClass('show');
        $("#settings-mask").removeClass('show');
        setTimeout(function(){ 
            $("#settings-mask").remove();
            $("#popup-options").hide();
        }, 250);
    },
    
    bindMovieLobbyEvents: function(movie) {
        var self = this;
        var player = Player.set(self);
        self.player = document.getElementsByTagName("video")[0];

        player.ready(
            function () {
                var movieInfoStyleHeight = $("#movie-info").height();
                var synopsisWrapperStyleHeight = $("#synopsis-wrapper").height();
                var synopsisStyleHeight = $("#synopsis").height();
                var movieTitleStyleHeight = $("#movie-info #movie-title-heading").height();
                var moreButtonStyleHeight = $("#synopsis-wrapper #more").height();

				if(!self.playing) {
					//self.playing = true;
					//player.pressPlay(self.movie, false, self);
					this.timerActive = false;

					$("#fullscreen").fastClick(function() {
					    player.pause();
					    $("#player").removeAttr("webkit-playsinline");
                        player.pressPlay(self.movie, false, self);
                    });      
                    
                    $("#play, #player").fastClick(function() {
                        //$("#poster-layover").css("display", "none");
					    $("#player").attr("webkit-playsinline", "webkit-playsinline");
					    player.toggleVideoPlayPause();
                        //Flurry
                        if(player.currentTime() === 0) {
                            if(Analytics) { Analytics.logTrailerPlayed(); }
                        }
                    });


                    if($("#synopsis").height() + movieTitleStyleHeight <= synopsisWrapperStyleHeight){ $("#more").hide(); }
                    $("#more").click(function() {
                        
                        var wrapHeight  = $("#synopsis-wrapper").height();
                            synHeight   = $("#synopsis").height();
                            height      = (wrapHeight == synopsisWrapperStyleHeight) ? synHeight + moreButtonStyleHeight : synopsisWrapperStyleHeight ,
                            more        = ($(this).html() == 'More...') ? "Less..." : "More...";

                        $("#synopsis-wrapper").height(height);
                        //$("#movie-info").height(height + moreButtonStyleHeight + 30);
                        $(this).html(more);

                        setTimeout(function(){          // Wait for transition to be done before refreshing 
                            UI.scroller.refresh();      // refesh scroller to compute height
                        }, 1000);

                    });
                    $("#shopping-cart").fastClick(function(){
                        UI.scroller.scrollTo(0, UI.scroller.maxScrollY, 700);
                    });

                    $("#share-icon").click(function(e){
                        e.preventDefault();
                        e.stopPropagation();

                        var link = Api.appSettings.shareLocation + '/item.php?movieID=' + movie.movieID,
                            title = movie.title +' on Fabric',
                            message = "I just checked out '"+ movie.title + "' @tryfabric";

                        window.plugins.socialsharing.share(message, title, null, link);
                        mixpanel.track("Share selected");
                        if(Analytics) { Analytics.event("Share Selected"); }
                    });

                    // Share functions
                    $("#popup-options div").click(function(){
                        var action = $(this)[0].id,
                            link = "www.trailerpop.com/play_trailer/play/" + movie.moviePublishedID;

                        if(action === "facebook-share") {
                            var options = {
                                method: 'feed',
                                name: movie.title,
                                caption: "Discover more @tryfabric",
                                link: "https://itunes.apple.com/us/app/trailerpop/id587645214",
                                picture: Api.appSettings.cdn + movie.posterPath.replace("/files", ""),
                            }
                            
                            FB.ui(options, function(response) {});
                        } else if(action === "twitter-share"){

                            User.tweet({ 
                                title: movie.title, 
                                publishedid: movie.moviePublishedID, 
                                poster: ""
                            }, 
                            "shareMovie", 
                            function() {});

                        }
                        UI.putAwaySlideUp();
                    });

                    $(".list-button").unbind("click").click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var publishedID = $("#video-src").data("publishedid"),
                            movieID = $("#video-src").data("movieid"),
                            isQueued = $(this).siblings(".queue-button").hasClass("off"),
                            set = $(this).hasClass("off") ? true : false, // set the add or remove from list functionality for the api
                            userSeenListID = APP.gameState.seenListID,
                            userQueueID = APP.gameState.watchListID,
                            listID = $(this).data("listid");            //get list id from button data attr

                        //update list
                        Api.setMovieToFabricList(publishedID, listID, set);

                        $(this).toggleClass("off");

                        //If queue is active and seen is clicked 
                        //remove movie from queue and update DOM
                        if(listID == userSeenListID && set && !isQueued){
                            $(this).siblings(".queue-button").addClass("off");      //only update sibling queue button
                            Api.setMovieToFabricList(publishedID, userQueueID, false);
                        }

                        if(listID == userQueueID && !self.queued && set) {
                            Api.createFeed("queue", movieID);
                            self.queued = true;
                        }
                        if(listID == APP.gameState.favoriteListID && !self.favorited && set) {
                            $(this).siblings(".seen-button").removeClass("off");
                            Api.createFeed("favorite", movieID);
                            self.favorited = true;
                        }

                        return false;
                    });

                	//player.src = self.movie.link;
	                //player.pressPlay(self.movie, false, self);
                    //player.pause(); // we need to pause it so we can check canplaythrough event first
				}
            }
        );

        $(".commerce").click(function(e) {
            e.preventDefault();     e.stopPropagation();

            Util.handleExternalUrl(this);

            return false;
        });

        if($("#video-src").data("publishedid") > 100000000) {
            $("#play").hide();
            $("#fullscreen").hide();
        }
        
        $("#movie-discussion").fastClick(function() {
            Backbone.history.navigate("movieDiscussion/" + self.movieID, true);
            return false;
        });

        setTimeout(function() { UI.initScroller($("#fake-lobby-scroller")[0]) }, 550);
    },
    loadSeenUsers: function(response) {
        var self = this;
        if(response.success){
            $("#seen-data").show();
            this.friendData = response.friendData;
            this.seenData = response.seenData;

            var users = this.friendData.concat(this.seenData)
                userCount = users.length;

            
            if(userCount > 4) { users = users.splice(0, 4); }

            if(userCount > 0){
                var html = APP.load("movieLobbySeen", { users: users, percent: userCount });
                $("#seen-data").html(html);
            }

            $(".avatar").click(function() {
                var userID = $(this).data("userid");
                Backbone.history.navigate("profile/" + userID, true);
                if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "Movie lobby" });
            });

           $("#view-all-seen").fastClick(function(){
                var movieID = $("#video-src").data('publishedid');
                Backbone.history.navigate("userLists/" + movieID, true);
                if(Analytics) Analytics.event("Lobby - view all users");
            });
        }
    }
});

var MovieLobbyView = Backbone.View.extend({
    model: null,
    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() {};

        this.model = new MovieLobbyModel(options);
        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};

        APP.models.movielobby = self.model;

        if(self.model.kce) {
            var html = APP.load("kce");
            self.$el.html(html);

            if (!self.header) {
                self.header = new HeaderView({
                    title: "Celery Man",
                    doneButton: true,
                    leftButton: { class: "back" }
                });
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el.html());

            // call bind events
            // self.model.bindMovieLobbyEvents(movie);

            callback();
        } else {
            self.model.init(function(movie, services) {
                // If there is a theater release date evaluate it against today to determine if its in the future
                // and show the appropriate info
                if(movie.theatreReleaseDate) {
                    var months = ["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"],
                        releaseD = movie.theatreReleaseDate.split("-"),
                        month = parseInt(releaseD[1]) - 1,
                        rD = new Date(releaseD[0], month, releaseD[2]),
                        today = new Date();
                    
                    today.setHours(0,0,0,0); // Remove hours from todays date for later comparison 

                    movie.releaseDate = today <= rD ? months[rD.getMonth()] +" "+ rD.getDate() +", "+ rD.getFullYear() : movie.year;
                }

                var html = APP.load("movieLobby", { movie: movie, services: services, userLists: APP.gameState });
                self.$el.html(html);

                if (!self.header) {
                    self.header = new HeaderView({ title: movie.title, lobbyButtons: true });
                    self.$el.prepend(self.header.el);
                }
                $("#wrapper").html(self.$el.html());

                self.model.bindMovieLobbyEvents(movie);
                callback();
            });
        }
        if(Analytics){ Analytics.event("Movie lobby viewed"); }
    },

    dealloc: function() {
        this.model.player.src = "";
        Player.dealloc();
    }
});