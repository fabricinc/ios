var DiscoveryModel = Backbone.Model.extend({
    Swiper: null,
    SwiperContent: null,
    SwiperMask: null,
    MatchContent: null,
    MatchMask: null,
    touches: [],
    startx: 0,
    starty: 0,
    dist: 0,
    swipePosX: 0,
    swipePosY: 0,
    categoryID: null,
    categoryName: null,
    welcomeCompleted: 0,
    categoryItems: [],
    currentPos: 0,
    movieList: null,
    listLength: 0,
    listName: "",
    favoriteList: null,
    watchList: null,
    randData: [],
    totalSeen: 0,
    totalMovies: 0,
    ratioSeen: 0,
    favoriteTimer: null,
    lastRotate: 0,
    categoryData: null,
    gtiOS5: false,
    justFinished: false,
    totalQueued: 0,
    interval: 7000,
    isFollowing: false,
    selectedMovies: [],
    matches: [],
    currentMatch: 0,
    sh: [],
    bh: false,
    kce: false,
    feedType: null,
    ratio: 0,
    sectionID: null,
    isAudioList: false,
    audioList: {},
    listType: null,

    initialize: function(opts) {

        this.categoryID = opts.categoryID || null;
        this.limiter = opts.limiter || null;
        this.listID = opts.listID || null;
        this.onboard = opts.onboard || null;

        console.log( opts );

        this.welcomeCompleted = parseInt(APP.gameState.welcomeCompleted);
    },
    init: function(callback) {
        var self = this;
        callback = callback || function() { };

        self.gtiOS5 = Util.iOSVersion()[0] > 5 ? true : false;



        if(this.onboard) {

            console.log( 'onboard', this.onboard );
            
            Api.getOnboardDiscoveryData(function (response) {
                
                console.log( response );
            
            });
            
        } 

        else {
        
            Api.getSwipeCategoryData(self.categoryID, self.listID, self.limiter, function(data) {
    
                if (data.movies) { var list = data.movies; }
                else { var list = data; }
    
                self.listType = list.length ? list[0].sectionID : null;
                self.isAudioList = (self.listType === "4");
                self.categoryData = data.data[0];
                self.movieList = [];
    
                for (var i = 0; i < list.length; i++) {
    
                    if(self.isAudioList) {
    
                        if(i === 0){
                            self.playTrack = new Audio(list[i].ad_path);
                            self.playTrack.play();
                        }
                        self.audioList[ list[i].movieID ] = new Audio(list[i].ad_path);
    
                    }
    
                    if(list[i].movieID) { self.movieList.push(list[i]); }
                    else { self.randData.push(list[i]); }
    
                }
    
    
    
                callback();
            });
        }
    },
    bindSwipeEvents: function(callback) {
        callback = callback || function() { };
        var self = this;
        this.SwiperContent = document.getElementById("swiper-content");
        this.SwiperMask = document.getElementById("swiper-mask");

        this.SwiperMask.addEventListener("touchstart", onTouchStart, false);
        this.SwiperMask.addEventListener("touchmove", onTouchMove, false);
        this.SwiperMask.addEventListener("touchend", onTouchEnd, false);

        this.swipePosX = parseInt($(self.SwiperContent).css("left").replace("px",""));
        this.swipePosY = parseInt($(self.SwiperContent).css("top").replace("px",""));

        self.loadPoster(callback);

        function onTouchStart(e) {
            var touchobj = e.changedTouches[0]; // reference first touch point (ie: first finger)
            self.startx = parseInt(touchobj.clientX); // get x position of touch point relative to left edge of browser
            self.starty = parseInt(touchobj.clientY); // get y position of touch point . . .
            $("#discovery-background").addClass("active");
            e.preventDefault();
        }

        function onTouchEnd(e) {
			var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");

            var touchobj = e.changedTouches[0]; // reference first touch point for this event
            var distX = parseInt(touchobj.clientX) - self.startx;
            var distY = parseInt(touchobj.clientY) - self.starty;
            // Flurry
            var params = {};

            $(self.SwiperContent).css("left", self.swipePosX + "px");
            $(self.SwiperContent).css("top", self.swipePosY + "px");
            $(self.SwiperContent).css("-webkit-transform", "rotate(0deg)");

            $("#seen-highlight").css("opacity", "0");
            $("#not-seen-highlight").css("opacity", "0");
            $("#favorite-highlight, #queue-highlight").css("opacity", "0");

            if(Math.abs(distX) > 90 || Math.abs(distY) > 90) {
                //update the ratio of seen;
                if(distX > 90) {
                    // Right - Seen
                    params = { direction: "Right" };
                    Api.setMovieSeen(moviePublishedID, true);
                }
                else if(distX < -90) {
                    // Left - Not Seen
                    params = { direction: "Left" };
                    Api.setMovieSeen(moviePublishedID, false);
                }
                else if(distY < -90) {
                    // Up - Favorite
                    params = { direction: "Up" };

                    Api.setMovieToFabricList(moviePublishedID, self.favoriteList.ID, true);
                    Api.createFeed("favorite", movieID);
                }
                else if(distY > 90) {
                    // Down -  Queue
                    params = { direction: "Down" };
                    self.totalQueued++;

                    Api.setMovieToFabricList(moviePublishedID, self.watchList.ID, true);
                    Api.createFeed("queue", movieID);
                }
                Api.categoryMovieDiscovered(movieID, self.categoryID, self.listID);
                $("#match-poster").css("background-image", $("#swiper-content").css("background-image"));
                // Flurry track swipe
                Analytics.eventAndParams("User swiped", params);
                // local swipe history
                self.sh.push(params.direction.charAt(0));
                self.loadNextPoster(self);
            }
            e.preventDefault();
        }

        function onTouchMove(e) {
            var touchobj = e.changedTouches[0]; // reference first touch point for this event
            var distX = parseInt(touchobj.clientX) - self.startx;
            var distY = parseInt(touchobj.clientY) - self.starty;

            $(self.SwiperContent).css("left", (self.swipePosX + distX) + "px");
            $(self.SwiperContent).css("top", (self.swipePosY + distY) + "px");

            if(self.gtiOS5) {
                var currentRotate = Math.floor(distX / 10);
                // we do this check to not redundantly use up js resources applying the same degree onto the element
                if(currentRotate != self.lastRotate) {
                    $(self.SwiperContent).css("-webkit-transform", "rotate(" + currentRotate + "deg)");
                    self.lastRotate = currentRotate;
                }
            }

            // code for opacity change in Seen/Not-Seen
            var opacityX = Math.abs(distX) / 100,
                opacityY = Math.abs(distY) / 100;
            if(opacityX > 1){ opacityX = 1; }
            if(opacityY > 1){ opacityY = 1; }
            if(Math.abs(distX) > Math.abs(distY)) {
                if(distX > 0){
                    $("#seen-highlight").css("opacity", opacityX);
                    $("#not-seen-highlight, #queue-highlight, #favorite-highlight").css("opacity", "0");
                } else {
                    $("#not-seen-highlight").css("opacity", opacityX);
                    $("#seen-highlight, #queue-highlight, #favorite-highlight").css("opacity", "0");
                }
            } else {
                if(distY < 0){
                    $("#favorite-highlight").css("opacity", opacityY);
                    $("#seen-highlight, #not-seen-highlight, #queue-highlight").css("opacity", "0");
                } else if(distY > 0) {
                    $("#queue-highlight").css("opacity", opacityY);
                    $("#seen-highlight, #not-seen-highlight, #favorite-highlight").css("opacity", "0");
                }
            }
            e.preventDefault();
        }
    },
    loadPoster: function(callback) {
        callback = callback || function() {};
        var self = this;

        //if they are swiping but not queueing, guide them on how to queue movies
        if(self.currentPos === 30 && self.totalQueued === 0) {
            $("#queue-guide").addClass("show").on("transitionend", function() {
                $("#arrow-down").css({"margin-top": "150px"});
            });
            $("#arrow-down").on("transitionend", function() {
                $("#queue-guide").removeClass("show");
            });
        }


        $("#not-seen-highlight").removeClass("fade-in");
        $("#seen-highlight").removeClass("fade-in");

        if(self.currentPos < self.movieList.length) {


            $("#swiper-content")
                .css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos].moviePublishedID + "_poster.jpg)")
                .attr({
                    "data-movieid": self.movieList[self.currentPos].movieID,
                    "data-publishedid": self.movieList[self.currentPos].moviePublishedID,
                    "data-seen": self.movieList[self.currentPos].movieSeen
                });

        } else {
            swiperContent.hide();
        }
        if(self.currentPos < self.movieList.length - 1) {

            $("#swiper-content-two")
                .css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 1].moviePublishedID + "_poster.jpg)")
			    .attr("data-movieid", self.movieList[self.currentPos + 1].movieID)
                .attr("data-publishedid", self.movieList[self.currentPos + 1].moviePublishedID);

        } else {
            $("#swiper-content-two").hide();
        }
        if(self.currentPos < self.movieList.length - 2) {

            $("#swiper-content-three")
                .css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 2].moviePublishedID + "_poster.jpg)")
		        .attr("data-movieid", self.movieList[self.currentPos + 2].movieID)
                .attr("data-publishedid", self.movieList[self.currentPos + 2].moviePublishedID);

        } else {
            $("#swiper-content-three").hide();
        }
		if(self.currentPos < self.movieList.length - 3) {

            $("#swiper-content-four")
                .css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 3].moviePublishedID + "_poster.jpg)")
			    .attr("data-movieid", self.movieList[self.currentPos + 3].movieID)
                .attr("data-publishedid", self.movieList[self.currentPos + 3].moviePublishedID);

        } else {
            $("#swiper-content-four").hide();
        }

        // switch the bottoms
        $("#friends-favorited").html("<span></span> " + self.movieList[self.currentPos].friendsFavorited + " Tastemates");
        $("#friends-queued").html("<span></span> " + self.movieList[self.currentPos].friendsQueued);
        $("#swipe-title").html(self.movieList[self.currentPos].movieTitle);


        if(self.movieList[self.currentPos].criticsScore && self.movieList[self.currentPos].criticsScore !== "") {
            $("#critic-rating").html("<span class='fresh'></span> " + self.movieList[self.currentPos].criticsScore + "%").show();
            if(parseInt(self.movieList[self.currentPos].criticsScore) < 50) {
                $("#critic-rating span").removeClass("fresh").addClass("rotten");
            } else {
                $("#critic-rating span").removeClass("rotten").addClass("fresh");
            }
        } else {
            $("#critic-rating").html("").hide();
        }

        if(parseInt(self.movieList[self.currentPos].friendsFavorited) <= 0) {
            $("#friends-favorited").hide()
        } else {
            $("#friends-favorited").show();
        }

        if(parseInt(self.movieList[self.currentPos].friendsQueued) <= 0) {
            $("#friends-queued").hide();
        } else {
            $("#friends-queued").show();
        }
        callback();
    },
    checkSH: function() {
        var self = this;
        if(this.sh.join("").indexOf("UUDDLRLR") != -1) {
            self.kce = true;
            $("#wrapper").append(APP.load("kceDrop"));
            $("#B").fastClick(function() {
                if(self.kce) { self.bh=true; }
                else {
                    self.kce = false;
                    self.bh = false;
                    $(this).parent().remove();
                }
                return false;
            });
            $("#A").fastClick(function() {
                if(self.kce && self.bh) {
                    Backbone.history.navigate("kce", true);
                } else {
                    self.kce = false;
                    self.bh = false;
                    $(this).parent().remove();
                }
                return false;
            });
            $("#kce-drop").click(function() { $("#kce-drop").remove(); });
        }
    },
    loadNextPoster: function(ref) {
        var self = ref;


        // HANDLE AUDIO PLAYBACK
        if(self.isAudioList){
            $("#play-control").addClass('pause');
            // self.audioList[self.movieList[self.currentPos].movieID].pause();
            self.playTrack.pause();

        }

        self.currentPos++;
        self.playTrack = self.currentPos < self.movieList.length ? self.audioList[self.movieList[self.currentPos].movieID] : null;
        self.checkSH();
        self.updateProgressBar();

        if(self.currentPos == self.movieList.length) {
            $("#swiper-content").hide();

            if(self.categoryID && self.categoryID !== "") {
                self.feedType = "ratecompletecategory";
            } else if(self.listID && self.listID !== "") {
                self.feedType = "ratecompletelist";
            } else {
                return false;
            }

            Api.categoryDiscovered(self.categoryID);

            if(APP.gameState.welcomeCompleted === "0"){

                // IF part of the welcome round take them to rate (Home) screen after swiping
                // And mark them as welcome completed

                User.welcomeCompleted();
                if(Analytics) { Analytics.event("Welcome completed"); }
                mixpanel.track("Welcome completed");
                Backbone.history.navigate("rate", true);

            } else {

                // Load the list summary at the end of swiping the pack if they have completed welcome competed

                self.loadCategoryListSummary(function(movies, friends, suggestions) {
                    // set the finished flag as true so the done button goes to suggestions
                    self.justFinished = true;
                    var sortedMovies = self.sortMovies(movies);
                    var html = APP.load("listSummary", {
                        ratio: self.ratioSeen,
                        categoryName: self.categoryName,
                        categoryTile: self.categoryData.tile_image,
                        totalSeen: self.totalSeen,
                        totalMovies: self.totalMovies,
                        movies: sortedMovies,
                        lists: APP.gameState,
                        friends: friends,
                        suggestions: suggestions,
                        section: movies[0].sectionID
                    });


                    if(!self.ratioSeen) { self.ratioSeen = 0; }
                    Api.createFeed(self.feedType, self.categoryID, { ratio: self.ratioSeen });
                    var header = new HeaderView({ title: "Nice Job!", leftButton: {class: ""}, doneInter: true });  // Set to done inter

                    $("#wrapper").html(html);
                    $("#wrapper").prepend(header.el);

                    setTimeout(function() {
                        if(UI.scroller) { UI.scroller.refresh(); }
                    }, 200);

                    $("#ratio span").html("0"); //set percentage at zero to roll it up later


                    //analytics
                    var params = {
                        name: self.categoryName,
                        listID: self.categoryID,
                        sectionID: movies[0].sectionID
                    };
                    var gS = APP.gameState;

                    Analytics.eventAndParams("Finished category", params);

                    mixpanel.track("Category Completed", {
                        "Category name": self.categoryName,
                        "Facebook-account": gS.isFacebook,
                        "sectionID": movies[0].sectionID,
                        "List ID": self.categoryName,
                        "Seen %": self.ratioSeen,
                        "City": gS.city,
                        "Age": gS.age
                    });

                    Util.trailerPlayer();
                    APP.router.bindHeaderEvents();
                    self.bindListRecommended();

                    Api.getNextCategories(self.categoryID, function(response) {

                        if(response.success && response.data) {
                            var nextCats = APP.load("categoryFeed", { items: response.data }),
                                upNext = APP.load("upNext"),
                                upNextCats = $(upNext).find("#up-next-wrapper").append(nextCats);

                            $("#list-items-container").append(upNext);
                            $("#up-next-wrapper").append(nextCats);
                            self.bindCategoryEvents();
                            // callback();
                        } else { // if there are no more next recommendations
                            $("#done-inter-button").attr({ id : "done-button" });
                            $("#done-button").fastClick(function(){
                                Backbone.history.navigate("rate", true);
                            });
                        }

                        $("#ratio span").text(self.ratioSeen);

                        UI.initScroller($("#list-items-container")[0]);
                        self.bindDiscoveryCompleteEvents();
                    });
                });
            }

        } else {
            // HANDLE AUDIO PLAYBACK

            if(self.isAudioList){

                // self.audioList[self.movieList[self.currentPos].movieID].play();
                self.playTrack.play();

            }
            self.loadPoster();
        }
    },
    loadCategoryListSummary: function(callback) {
        var self = this;

        Api.getFabricCategoryData(self.categoryID, self.limiter, function(response) {
            if(response.data) {
                if(response.data.movies.list.length) {
                    if (response.data.movies.list) { var list = response.data.movies.list; }
                    else { var list = response.data.movies; }
                    if(!self.categoryName) { self.categoryName = response.data.movies.title; }
                    self.totalSeen = 0;
                    var newArr = [];
                    $.each(list, function(index, value) {
                        if(value.movieID) {
                            if(value.movieSeen == "1") { self.totalSeen++; }
                            newArr.push(value);
                        }
                    });
                    self.totalMovies = newArr.length;
                    self.ratioSeen = Math.ceil((self.totalSeen / self.totalMovies) * 100);
                    self.sectionID = newArr[0].sectionID;

                    callback(newArr, response.data.friends, response.data.suggestedFriends);
                } else {
                    // no movies

                    //If there welcome completed is true take the to the rate/home page else welcome packs
                    var route = this.welcomeCompleted ? "rate" : "welcome";

                    Util.alert("Great Scott! There seems to be a problem. Please select another pack");


                    Backbone.history.navigate(route, true);

                }
            }
        });
    },
    bindDiscoveryEvents: function() {
        var self = this,
            options = {
                "action": "getListsMenu",
                "moviePublishedID": $(self.SwiperContent).attr("data-publishedid"),
                "includeSeen": false
            };

        Api.dispatcher(options, function(lists) {
            self.favoriteList = lists[0];
            self.watchList = lists[1];
        });

        // HANDLE AUDIO PLAYBACK
        // INITIAL PLAY
        if (self.isAudioList) {
            // self.audioList[self.movieList[self.currentPos].movieID].play();
        }


        $("#tap-play-control").fastClick(function(e) {
            var track = self.playTrack;

            $("#play-control").toggleClass('pause');

            track.paused ? track.play() : track.pause();
        });

        $("#seen").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");

            $("#seen-highlight").addClass("fade-in");
            Api.setMovieSeen(moviePublishedID, true);

            var interval;
            setTimeout(function() {
                $("#seen-highlight").css("opacity", "1");
                interval = setInterval(function() {
                    $(self.SwiperContent).css( "left", "+=100" );
                }, 10);
            }, 50);

            setTimeout(function() {
                clearInterval(interval);
                $(self.SwiperContent).css( "left", self.swipePosX + "px" );
                $("#seen-highlight").css("opacity", "0");
                Api.categoryMovieDiscovered(movieID, self.categoryID, self.listID, function() { });
                self.loadNextPoster(self);
            }, 500);
        });

        $("#not-seen").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");

            $("#not-seen-highlight").addClass("fade-in");
            Api.setMovieSeen(moviePublishedID, false);

            var interval;
            setTimeout(function() {
                $("#not-seen-highlight").css("opacity", "1");
                interval = setInterval(function() {
                    $(self.SwiperContent).css( "left", "-=100" );
                }, 10);
            }, 50);

            setTimeout(function() {
                clearInterval(interval);
                $(self.SwiperContent).css( "left", self.swipePosX + "px" );
                $("#not-seen-highlight").css("opacity", "0");
                Api.categoryMovieDiscovered(movieID, self.categoryID, self.listID, function() { });
                self.loadNextPoster(self);
            }, 500);
        });

        $("#info").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            //var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");
            Backbone.history.navigate("movieLobby/" + movieID, true);
        });


        $("#swiper-mask, #lobby-info").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");

            if(self.welcomeCompleted){
                Backbone.history.navigate("movieLobby/" + movieID, true);
            } else {
                // Show coach to finsh swiping
                var coach = APP.load("coach", { section : 'finishSwipe' });
                $('#coach-overlay').html(coach);
                UI.bindCoachEvents();
            }
        });


        $("#discovery-background").fastClick(function(){
            $(this).removeClass("show");
        });

        $("#discovery-info").fastClick(function(){
            $("#discovery-background").toggleClass("show");
            if(Analytics)  Analytics.event("Rate ? button tapped");
        });

        $("#queue").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");
            var options = {
                "action": "setMovieToList",
                "listID": self.watchList.ID,
                "moviePublishedID": moviePublishedID
            }

            var interval;
            setTimeout(function() {
                $("#queue-highlight").css("opacity", "1");
                interval = setInterval(function() {
                    $(self.SwiperContent).css( "top", "+=100" );
                }, 10);
            }, 50);

            setTimeout(function() {
                clearInterval(interval);
                $(self.SwiperContent).css( "top", self.swipePosY + "px" );
                $("#queue-highlight").css("opacity", "0");
                Api.dispatcher(options, function(success) { });
                Api.categoryMovieDiscovered(movieID, self.categoryID, self.listID, function() { });
                self.loadNextPoster(self);
            }, 500);
        });

        $("#favorite").fastClick(function() {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");
            var options = {
                "action": "setMovieToList",
                "listID": self.favoriteList.ID,
                "moviePublishedID": moviePublishedID
            }

            var interval;
            setTimeout(function() {
                $("#favorite-highlight").css("opacity", "1");
                interval = setInterval(function() {
                    $(self.SwiperContent).css( "top", "-=100" );
                }, 10);
            }, 50);

            setTimeout(function() {
                clearInterval(interval);
                $(self.SwiperContent).css( "top", self.swipePosY + "px" );
                $("#favorite-highlight").css("opacity", "0");
                Api.dispatcher(options, function(success) { });
                Api.categoryMovieDiscovered(movieID, self.categoryID, self.listID, function() { });
                self.loadNextPoster(self);
            }, 500);
        });

        $("#queue-guide").fastClick(function(){
            $("#queue-guide").removeClass("show");
        });

        $("#favorite-container").fastClick(function() {
            clearTimeout(self.favoriteTimer);
            clearTimeout(self.queueTimer);
            $("#favorite-container").attr("class", "close");
        });

        $("#whos-going").fastClick(function(){
            var publishedID = $("#swiper-content").data("publishedid");

            Backbone.history.navigate("whosGoing/"+ publishedID, true);
        });

        this.updateProgressBar();
    },
    bindDiscoveryCompleteEvents: function() {
        var self = this,
            options = {
                "action": "getListsMenu",
                "includeSeen": false
            };

        Api.dispatcher(options, function(lists) {
            self.favoriteList = lists[0];
            self.watchList = lists[1];
        });

        $(".buttons div").click(function() {
            var item = $(this),
                movieID = item.data("publishedid"),
                listID = item.data("listid"),
                set = item.hasClass("off") ? true : false;

            Api.setMovieToFabricList(movieID, listID, set);
            item.toggleClass("off");

            if(item.hasClass("seen-icon")) {
                if(set) { self.totalSeen++; }
                else { self.totalSeen--; }
                // update the seen list info
                //$("#total-seen").html(self.totalSeen);
                $("#info h2 span").html(Math.ceil((self.totalSeen / self.totalMovies) * 100) + "%");
            }

            if(item.hasClass("watch-icon")) {
                if(set) {
                    item.html("Added");
                } else {
                    item.html("Add To List");
                }
            }

            if(listID == APP.gameState.favoriteListID && !item.hasClass("off")) {
                $(this).next().removeClass("off");
            }
        });

        $(".category").click(function() {
            var categoryID = $(this).data("catid") || null;
            var listID = $(this).data("listid") || null;
            Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=" + listID, true);
        });

        $(".share-buttons .btn").fastClick(function() {
            if(!APP.click) {
                APP.click = true;
                // UI.showShareOptions("list-scroller");
                var verb = "seen";
                switch(parseInt(self.sectionID)) {
                    case 3:
                        verb = "visited"; break;
                    case 4:
                        verb = "heard"; break;
                    case 5:
                        verb = "heard"; break;
                }

                var image = $("#image").css("background-image").replace('url(','').replace(')',''),
                    link = "https://itunes.apple.com/us/app/trailerpop/id587645214",
                    shareSelected = $(this).data('service'),
                    category = $("#info h1").text(),
                    fabric = shareSelected == "Twitter" ? "@tryfabric's" : "Fabric's",
                    percentage = $("#info h2 span").text(),
                    message =  "I've " + verb + " " + percentage + " of "+ fabric +" '" + category + "' list.";

                var objID = self.categoryID ? self.categoryID : self.listID;
                var catApp = self.categoryID ? "&category=true" : "";


                window.plugins.socialsharing.shareVia(shareSelected, message, category, image, (Api.appSettings.shareLocation + "/list.php?listID=" + objID + catApp), function(r) {
                    Util.log("success");
                    Util.log(r);
                }, function(e) {
                    Util.log("fail");
                    Util.log(e);
                });

                mixpanel.track("Share selected");
                if(Analytics) { Analytics.eventAndParams("Share Selected ", { type: shareSelected }); }

                setTimeout(function() { APP.click = false; }, 2000);
            }
        });

        $("#done-button").unbind("click").click(function() {
            //UI.putAwaySlideUp();
        });

        $("#category-header div").fastClick(function() {
            if($(this).hasClass("active")) { return false; }
            $(this).addClass("active");
            if($(this).attr("id") == "friends") {
                $("#list-items").hide();
                $("#category-header #items").removeClass("active");
            } else {
                $("#list-friends").hide();
                $("#category-header #friends").removeClass("active");
            }
            $("#list-" + $(this).attr("id")).show();
            setTimeout(function() { UI.scroller.refresh() }, 200);
        });

        $(".follow").click(function() {
            var ele = $(this);
            var userID = ele.parent().data("userid") || null;
            if(ele.hasClass("following")) {
                var message = "Are you sure you want to unfollow this user?";
                navigator.notification.confirm(message, function(button) {
                    if(button === 2) {
                        Api.unFollowUser(userID, function(response) {
                            if(response.success) {
                                ele.html("Follow");
                                ele.toggleClass("following");
                            }
                        });
                    }
                }, null, ["Cancel", "Unfollow"]);
            } else {
                if(userID) {
                    Api.followUser(userID, function(response) {
                        if(response.success) {
                            ele.html("Following");
                            ele.toggleClass("following");
                        }
                    });
                }
            }
            return false;
        });

        $(".avatar").click(function() {
            var ele = $(this);
            var userID = ele.parent().data("userid") || null;
            if(userID) {
                Backbone.history.navigate("profile/" + userID, true);
            }
            return false;
        });
        $(".play-button").click(function(){
            var videoPlayer = "<video id='trailer-player'></video>",
                src = $(this).parent().data("trailer"),
                params = {
                    // movieID: feedData[z].movieID,
                    // title: feedData[z].title,
                    // filter: $("#rec-filter").html()
                };

            if (!$("video").length){
                $("#list-items-container").append(videoPlayer);
                Util.trailerPlayer();
            };

            $("video").css("display", "block").attr("src", src);
            $("video")[0].load();

            setTimeout(function(){
                $("video").css({"top": "0"});
                setTimeout(function(){
                    $("video")[0].play();
                },800);
            },50);

        });
        $(".trailer-still, .movie-poster").click(function() {
            if(!$(this).parent().hasClass("play-button")) {
                var ID = $(this).closest(".feed-item").data("movie-id");
                Backbone.history.navigate("movieLobby/"+ ID, true);
            }
        });
        $(".poster-img").click(function() {
            var ID = $(this).data("movieid");
            Backbone.history.navigate("movieLobby/"+ ID, true);
        });
        /*$(".movie-poster").click(function(){
            var ID = $(this).closest(".feed-item").data("movie-id");

            Backbone.history.navigate("movieLobby/"+ ID, true);
        });*/
        $(".feed-buttons span").click(function(){
            var publishedID = $(this).parent().data("movie-published-id"),
                movieID = $(this).parent().data("movie-id");

            if($(this).hasClass("info-button")){
                Backbone.history.navigate("movieLobby/" + movieID, true);
            } else {
                var set = $(this).hasClass("on") ? false : true;
                Api.setMovieToFabricList(publishedID, self.watchList.ID, set);
                $(this).toggleClass("on");
            }
        });

        $(".rec span").click(function(){
            var publishedID = $(this).data("movie-published-id");
            Backbone.history.navigate("recommendedByList/"+ publishedID, true);
        });

        $(".saved-button").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            var item = $(this).parent(),
                movieID = item.data("movie-id"),
                publishedID = item.data("movie-published-id"),
                set = $(this).hasClass("on") ? true : false;

            Api.setMovieToFabricList(publishedID, APP.gameState.watchListID, set);

            if(!set) {
                $(this).html("+ Add To List").removeClass("on");
            } else {
                $(this).html("Added").addClass("on");
            }

            return false;
        });
    },
    bindListRecommended: function() {
    },
    bindCategoryEvents: function() {
        $("#up-next-wrapper div.catItem").click(function() {
            var categoryID = this.getAttribute("data-catid") || null;
            var listID = this.getAttribute("data-listid") || null;

            if(listID || categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=" + listID, true);
            }
        });
    },
    sortMovies: function(movies) {
        // putting this stop in
        return movies;

        // this is shit but we need to separate the movies into unseen, queued, favorites , seen
        var favorite = [];
        var queued = [];
        var unseen = [];
        var seen = [];

        $.each(movies, function(idx, m){
            if(m.movieSeen === "0" && m.movieWatchlist === "0" && m.movieFavorite === "0"){
                unseen.push(m);
            } else if (m.movieWatchlist === "1") {
                queued.push(m);
            /*} else if () {
                favorite.push(m);*/
            } else if (m.movieSeen === "1" || m.movieFavorite === "1") {
                seen.push(m);
            }
        });

        // Package them into an object to put into the template
        var sortedMovies = {
            "favorite" : favorite,
            "unseen" : unseen,
            "queued" : queued,
            "seen" : seen
        };

        return sortedMovies;
    },
    bindMatchEvents: function(match) {
        var self = this;
        $("#match-exit").fastClick(function() {
            self.loadCategoryListSummary(function(movies, friends, suggestions) {
                var html = APP.load("listSummary", {
                    ratio: self.ratioSeen,
                    categoryName: self.categoryName,
                    categoryTile: self.categoryData.tile_image,
                    totalSeen: self.totalSeen,
                    totalMovies: self.totalMovies,
                    movies: movies,
                    lists: APP.gameState,
                    friends: friends,
                    suggestions: suggestions,
                    section: movies[0].sectionID
                });

                Api.createFeed(self.feedType, self.categoryID, { ratio: self.ratioSeen });
                var header = new HeaderView({ title: "Nice Job!", leftButton: {class: ""}, doneButton: true });

                $("#wrapper").html(html);
                $("#wrapper").prepend(header.el);
                $("#ratio span").html("0"); //set percentage at zero to roll it up later
                // $("#header-edit-button").html("Done").css({"margin-right": "5px"});
                $(".left.button.back").hide();

                UI.unmask();

                APP.router.bindHeaderEvents();
                self.bindListRecommended();

                //analytics
                var params = {
                    sectionID: movies[0].sectionID,
                    name: self.categoryName,
                    listID: self.categoryID
                };

                Analytics.eventAndParams("Finished category", params);

                //Roll up the percentage seen
                if(document.height > 480){
                    var totalSeen = self.ratioSeen,
                        rolledBack = 0,
                        x = totalSeen % 2 === 0 ? 2 : 3,
                        timer = setInterval(function() {
                            rolledBack >= totalSeen && clearInterval(timer);
                            $("#ratio span").text(rolledBack);
                            rolledBack += x;
                        }, 1);
                } else {
                    $("#ratio span").text(self.ratioSeen);
                }

                UI.initScroller($("#list-items-container")[0]);
                self.bindDiscoveryCompleteEvents();
            });
        });

        $("#match-see").fastClick(function() {
            UI.mask();
            Backbone.history.navigate("profile/" + match.userID, true);
            if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "Match screen" });
        });
    },
    updateProgressBar: function() {
        var self = this,
            pBar = $("#progress #inner-bar"),
            total = self.totalMovies,
            rated = total - (total - self.movieList.length) - self.currentPos,
            completion = Math.round((rated / total) * 100);

        $("#rated").html(rated);
        pBar.animate({ width: completion.toString() + "%" });
    }
});




