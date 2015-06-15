var RateModel = Backbone.Model.extend({
    categories: null,  // categories obj
    lastFeed: null,
    lastRecs: null,
    data: null,  
    feed: null,  // feed obj
    recs: null,  // recommendations obj
    limit: 10,   // global limit, effects all tabs
    start: 0,    // start categories
    startF: 0,   // start feed
    startR: 0,   // start recommendations
    pclf: false, // progressive category loader finished
    pflf: false, // progressive feed loader finished
    prlf: false, // progressive recommendations loader finished
    feedLoaded: false,
    recsLoaded: false,
    concierge: null,
    removedList: [],
    defaults: {
        Q: null,
        people: null
    },

    initialize: function(options) {
        var self = this;
        if(typeof APP.feedFilter === "undefined") {
            APP.feedFilter = "category-filter"; // filters: category-filter, activity-filter, recommended-filter
        }

        self.filter = APP.feedFilter;


    },
    fetchData: function(callback) {
        var self = this;
        callback = callback || function() {};

        Api.appSettings.discoveryLimit = parseInt(Api.appSettings.discoveryLimit);
        Api.appSettings.feedLimit = parseInt(Api.appSettings.feedLimit);


        Api.getHomeCategories(1, 100, self.start, Api.appSettings.discoveryLimit, APP.sectionID, function(response) {
            


            self.start = Api.appSettings.discoveryLimit;  // suppose to be 0, but javascript can't seem to add 0 + 50 together, so...
            self.categories = response.data.categories;
            if(self.categories.length < Api.appSettings.discoveryLimit) { self.pclf = true; }



            Api.getHomeFeed(self.startF, Api.appSettings.feedLimit, APP.sectionID, function (response) {


                self.startF = Api.appSettings.feedLimit; // suppose to be 0, but javascript can't seem to add 0 + 50 together, so...
                self.feed = { feed: response.data.activityFeed.data };
                self.feedLoaded = true;
                if(self.feed.feed.length < Api.appSettings.feedLimit) { self.pflf = true; }


                // Api.getRecommendedPeople(function(response) {

                //     this.set("people", response.data);

                // }.bind(self));

                Api.getQ(APP.gameState.watchListID, APP.sectionID, function (response) {

                    this.set("Q", response);

                }.bind(self));


                // Only run this callback (wait for activity feed data) if we are on the activity feed
                if(self.filter == "activity-filter" || self.filter == "want-to-filter") { callback(response.data.categories); }


            });


            // This is only run if the category feed is selected
            if(self.filter == "category-filter") { callback(response.data.categories); }


        });

    }
});

