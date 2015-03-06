var WelcomeModel = Backbone.Model.extend({
    categoryData: null,
    movieList: [],
    Swiper: null,
    SwiperContent: null,
    SwiperMask: null,
    TutorialMask: null,
    MatchContent: null,
    MatchMask: null,
    touches: [],
    startx: 0,
    starty: 0,
    tutstartx: 0,
    tutstarty: 0,
    dist: 0,
    swipePosX: 0,
    swipePosY: 0,
    categoryID: null,
    categoryName: null,
    categoryItems: [],
    currentPos: 0,
    listLength: 0,
    listName: "",
    favoriteList: null,
    watchList: null,
    randData: null,
    totalSeen: 0,
    totalMovies: 0,
    ratioSeen: 0,
    favoriteTimer: null,
    interval: 5000,
    lastRotate: 0,
    gtiOS5: false,
    welcomeArr: [],
    welcomePos: 0,
    firstMatch: false,
    categoryID: 382,
    listID: null,
    matches: [],
    currentMatch: 0,
    tutPosters: [
        {
            moviePublishedID: 0,
            movieID: 0,
            poster: "images/discovery/poster-right.png"
        },
        {
            moviePublishedID: 0,
            movieID: 0,
            poster: "images/discovery/poster-left.png"
        },
        {
            moviePublishedID: 0,
            movieID: 0,
            poster: "images/discovery/poster-up.png"
        },
        {
            moviePublishedID: 0,
            movieID: 0,
            poster: "images/discovery/poster-down.png"
        }
    ],

    initialize: function() {
        var self = this;
        self.categoryID = "382";
        self.welcomeArr[0] = "next";
        self.welcomeArr[2] = "seen";
        self.welcomeArr[3] = "not-seen";
        self.welcomeArr[4] = "fav";
        self.welcomeArr[5] = "queue";

        Util.iOSVersion()[0] > 5 ? self.gtiOS5 = true : self.gtiOS5 = false;
    },

    init: function(callback) {
        var self = this;
        callback = callback || function() { };

        self.movieList = [];
        Api.getSwipeCategoryData(self.categoryID, null, function(data) {
            var list = data.movies ? data.movies : data;
            self.categoryData = data.data[0];
            self.totalMovies = data.movies.length;
            for (var i in list) {
                if(list[i].movieID) { self.movieList.push(list[i]); }
            }
            self.movieList = self.movieList; //self.tutPosters.concat(self.movieList);
            callback();
        });
    },

    bindSwipeEvents: function() {
        var self = this;
        this.SwiperContent = document.getElementById("swiper-content");
        this.SwiperMask = document.getElementById("swiper-mask");

        self.loadPoster();

        this.SwiperMask.addEventListener("touchstart", onTouchStart, false);
        this.SwiperMask.addEventListener("touchmove", onTouchMove, false);
        this.SwiperMask.addEventListener("touchend", onTouchEnd, false);

        this.swipePosX = parseInt($(self.SwiperContent).css("left").replace("px",""));
        this.swipePosY = parseInt($(self.SwiperContent).css("top").replace("px",""));

        function onTouchStart(e) {
            var touchobj = e.changedTouches[0]; // reference first touch point (ie: first finger)
            self.startx = parseInt(touchobj.clientX); // get x position of touch point relative to left edge of browser
            self.starty = parseInt(touchobj.clientY); // get y position of touch point . . .
            e.preventDefault();
        }

        function onTouchEnd(e) {
            var movieID = $(self.SwiperContent).attr("data-movieid");
            var moviePublishedID = $(self.SwiperContent).attr("data-publishedid");

            var touchobj = e.changedTouches[0]; // reference first touch point for this event
            var distX = parseInt(touchobj.clientX) - self.startx;
            var distY = parseInt(touchobj.clientY) - self.starty;
            var direction;

            $(self.SwiperContent).css("left", self.swipePosX + "px");
            $(self.SwiperContent).css("top", self.swipePosY + "px");
            $(self.SwiperContent).css("-webkit-transform", "rotate(0deg)");

            $("#seen-highlight").css("opacity", "0");
            $("#not-seen-highlight").css("opacity", "0");
            $("#favorite-highlight, #queue-highlight").css("opacity", "0");

            if(Math.abs(distX) > 90 || Math.abs(distY) > 90) {
                if(distX > 90) {
                    Api.setMovieSeen(moviePublishedID, true);
                    direction = "Right";
                }
                else if(distX < -90) {
                    Api.setMovieSeen(moviePublishedID, false);
                    direction = "Left";
                }
                else if(distY < -90) {
                    Api.setMovieToFabricList(moviePublishedID, self.favoriteList.ID, true);
                    Api.createFeed("favorite", movieID);
                    direction = "Up";
                }
                else if(distY > 90) {
                    Api.setMovieToFabricList(moviePublishedID, self.watchList.ID, true);
                    Api.createFeed("queue", movieID);
                    direction = "Down";
                }
                Api.categoryMovieDiscovered(movieID, self.categoryID, null);
                self.loadNextPoster();
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


        $("#favorite-container").fastClick(function() {
            clearTimeout(self.favoriteTimer);
            clearTimeout(self.queueTimer);
            $("#favorite-container").attr("class", "close");
        });

        $("#welcome-container").fastClick(function() {
            self.clickWelcomeMask();
            if(Analytics) { Analytics.event("Completed intro Swipes"); }
            $("#get-started").addClass("on").fastClick(function() {
                $(this).removeClass("on");
                return false;
            });
        });

        $("#discovery-info").fastClick(function() {
            $("#discovery-background").toggleClass("show");
        });

        $("#discovery-background").fastClick(function(){
            $(this).toggleClass("show");
        });

        $("#swiper-mask").fastClick(function() {
            $("#welcome-poster-tap").show().fastClick(function() {
                $(this).hide();
                return false;
            });
        });
        
        this.bindTutorialSwipeEvents();
        self.updateProgressBar();
    },

    loadPoster: function() {
        var self = this;

        $("#not-seen-highlight").removeClass("fade-in");
        $("#seen-highlight").removeClass("fade-in");

        if(self.currentPos < self.movieList.length) {
            $("#swiper-content").css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos].moviePublishedID + "_poster.jpg)");
            $("#swiper-content").attr("data-movieid", self.movieList[self.currentPos].movieID);
            $("#swiper-content").attr("data-publishedid", self.movieList[self.currentPos].moviePublishedID);
        } else {
            $("#swiper-content").hide();
        }
        if(self.currentPos < self.movieList.length - 1) {
            $("#swiper-content-two").css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 1].moviePublishedID + "_poster.jpg)");
            $("#swiper-content-two").attr("data-movieid", self.movieList[self.currentPos + 1].movieID);
            $("#swiper-content-two").attr("data-publishedid", self.movieList[self.currentPos + 1].moviePublishedID);
        } else {
            $("#swiper-content-two").hide();
        }
        if(self.currentPos < self.movieList.length - 2) {
            $("#swiper-content-three").css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 2].moviePublishedID + "_poster.jpg)");
            $("#swiper-content-three").attr("data-movieid", self.movieList[self.currentPos + 2].movieID);
            $("#swiper-content-three").attr("data-publishedid", self.movieList[self.currentPos + 2].moviePublishedID);
        } else {
            $("#swiper-content-three").hide();
        }
        if(self.currentPos < self.movieList.length - 3) {
            $("#swiper-content-four").css("background-image", "url(" + Api.appSettings.cdn + "/posters/" + self.movieList[self.currentPos + 3].moviePublishedID + "_poster.jpg)");
            $("#swiper-content-four").attr("data-movieid", self.movieList[self.currentPos + 3].movieID);
            $("#swiper-content-four").attr("data-publishedid", self.movieList[self.currentPos + 3].moviePublishedID);
        } else {
            $("#swiper-content-four").hide();
        }
    },

    loadNextPoster: function() {
        var self = this;
        self.currentPos++;
        self.updateProgressBar();

        if(self.currentPos >= self.movieList.length) {
            User.welcomeCompleted();
            if(Analytics) { Analytics.event("Welcome completed"); }
            mixpanel.track("Welcome completed");
            Backbone.history.navigate("rate", true);
        } else {
            self.loadPoster();
        }
    },
    clickWelcomeMask: function() {
        var self = this;
        self.welcomePos++;
        if(self.welcomePos < 1) {
            $("#welcome-content").attr("class", self.welcomeArr[self.welcomePos]);
        } else {
            $("#welcome-container").attr("class", "close");
        }
    },
    idiots: function(){
        var self = this;
        setTimeout(function(){
            var hondaFan = $("#discovery-background");
            if(!hondaFan.hasClass("show") && !hondaFan.hasClass("active")){
                hondaFan.toggleClass("show");
                
                setTimeout(function(){
                    hondaFan.removeClass("show");
                }, 9000);
            }
        }, self.interval);
    },
    bindTutorialSwipeEvents: function() {
        var self = this;
        this.TutorialMask = document.getElementById("welcome-container");
        this.TutorialMask.addEventListener("touchstart", onTouchStart, false);
        this.TutorialMask.addEventListener("touchend", onTouchEnd, false);

        function onTouchStart(e) {
            var touchobj = e.changedTouches[0];          // reference first touch point (ie: first finger)
            self.tutstartx = parseInt(touchobj.clientX); // get x position of touch point relative to left edge of browser
            self.tutstarty = parseInt(touchobj.clientY); // get y position of touch point . . .
            e.preventDefault();
        }

        function onTouchEnd(e) {
            var touchobj = e.changedTouches[0]; // reference first touch point for this event
            var distX = parseInt(touchobj.clientX) - self.tutstartx;
            var distY = parseInt(touchobj.clientY) - self.tutstarty;

            if(Math.abs(distX) > 90 || Math.abs(distY) > 90) {
                if(distX > 90) {
                    if(self.welcomePos == 1) {
                        self.clickWelcomeMask();
                    }
                }
                else if(distX < -90) {
                    if(self.welcomePos == 2) {
                        self.clickWelcomeMask();
                    }
                }
                else if(distY < -90) {
                    if(self.welcomePos == 3) {
                        self.clickWelcomeMask();
                    }
                }
                else if(distY > 90) {
                    if(self.welcomePos == 4) {
                        self.clickWelcomeMask();
                    }
                }
            }
            e.preventDefault();
        }
    },
    updateProgressBar: function() {
        var self = this,
            pBar = $("#progress #inner-bar"),
            rated = (self.totalMovies - self.movieList.length) + self.currentPos,
            total = self.totalMovies,
            completion = Math.round((rated / total) * 100);

        $("#rated").html(rated);
        pBar.animate({ width: completion.toString() + "%" });
    }
});

var WelcomeView = Backbone.View.extend({
    model: null,
    header: null,

    initialize: function(callback) {
        callback = callback || function() { };

        this.model = new WelcomeModel();
        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {
            Backbone.history.navigate("rate", true);
        } else {
            if(Analytics) { Analytics.event("Welcome round start"); }
            this.model.init(function() {
                if(self.model.movieList.length > 0) {
                    var html = APP.load("welcome", { 
                        uName: User.userName, 
                        categoryName: "test",
                        totalMovies: self.model.totalMovies,
                        currentPos: self.model.currentPos
                    });
                    $("#wrapper").html(html);

                    self.header = new HeaderView({ title: "Welcome" });
                    $("#wrapper").prepend(self.header.el);

                    self.model.bindSwipeEvents();
                    self.model.bindDiscoveryEvents();

                    callback();

                } else {
                    Backbone.history.navigate("rate", true);
                }
            });
        }
        return this;
    },

    dealloc: function() {
        APP.welcome = false;
    }
});