var DiscoveryView = Backbone.View.extend({
    model: null,

    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() { };

        this.model = new DiscoveryModel(options);
        return this;
    },
    render: function(callback) {
        var self = this,
            sMod = self.model;
        callback = callback || function() {};

        APP.models.discovery = self.model;

        self.model.init(function() {

            // !!!!!!!!!!!! Load Swipe !!!!!!!!!!!!!

            if(self.model.movieList.length > 0) {
                self.model.loadCategoryListSummary(function(movies, friends, suggestions) {

                    //
                    var onboardDone = sMod.welcomeCompleted ? true : false;
                    var html = APP.load("discovery", {
                        totalSeen: sMod.totalSeen,
                        totalMovies: sMod.totalMovies,
                        ratioSeen: sMod.ratioSeen,
                        currentPos: sMod.totalMovies - sMod.movieList.length,
                        categoryName: sMod.categoryData.title,
                        friends: friends,
                        suggestions: suggestions,
                        section: movies[0].sectionID
                    });

                    self.header = new HeaderView({
                        title: self.model.categoryData.title,
                        leftButton: { class: "" },
                        welcome: !onboardDone,
                        doneButton: onboardDone
                    });

                    self.$el
                        .html(html)
                        .prepend(self.header.el);

                    $("#wrapper").html(self.$el.html());


                    if(self.model.movieList[0].sectionID === "4"){
                        $('#wrapper').addClass("music-section");
                    }

                    self.model.bindSwipeEvents(function(html) {
                        self.model.bindDiscoveryEvents();
                        setTimeout(function() { callback(); }, 500);
                    });

                    if(Analytics) {
                        Analytics.eventAndParams("Category selected", {
                            category: self.model.categoryName,
                            categoryID: self.model.categoryID,
                            sectionID: movies[0].sectionID
                        });
                    }
                });

                setTimeout(function() {
                    var hondaFan = $("#discovery-background");
                    if(!hondaFan.hasClass("show") && !hondaFan.hasClass("active")) {
                        hondaFan.toggleClass("show");
                        setTimeout(function() {
                            hondaFan.removeClass("show");
                        }, 9000);
                    }
                }, self.model.interval);
            } else {
                // !!!!!!!!!!!! Load List Summary !!!!!!!!!!!!!

                Api.categoryDiscovered(self.model.categoryID);

                self.model.loadCategoryListSummary(function(movies, friends, suggestions) {
                    var sMod = self.model,
                        sortedMovies = sMod.sortMovies(movies);
                        html = APP.load("listSummary", {
                            totalSeen: sMod.totalSeen,
                            totalMovies: sMod.totalMovies,
                            movies: sortedMovies,
                            ratio: sMod.ratioSeen,
                            categoryName: sMod.categoryName,
                            categoryTile: sMod.categoryData.tile_image,
                            lists: APP.gameState,
                            friends: friends,
                            suggestions: suggestions,
                            section: movies[0].sectionID
                        });

                    self.$el.html(html);
                    self.header = new HeaderView({
                        title: "Nice Job!",
                        leftButton: { class: "" },
                        doneButton: true
                    });
                    self.$el.prepend(self.header.el);

                    $("#wrapper").html(self.$el.html()).addClass("complete");
                    // $("#header-edit-button").html("Done");

                    self.model.bindDiscoveryCompleteEvents();
                    Util.trailerPlayer();


                    callback();

                    UI.initScroller($("#list-items-container")[0]);
                    setTimeout(function() { UI.scroller.refresh(); }, 1000);

                    callback();
                });
            }
        });
    },
    dealloc: function() {

        // HANDLE AUDIO PLAYBACK
        if (this.model.isAudioList && this.model.playTrack) {

            // this.model.audioList[this.model.movieList[this.model.currentPos].movieID].pause();
            this.model.playTrack.pause();

        }

    }
});