var RateView = Backbone.View.extend({
    id: "dashboard",
    filter: null,
    model: null,
    feedPos: 0,
    shareInfo: null,
    catFilter: "all",
    interval: "null",
    working: false,
    feedInterval: null,
    recsInterval: null,
    catPos: 0,
    actPos: 0,
    recPos: 0,
    wantToList: null,

    events: {

    },

    initialize: function(callback) {
        var self = this, options = {};
        callback = callback || function() {};

        this.model = new RateModel();

        if(typeof APP.feedFilter === "undefined") {
            APP.feedFilter = "category-filter"; // filters: category-filter, activity-filter, recommended-filter
        }  

        self.filter = APP.feedFilter;

        this.listenTo(this.model, 'change:people', this.people);
        this.listenTo(this.model, 'change:Q', this.wantTo);

        callback();
        return this;
    },

    people: function() {
        var people = this.model.get("people");
    
        // Only show recommended people on activity filter
        if(this.filter !== "activity-filter") { return; }


        var recommendedPeople = new RecommendedPeopleView( people );

    },
    wantTo: function () {
        this.wantToList = new WantToListView(this.model.get("Q"));
        
        if (this.filter !== "want-to-filter") { return; }

        this.wantToList.render();
    },
    render: function(callback, update) {
        var self = this;
        callback = callback || function() {};



        APP.refreshSettings(function() {
            User.fetchMinData(function(success) {
                if(success) {
                    // IF DEEP ROUTE IS SET send them
                    if(APP.url.set) {
                        APP.url.set = false;
                        Backbone.history.navigate(APP.url.route, true);
                        return false;
                    }
                    

                    mixpanel.register({ "Section": APP.sectionID });


                    self.model.fetchData(function(categories) {
                        APP.models.rate = self.model;
                        self.categories = categories;

                        var html = APP.load("rate"),
                            feedPos = APP.feedPos < 0 && APP.feedPos ? APP.feedPos : 0;

                        self.$el.html(html);

                        if (!self.header) {
                            self.header = new HeaderView({
                                title: "Fabric",
                                home: true
                            });
                            self.$el.prepend(self.header.el);
                        }


                        $("#wrapper").html(self.$el);

                        // Highlight corect filter
                        $("#"+ self.filter).addClass("filter");


                        var cb = function() {
                            UI.initScrollerOpts($("#category-container")[0], { // #home-slider
                                vScrollbar: false,
                                hScroll: false,
                                bounce: true,
                                click: true,
                                startY: feedPos
                            });

                            setTimeout(function() { UI.scroller.refresh(); }, 1000);

                            APP.feedPos = 0;

                            self.bindTileEvents();
                            self.moreFeedPlease();

                            callback();
                        };

                        self.displayFeed(self.filter, cb); //Which feed filter to display
                    });
                } else {
                    Util.log("user is NOT active right now, handle this");
                    UI.unmask();
                    Backbone.history.navigate("");
                }
            });
        });

        return this;
    },
    displayFeed: function(filter, cb) {
        cb = cb || function() {};
        if(!filter){ return; }      //If filter is not set exit
        var self = this;

        // add current filter class to the scroller/slider container
        $("#home-slider").attr("class", filter);


        if(filter === "activity-filter") {
            // show activity filter
            

            if(!self.model.feedLoaded || self.model.feed == null) {
                self.feedInterval = setInterval(function() {
                    if(self.model.feedLoaded && self.model.feed) {
                        var activityFeed = APP.load("activityFeed", { feed: self.model.feed.feed });
                        

                        $("#content-container .content-scroller").append(activityFeed);

                        // bind activity feed events
                        self.bindActivityFeedEvents();
                        $("#category-container").css("background-color", "rgb(228, 226, 225)");
                        if(Analytics) { Analytics.event("Feed selected"); }
                        clearInterval(self.feedInterval);
                        cb();
                    }
                }, 100);
            } else {
                // var lastStatus = APP.load("lastStatus", { lastStatus: self.lastStatus });
                var activityFeed = APP.load("activityFeed", { feed: self.model.feed.feed });
                
                $("#content-container .content-scroller").html(activityFeed);


                // bind activity feed events
                self.bindActivityFeedEvents();
                $("#category-container").css("background-color", "rgb(228, 226, 225)");

                if(Analytics) { Analytics.event("Feed selected"); }
                cb();
            }
        } else if(filter == "category-filter") {

            // show category filter
            var categoryFeed = APP.load("categoryFeed", { items: self.model.categories });
            $("#content-container .content-scroller").html(categoryFeed);


            // bind category feed events
            self.bindCategoryEvents();
            cb();
            
        } else if(filter == "want-to-filter") {

            
            if(self.wantToList) { 

                self.wantToList.render(); 
            
            } else {
                
                $("#content-container .content-scroller").empty().addClass('loading');

            }
            


            cb();
        }
    },
    moreFeedPlease: function() {
        var self = this;
        setTimeout(function() {

            UI.scroller.on("scrollEnd", function() {
                if(Math.abs(this.maxScrollY) - Math.abs(this.y) < 800){


                    if(APP.feedFilter === "activity-filter") {

                        if(!APP.working && !self.model.pflf) {
                            APP.working = true;
                            $(".load-more-spinner").css("visibility", "visible");
                            Api.getHomeFeed(self.model.startF, Api.appSettings.feedLimit, APP.sectionID, function(response) {
                                var moreFeed = APP.load("activityFeed", { feed: response.data.activityFeed.data });
                                $(".load-more-spinner").hide();
                                $("#content-container .content-scroller").append(moreFeed);

                                if(response.data.activityFeed.data.length < Api.appSettings.feedLimit) {
                                    self.model.pflf = true;
                                }
                                self.model.startF += response.data.activityFeed.data.length;

                                // bind activity feed events
                                self.bindActivityFeedEvents();
                                setTimeout(function() { if(UI.scroller) { UI.scroller.refresh(); } APP.working = false; }, 500); // we refresh again in 0.5 seconds to give the images time to load more properly
                            });
                        }

                    } else if(APP.feedFilter == "category-filter") {

                        if(!APP.working && !self.model.pclf) {
                            APP.working = true;
                            $(".load-more-spinner").css("visibility", "visible");
                            Api.getHomeCategories(1, 100, self.model.start, Api.appSettings.discoveryLimit, APP.sectionID, function(response) {
                                var categoryFeed = APP.load("categoryFeed", { items: response.data.categories });
                                $(".load-more-spinner").hide();
                                $("#content-container .content-scroller").append(categoryFeed);

                                if(response.data.categories.length < Api.appSettings.discoveryLimit) {
                                    self.model.pclf = true;
                                }
                                self.model.start += response.data.categories.length;

                                // bind activity feed events
                                self.bindCategoryEvents();
                                setTimeout(function() { if(UI.scroller) { UI.scroller.refresh(); } APP.working = false; }, 500); // we refresh again in 0.5 seconds to give the images time to load more properly
                            });
                        }

                    } else {
                        self.wantToList.addMore();
                        UI.scroller.refresh();
                    }


                }

            });
        }, 500);
    },
    bindTileEvents: function() {
        APP.working = false;
        var sUpdate = $("#slide-status-update"),
            self = this;


        $("#fancy-button").fastClick(function() {
            Backbone.history.navigate('searchStatusUpdate', true);
        });
        
        $("#profile-footer").fastClick(function () {

            Backbone.history.navigate("profile", true);
        });

        // Change filters from categories to feed
        $("#home-filters div.filter-div").fastClick(function() {
            if(APP.working) { return false; }

            var filter = this.id,
                showSort = filter === "recommended-filter" ? "show" : "";

            $("#home-slider").attr("class", filter); // Put class on home slider for css style
            
            self.filter = filter;

            if(APP.feedFilter == "category-filter") {
                self.catPos = UI.scroller.y;
            } else if(APP.feedFilter == "activity-filter") {
                self.actPos = UI.scroller.y;
            } else if(APP.feedFilter == "want-to-filter") {
                self.recPos = UI.scroller.y;
            } else {
                self.catPos = UI.scroller.y;
            }

            // This sucks  -- remove sort if not on want-to filter
            if(filter !== 'want-to-filter') { $("#want-to-sort").remove() }

            if(filter !== "recommended-filter") { self.model.startR = 0; }

            if(!$(this).hasClass("filter")) {
                $("#" +filter).siblings('.filter').removeClass('filter');
                $("#" +filter).addClass("filter");

                if(filter === "activity-filter") {
                    // !!!!!!!!!!!!!!!!!!! ACTIVITY FILTER !!!!!!!!!!!!!!!!!!!


                    // ONBOARD THE FEED
                    if(APP.gameState.feed === "1"){

                        var coach = APP.load("coach", { section : 'feed' }),
                            icon = document.getElementById('tap-menu'),
                            button = document.getElementById(filter),
                            buttonClone = button.cloneNode(true),
                            clone = icon.cloneNode(true),
                            iconStyle, buttonStyle, content;


                        // GET THE STYLE OF THE ORIGINAL NODE
                        iconStyle = window.getComputedStyle(icon, null);


                        // APPLY THE ORIGINAL NODES STYLE TO THE CLONE
                        clone.style.cssText = iconStyle.cssText;


                        // SET ID OF DIV TO '' (can't have two divs with the same id)
                        clone.style.backgroundColor = "#d32724";
                        clone.id += '-clone';
                        buttonClone.id = 'filter-clone';

                        // Set clond button position to original button
                        $(buttonClone).css({ left : $(button).position().left }); 


                        $('#coach-overlay').html(coach);

                        $("#coach-section")
                            .prepend( $(clone) );

                        UI.bindCoachEvents('feed');

                    }


                    if(!self.model.feedLoaded || self.model.feed == null) {
                        $("#content-container .content-scroller").html("");
                        self.feedInterval = setInterval(function() {
                            if(self.model.feedLoaded && self.model.feed) {

                                var activityFeed = APP.load("activityFeed", { feed: self.model.feed.feed });
                                $("#content-container .content-scroller").html(activityFeed);

                                self.bindActivityFeedEvents();
                                APP.feedFilter = filter;
                                var curPos = self.actPos;
                                clearInterval(self.feedInterval);
                            }
                        }, 100);
                    } else {

                        var activityFeed = APP.load("activityFeed", { feed: self.model.feed.feed });
                        $("#content-container .content-scroller").html(activityFeed);
                        self.bindActivityFeedEvents();
                        APP.feedFilter = filter;
                        var curPos = self.actPos;
                    }

                    // Add people 
                    if(self.model.get("people")){
                        new RecommendedPeopleView(self.model.get('people'));
                    }

                } else if(filter === "category-filter") {

                    // !!!!!!!!!!!!!!!!!!! CATEGORY FEED !!!!!!!!!!!!!!!!!!!


                    self.model.lastFeed = $("#content-container .content-scroller").html(); // Update feed html to show current likes and comments
                    $("#content-container .content-scroller").html(APP.load("categoryFeed", { items: self.model.categories }));

                    self.bindCategoryEvents();
                    APP.feedFilter = "category-filter";
                    var curPos = self.catPos;

                } else if(filter === "want-to-filter") {
                    
                    // ONBOARD WANT-TO
                    if(APP.gameState.wantTo === "1"){

                        var coach = APP.load("coach", { section : 'wantTo' }),
                            button = document.getElementById(filter),
                            buttonClone = button.cloneNode(true),
                            position = $(button).position().left,
                            iconStyle, buttonStyle, content;


                        // GET THE STYLE OF THE ORIGINAL NODE
                        iconStyle = window.getComputedStyle(icon, null);


                        // SET ID OF DIV TO '' (can't have two divs with the same id)
                        buttonClone.className += ' clone';
                        buttonClone.id += '-clone';

                        // Set clond button position to original button
                        $(buttonClone).css({ left : position }); 


                        $('#coach-overlay').html(coach);

                        $("#coach-section")
                            .append( $(buttonClone) );

                        // Center arrow on button
                        $("#coach-arrow").css({ 
                            bottom : $(button).height() + 20,
                            width : $(button).width(),
                            left : position
                        });

                        UI.bindCoachEvents('feed');

                    }
                    
                   if(self.wantToList) { 
                        
                        self.wantToList.render(); 
                    
                    } else {

                        $("#content-container .content-scroller").empty().addClass('loading');
                    }

                    APP.feedFilter = filter;
                    curPos = self.recPos;
                    
                }

                UI.scroller.refresh();

                // go to last position when filter was changed
                UI.scroller.scrollTo(0, curPos, 0); 


            } 

            setTimeout(function() { UI.scroller.refresh(); }, 2000);

        });

        $(".highlight-title").click(function() {
            var categoryID = this.getAttribute("data-catid") || null;
            var listID = this.getAttribute("data-listid") || null;

            if(listID || categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=" + listID, true);
            }
        });

        $("#view-queue-list").fastClick(function() {
            Backbone.history.navigate("lists/" + APP.gameState.watchListID, true);
        });

        // I don't like this. it calls the function 2 times BUT it works
        // Reinit the progressive load and feed filter on notification tap
        $("#wrapper").on('notify', function(e) {
            e.stopPropagation();
            if( !$("#notifications-menu").hasClass("on") ) {
                //self.filterFunction();
                self.moreFeedPlease();
            }
            return false;
        });

    },
    bindActivityFeedEvents: function() {
        var sUpdate = $("#slide-status-update"),
            self = this;

        // avatar click goes to that user's profile page
        $(".feed-item .action").click(function() {
            var actorID = $(this).data("actorid");

            APP.feedPos = UI.scroller.y;
            Backbone.history.navigate("profile/" + actorID, true);
            if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "Home feed" });

            return false;
        });
        // poster image click event, depends on whether it is a movie or a category
        $(".feed-item .poster img").click(function() {
            var movieID = $(this).data("movieid");
            var categoryID = $(this).data("catid");
            var userID = $(this).data("userid");

            APP.feedPos = UI.scroller.y;
            if(movieID) {
                Backbone.history.navigate("movieLobby/" + movieID, true);
            } else if(categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=null", true);
            } else if(userID) {
                Backbone.history.navigate("profile/" + userID, true);
            }
        });
        // social likes button -> goes to list of likes
        $(".feed-social > .likes").click(function(e) {
            var feedID = this.id.split("_")[1];

            APP.feedPos = UI.scroller.y;
            Backbone.history.navigate("feedLikes/" + feedID, true);

            return false;
        });

        // both comment buttons in social and footer go to comment page
        $(".follow").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            var ele = $(this);
            var userID = $(this).parent().data("userid");

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
                Api.followUser(userID, function(response) {
                    if(response.success) {
                        ele.html("Following");
                        ele.toggleClass("following");
                    }
                });
            }

            return false;
        });

        $(".greeting").click(function(e) {
            var userID = $(this).parent().data("userid");

            APP.feedPos = UI.scroller.y;
            
            Backbone.history.navigate("greeting/" + userID, true);

            return false;
        });

        // feed footer comment button
        $(".feed-social > .comment, .feed-footer > .comment").click(function(e) {
            var feedID = $(this).parent().data("feedid");
            var discussion = $("#feed"+feedID+" .feed-discussion");

            APP.feedPos = UI.scroller.y;
            Backbone.history.navigate("feedDiscussion/" + feedID, true);

            return false;
        });
        // footer like button - switches like/unlike status
        $(".feed-footer > .like").unbind().click(function() {
            var el = $(this);
            var feedID = $(this).parent().data("feedid"),
                type = $(this).parent().data("type");

            Api.likeFeed(feedID, function(response) {
                if(response.success) {
                    var tl = $("#like_"+feedID+" .totalLikes");
                    var tlNum = parseInt(tl.html());
                    if(el.hasClass("liked")) { tlNum--; }
                    else {
                        tlNum++;
                        if(Analytics) Analytics.eventAndParams("Feed - Like: ",{ type: type });
                    }
                    el.toggleClass("liked");
                    tl.html(tlNum);
                    if(tlNum <= 0) { $("#like_"+feedID).hide(); }
                    else { $("#like_"+feedID).show(); }
                }
            });
            return false;
        });
        // footer share button
        $(".feed-footer .share").unbind().click(function() {
            var id = $(this).parent().data("feedid"),
                title = $("#feed"+ id +" .action p .object").html(),
                movieID = $("#feed"+ id +" img").data("movieid"),
                catID = $("#feed"+ id +" img").data("catid"),
                shareLink = Api.appSettings.shareLocation,
                type = $("#feed"+ id).data("type"),
                link = type === "ratecompletecategory" ? shareLink + "/list.php?listID=" + catID + "&category=true" : shareLink + "/item.php?movieID=" + movieID,
                message = "I just checked out '"+ title + "' @tryfabric";

            window.plugins.socialsharing.share(message, title, null, link);
            mixpanel.track("Share selected");
            if(Analytics) { Analytics.event("Share Selected"); }
        });

        $(".feed-footer.suggested").unbind().click(function(){
            Backbone.history.navigate("matches", true);
        });

        // misc
        $(".queue").click(function() {
            var movieID = ""; // TODO: Legacy code?
        });

        $("#popup-options div").click(function() {
            var link = "https://itunes.apple.com/us/app/trailerpop/id587645214",
                movie = self.shareInfo,
                fbCaption = movie.type === "ratecompletecategory" ? "Check this list out on Fabric" : "Discover more @tryfabric",
                tweet = "Check out "+ movie.title +" @tryfabric ",
                action = $(this)[0].id;

            if(action === "facebook-share") {
                var options = {
                    method: 'feed',
                    name: movie.title,
                    caption: fbCaption,
                    link: link,
                    picture: movie.poster
                }
                FB.ui(options, function(response) {});
            } else if (action === "twitter-share") {
                // Twitter
                window.plugins.twitter.composeTweet(
                    function(s) { Util.log("Tweet success"); },
                    function(e) {
                        if(e.toString() != 'Cancelled') {
                            Util.alert("Oops! There was an error sending your tweet.", "Twitter Error");
                            Util.log('Tweet failed: ' + e);
                        }
                    },
                    tweet + link,
                    movie.poster
                );
            }
            UI.putAwaySlideUp();
        });

        sUpdate.click(function(e) {
            e.preventDefault;

            UI.scroller.scrollTo(0, -80, 0);
        });

        sUpdate.on("input", function(e) {
            var title = $(this).val();
            $("#close-status-drop").show();
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
                        UI.deallocScroller();
                        UI.initScroller($("#status-drop")[0]);
                        setTimeout(function() {
                            // IN IOS 8 BLUR COLLAPSED DROP DOWN
                            UI.scroller.on('scrollStart', function () {
                                 sUpdate.blur();
                            });
                        }, 500);
                    } else {
                        // hide the thing
                        UI.deallocScroller();
                        UI.initScroller($("#status-drop")[0]);
                    }
                });
            } else if(title.length === 0) {
                $("#close-status-drop").hide();
            } else {
                $("#status-drop div").html("");
                $("#status-drop").removeClass("on");
                $("#close-status-drop").hide();
            }
        });

        $(document).on("keydown", function(e) {
            if(e.keyCode == 13) { sUpdate.blur(); }
        });

        $("#close-status-drop").fastClick(function(e) {
            e.preventDefault();
            e.stopPropagation();

            sUpdate.val("");
            $("#close-status-drop").hide();
            $("#status-drop div").html("");
            $("#status-drop").removeClass("on");

            UI.deallocScroller();
            UI.initScroller($("#category-container")[0]);

            return false;
        });
    },
    sortQ: function(array, filter){
        var self = this,
            cleanArray, sortedArray;

        cleanArray = Util.validArray(array, filter); //Separate values that don't have the filter field (cities don't have rotten tomato scores)
        
        sortedArray = cleanArray[0]                    // sort the array that has the filter values and concat the items that don't
                            .sort(Util.sortFunction(filter))
                            .concat(cleanArray[1]); 

        var html = APP.load("homeQ", {
            removedList: self.model.removedList,
            items: sortedArray.slice(0,50),
            concierge: self.concierge,
            count: 0
        });

        $("#content-container .content-scroller").html(html);
        $("#current-filter").html($("#"+filter).html());

        self.bindRecommendedEvents();
        self.model.recs = sortedArray;
    },
    bindCategoryEvents: function() {
        var self = this;

        // go to specivit category
        $("#category-container div.catItem").unbind("click").click(function() {
            var categoryID = this.getAttribute("data-catid") || null;
            var listID = this.getAttribute("data-listid") || null;

            if(listID || categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=" + listID, true);
            }
        });
    },
    dealloc: function() {
        // stop the slick carousel
        //$("#side-swipe").slickPause();
        clearInterval(self.feedInterval);
        APP.working = false;

        return this;
    }
});

