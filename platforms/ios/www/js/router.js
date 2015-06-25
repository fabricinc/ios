    var Router = Backbone.Router.extend({
        $wrapper: $("#wrapper"),

        routes: {
            "": "welcome", // home, rate
            "back": "back",
            "home": "rate",
            "welcome": "welcome",
            "start": "start",
            "start/:slid": "startSlid",
            "login": "login",
            "register": "register",
            "friends": "friends",
            "inviteFriends": "inviteFriends",
            "logout": "logout",
            "profile": "profile",
            "profile/:id": "profileByID",
            "leaderboard": "leaderboard",
            "screening-room": "screeningRoom",
            "settings": "settings",
            "settings/:template": "innerSettings",
            "recommendations": "recommendations",
            "recommendedList/:submenu": "recommendedList",
            "userRecommendations/:listID": "userRecommendations",
			"stats": "stats",
			"search": "search",
			"search/:id": "searchList",
            "search?listID=:listID&listName=:listName": "searchAddToList",
            "search?q=:query": "searchQuery",
            "searchUsers/:query": "searchUsers",
			"categories": "categories",
			"categories/:id": "findCategory",
			"categories?categoryID=:categoryID&movieID=:movieID": "findSpecialCategory",
            "contest/:id": "contest",
            "contestLeaderboard/:id": "contestLeaderboard",
			"subcategories/:id": "findSubCategory",
			"movieLists": "movieLists",
			"movieLists/:id": "findMovieList",
			"player/:id": "player",
            "simplePlayer/:id": "simplePlayer",
            "player?movieID=:movieID&listID=:listID": "movieListPlayer",
            "player?movieID=:movieID&contestID=:contestID": "contestPlayer",
			"lists": "lists",
			"lists/:id(/:sectionID)": "editList",
            "otherLists/:id": "otherLists",
            "otherList/:id": "otherList",
            "userLists?userID=:userID&following=:following": "userLists",
            "userLists/:movieID": "movieUserList",
            "recommendedByList/:movieID": "recommendedByList",
			"feed": "feed",
            "userFeed/:id": "userFeed",
            "rate": "rate",
			"fb-connect": "fb-connect",
            "discovery?categoryID=:categoryID&listID=:listID": "discovery",
            "messages": "messages",
            "messages/:id": "conversation",
            "movieLobby/:id": "movieLobby",
            "feedDiscussion/:id": "feedDiscussion",
            "feedLikes/:id": "feedLikes",
            "events": "events",
            "events/:id": "event",
            "createEvent": "createEvent",
            "matches": "matches",
            "greeting/:id": "greeting",
            "whosGoing/:movieID": "whosGoing",
            "statusUpdate/:id": "statusUpdateMovie",
            "searchStatusUpdate": "searchStatusUpdate",
            "getFavsInCommon/:id": "getFavsInCommon",
            "getQueueInCommon/:id": "getQueueInCommon",
            "reportUser/:id": "reportUser",
            "kce": "kce",
            "fabricPlayer/:id": "fabricPlayer",
            "fabricPlayerRec/:id": "fabricPlayerRec",
            "movieDiscussion/:id": "movieDiscussion",
            "*path": "rate"
        },

        /**
         * Generic view loader.  Keeping page transition and other interface logic well separated from routing etc.
         *
         * @param view Backbone View object
         * @param callback  optional
         * @param options   optional
         *                  (bool) loadPageHtml: if true will replace contents of APP.$wrapper with view.$el.html()
         *                  (bool) fade: if true, will attach loadFadeImage jqPlugin to 'image' class;
         *                  (bool) scroller: if true, will init APP.scroller
         * @param className optional: will get attached to application wrapper element for inherited styles.
         *                  Will use current route url fragment if undefined.
         */

        loadView: function(view, callback, options, className) {

			var options = options || {},
                fade = options.fadeImageClass === false ? false : true, // Default to true
                scroller = options.scroller === false ? false : true, // Default to true
                load = options.loadPageHtml === false ? false : true, // Default to true
                spinner = options.spinner === false ? false : true, 
                self = this;
    
            className = className || Backbone.history.fragment;
            callback = callback || function() {};

                // A little cleanup may be in order.
                if (APP.view.previous) { APP.view.current.dealloc(); }
                
                APP.view.previous = APP.view.current;
                APP.view.current = view;

                if (UI.scroller) { UI.deallocScroller(); }

                $("#wrapper").attr("class", className);

            UI.mask(spinner, function() {
                
                // Render the view.
                view.render(function() {
                    if (load) { APP.$wrapper.html(view.$el.html()); }
                    if (fade) { $(".image").loadFadeImage(); }
                    //if (scroller) { UI.initScroller(); }

                    UI.unmask();

                    if(Util.isMobile()) {
                        $(".external").fastClick(function(e) {
                            e.preventDefault();
                            e.stopPropagation();

                            Util.handleExternalUrl(this);
                        });
                    }
                    self.bindHeaderEvents(className);
                    self.bindGlobalEvents();

                    callback();
                });
            });


        },

        bindHeaderEvents: function(className) {
            var self = this;
            
            $(".left.button.back").fastClick(function(e) {
                e.preventDefault();
                e.stopPropagation();
                Backbone.history.navigate("back", true);
            });
            $("#done-button").fastClick(function(e){
                e.preventDefault();     e.stopPropagation();
                Backbone.history.navigate("rate", true);

                return false;
            })

            if(className != "messages") {
                $("#chat-menu").fastClick(function() {
                    Backbone.history.navigate("messages", true);
                    //UI.rightMenuSlide();
                    //UI.loadConversations($("#right-menu .content"));
                });
            }
            // show and hide fabric filter on Title click -- Only on dashboard / rate / home page
            $("#dashboard header nav h1, #fabric-menu").fastClick(function(e) {
                e.preventDefault(); e.stopPropagation();

                $("#fabric-menu, #dashboard header nav h1").toggleClass("open"); 

                // SHOW COACH 
                if(this.id !== 'fabric-menu' && APP.gameState.fabricMenu === "0"){

                    var coach = APP.load("coach", { section : 'fabricMenu' }),
                        clone = $(this).clone();

                    $('#coach-overlay').html(coach);
                    $("#coach-section").prepend(clone);

                    $("#coach-arrow").css({
                        left : ( window.innerWidth / 2 ) - ( $("#coach-arrow").width() / 2 ),

                    })

                    UI.bindCoachEvents('fabricMenu');

                }

                return false;
            });

            // SHOW FABRIC MENU LIST ? not sure why
            $(".list header nav h1").fastClick(function(e) {
                e.preventDefault(); e.stopPropagation();

                $("#fabric-menu, .list header nav h1").toggleClass("open"); 

                return false;
            });
            $("#rec-filter-button").fastClick(function(e) {
                e.preventDefault();     e.stopPropagation();

                $("#recommendation-filters, #screen").toggleClass("show"); 

                return false;
            });
            $("#done-inter-button").fastClick(function(e){
                $("#up-next").show();

                
                $(this).attr({
                    "class": "right button done",
                    "id": "done-button"
                }).html("Done");

                $("header nav h1").html("Next Up");

                $("#done-button").fastClick(function() {
                    Backbone.history.navigate("rate", true);
                });
            });
            // handle selection of filter
            $("#fabric-menu .fabric-nav-item").fastClick(function(e) {
                e.preventDefault(); e.stopPropagation();

                var sectionID = $(this).data("section-id"),
                    title = $(this).data("title"),
                    button = $(this);


                // Darken the selected section button for 400 ms
                button.addClass("honda");
                setTimeout(function() { button.removeClass("honda"); }, 400);

                // Change Icon in the Fabric Tab class
                $("#current-icon")[0].className = title;
                $("body").attr({ "class": title + "-section" });

                // Update section id on the APP
                APP.sectionID = sectionID;
                    
                // Put away Fabric Menu 
                $("#fabric-menu, #dashboard header nav h1").toggleClass("open");
                $(".list header nav h1").toggleClass("open");

                if(Analytics) { Analytics.eventAndParams("Fabric Section Changed ", { sectionID: sectionID }); }

                // Refresh the page
                setTimeout(function() {
                    UI.mask();
                    Backbone.history.loadUrl(window.location.hash.replace("#",""), true);
                }, 400);

                return false;
            });

            $("#notifications-menu").fastClick(function(e) {
                e.preventDefault();
                e.stopPropagation();

                if(!APP.working) {
                    UI.toggleNotifications();
                    $("nav h1").toggleClass("notify");

                    if(Analytics && $(this).hasClass("on")) { Analytics.event("Notifications viewed"); }
                    else { $(this).trigger("notify"); }
                    APP.click = false;
                }

                return false;
            });

            $("#tap-menu, .left.button.slide").fastClick(function(e) {
                e.preventDefault();
                Backbone.history.navigate("matches", true);
            });

            $("#scroll-top").fastClick(function() {
                if(UI.scroller.y < 0) {
                    UI.scroller.scrollTo(0, 0, 800);
                }
            })
        },

        bindGlobalEvents: function() {
            this.loadRequests();

        },
        loadRequests: function() {
            this.unseenActivityRequest();
        },
        unseenActivityRequest: function(time) {
            var self = this;
            clearInterval(window.unseenActivityRequest);
            window.unseenActivityRequest = setTimeout(function() {
                if(Api.connected) {
                    Api.getUnseenActivity(function(result) {
                        if(result && result.messages && result.notifications) {
                            if(parseInt(result.messages) > 0) {
                                $("#chat-num").html(result.messages).show();
                            }
                            if(parseInt(result.notifications) > 0) {
                                $("#notifications-num").html(result.notifications).show();
                            }
                        }
                        self.unseenActivityRequest(Api.appSettings.unseenInterval);
                    });
                }
            }, time);
        },
        bindLoginEvents: function() {
            var self = this;
            this.on("route:start", function() {
                self.loadView(new StartView(), function() {
					// callback
                }, {
                    fadeImageClass: false,
                    scroller: false,
                    loadPageHtml: false
                }, "home");
            });
            
            this.on("route:startSlid", function(slid) {
                self.loadView(new StartView({view: "start", slid: slid }), function() {
                    // callback
                }, {
                    fadeImageClass: false,
                    scroller: false,
                    loadPageHtml: false
                }, "home");
            });

            this.on("route:login", function() {
                self.loadView(new LoginView(), function() {
                    // Stub for callback
                }, {
                    fadeImageClass: false,
                    scroller: false,
                    loadPageHtml: false
                }, "login");
            });

            this.on("route:logout", function() {
                APP.dealloc();
                self.dealloc(); // Unbind all routes.
                self.bindLoginEvents(); // Rebind login routes.
                User.logout();
                User.avatar = null;


                if (Analytics) {
                    Analytics.event("Logout selected");
				}
            });

            this.on("route:fb-connect", function() {
                if (!APP.click) {
                    APP.click = true;
                    Facebook.promptLogin(function(success) {
                        
                        if(!APP.router) {
                            APP.router = initializeRouter({ bindAppRoutes: success });
                        } else {

                            APP.router.bindAppEvents();
                            Backbone.history.navigate("welcome", true);
                        }
                    });
                }
            });

            this.on("route:register", function() {
                self.loadView(new RegisterView(), function() {
                    // Stub for callback
                }, {
                    fadeImageClass: false,
                    scroller: false,
                    loadPageHtml: false
                }, "register");
            });
        },

        bindAppEvents: function() {
            var self = this;
            this.on("route:home", function() {
                this.off("route:welcome");
                self.loadView(new HomeView(), function() {
                    // Stub for callback
                }, {
                    fadeImageClass: true,
                    scroller: true,
                    loadPageHtml: false
                }, "home");
            });
            this.on("route:welcome", function() {

                if (APP.gameState && APP.gameState.welcomeCompleted === "0") {
                    self.loadView(new WelcomeCategoryView(), function() {
                        // Callback?
                    }, {
                        fadeImageClass: false,
                        scroller: false,
                        loadPageHtml: false
                    }, "welcome");
                } else {
                    Backbone.history.navigate("rate", true);
                }
            })
            this.on("route:back", function() {
                // "back" Route BACK
				// Sounds.back();
                if(APP.url.set){
                    // IF deep linking url set and then 'back' is pressed take them home b/c there is no 'back'
                    Backbone.history.navigate("rate", true);
                    APP.url.set = false;                             // Clear APP.url
                } else {
                    if (Backbone.history.history.length > 1) {
                        Backbone.history.history.go(-2);
                    } else {
                        this.navigate("");
                    }
                }
            });
			this.on("route:player", function(movieID) {
				self.loadView(new PlayerView({ movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "player");
			});
            this.on("route:movieListPlayer", function(movieID, listID) {
                self.loadView(new PlayerView({ movieID: movieID, listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "player");
            });
            this.on("route:contestPlayer", function(movieID, contestID) {
                self.loadView(new PlayerView({ movieID: movieID, contestID: contestID }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "player");
            });
            this.on("route:simplePlayer", function(movieID) {
                self.loadView(new PlayerView({ movieID: movieID, isSimplePlayer: true }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "player");
            });
            this.on("route:profile", function() {
                self.loadView(new ProfileView(), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "profile");
            });
            this.on("route:profileByID", function(userID) {
                self.loadView(new ProfileView({ userID: userID }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "profile");
            });

            this.on("route:settings", function() {				
				self.loadView(new SettingsView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "settings");
			});
            this.on("route:innerSettings", function(template) {              
                self.loadView(new SettingsView({ template: template }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "settings");
            });
			this.on("route:stats", function() {
				self.loadView(new StatsView(), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "stats");
			});
			this.on("route:search", function() {
				self.loadView(new SearchView(), function() {

                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "search");
			});
			this.on("route:movieLists", function() {
				self.loadView(new SearchView({ view: "movieLists" }), function() {
                    // Stub for callback;
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "search allCategories");
			});
			this.on("route:searchList", function(listID) {
				self.loadView(new SearchView({ view: "addToList", listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "search");
			});
            this.on("route:searchList", function(listID) {
                self.loadView(new SearchView({ view: "addToList", listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "search");
            });
            this.on("route:searchUsers", function(query) {
                self.loadView(new SearchView({ view: "searchUsers", query: query }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "search-users");
            });
            this.on("route:searchQuery", function(q) {
                self.loadView(new SearchView({ query: q }), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "search");
            });
			this.on("route:categories", function() {
				self.loadView(new CategoriesView(), function() {
                    // Stub for callback
                }, {
                    scroller: false
                }, "allCategories");
			});
			this.on("route:findCategory", function(categoryID) {
				self.loadView(new MovieListView({ view: "selectMovie", categoryID: categoryID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "selectMovie");
			});
			this.on("route:findSpecialCategory", function(categoryID, movieID) {
				self.loadView(new MovieListView({ view: "selectMovie", categoryID: categoryID, movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "selectMovie");
			});
			this.on("route:findSubCategory", function(categoryID) {
				self.loadView(new CategoriesView({ categoryID: categoryID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "allCategories");
			});
			this.on("route:findMovieList", function(listID) {
				self.loadView(new MovieListView({ view: "selectMovie", listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "selectMovie");
			});
			this.on("route:lists", function() {
				self.loadView(new MovieListView({ view: "lists" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "lists");
			});
			this.on("route:editList", function(listID, sectionID) {
				self.loadView(new MovieListView({ view: "list", listID: listID, sectionID: sectionID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "list");
			});
            this.on("route:otherList", function(listID) {
                self.loadView(new MovieListView({ view: "list", listID: listID, other: true }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "list");
            });
            this.on("route:otherLists", function(userID) {
                self.loadView(new MovieListView({ view: "list", userID: userID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "list");
            });
            this.on("route:userLists", function(userID, following) {
                self.loadView(new UserListView({ view: "list", userID: userID, following: following }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "follow-list");
            });
            this.on("route:friends", function() {
                self.loadView(new FriendView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "friends");
            });
            this.on("route:recommendedByList", function(movieID) {
                self.loadView(new UserListView({ view: "list", movieID: movieID, recommendations: true }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:whosGoing", function(movieID) {
                self.loadView(new NearbyAttendingView({ view: "list", movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "attending-nearby");
            });
            this.on("route:movieUserList", function(movieID) {
                self.loadView(new UserListView({ view: "list", movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
			this.on("route:recommendations", function() {
				Sounds.standardButton();
				self.loadView(new RecommendationsView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "recommendations feed");
			});
            this.on("route:recommendedList", function(submenu) {
                Sounds.standardButton();
                self.loadView(new RecommendedListView({ submenu: submenu }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "recommended");
            });
            this.on("route:userRecommendations", function(listID) {
                Sounds.standardButton();
                self.loadView(new UserRecommendationsView({ listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "user-recommended");
            });
			this.on("route:feed", function() {
				Sounds.standardButton();
				self.loadView(new FeedView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
					loadPageHtml: false
                }, "feed");
			});
            this.on("route:userFeed", function(userID) {
                if(userID == "null") { userID = null; }
                Sounds.standardButton();
                self.loadView(new FeedView({ userID: userID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "feed");
            });
            this.on("route:contest", function(contestID) {
                self.loadView(new ContestView({ contestID: contestID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "contest");
            });
            this.on("route:contestLeaderboard", function(contestID) {
                self.loadView(new ContestLeaderboardView({ contestID: contestID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "contestLeaderboard");
            });
            this.on("route:discovery", function(categoryID, listID) {
                self.loadView(new DiscoveryView({ categoryID: categoryID, listID: listID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "discovery");
            });
            this.on("route:rate", function() {
                self.loadView(new RateView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "rate");
            });
            this.on("route:messages", function() {
                self.loadView(new MessageView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "messages");
            });
            this.on("route:conversation", function(otherID) {
                self.loadView(new MessageView({ otherID: otherID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "messages");
            });
            this.on("route:movieLobby", function(movieID) {
                self.loadView(new MovieLobbyView({ movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-lobby");
            });
            this.on("route:feedDiscussion", function(feedID) {
                self.loadView(new DiscussionView({ type: "feed", objectID: feedID, notificationType: "comment" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false,
                    spinner: false
                }, "discussion feed");
            });
            this.on("route:feedLikes", function(feedID) {
                self.loadView(new DiscussionView({ type: "feed", objectID: feedID, notificationType: "like" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "discussion feed likes");
            });
            this.on("route:events", function() {
                self.loadView(new EventsView({ action: "view" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "events");
            });
            this.on("route:event", function(eventID) {
                self.loadView(new EventsView({ action: "view", eventID: eventID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "event");
            });
            this.on("route:createEvent", function(eventID) {
                self.loadView(new EventsView({ action: "create" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "event");
            });
            this.on("route:matches", function() {
                self.loadView(new MatchesView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "matches");
            });
            this.on("route:greeting", function(userID) {
                self.loadView(new GreetingView({ userID: userID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "greeting");
            });
            this.on("route:statusUpdateMovie", function(movieID) {
                self.loadView(new StatusUpdatesView({ movieID: movieID }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "status-update");
            });
            this.on("route:searchStatusUpdate", function() {
                self.loadView(new SearchStatusUpdateView(), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "search-status-update");
            });
            this.on("route:getFavsInCommon", function(userID) {
                self.loadView(new ListView({ objectID: userID, listType: "favInCommon" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:getQueueInCommon", function(userID) {
                self.loadView(new ListView({ objectID: userID, listType: "queueInCommon" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:kce", function() {
                self.loadView(new MovieLobbyView({ kce: true }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:fabricPlayer", function(listID) {
                self.loadView(new FabricPlayerView({ listID: listID, recommendation: false }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:fabricPlayerRec", function(listID) {
                self.loadView(new FabricPlayerView({ listID: listID, recommendation: true }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "movie-seen-list");
            });
            this.on("route:movieDiscussion", function(movieID) {
                self.loadView(new DiscussionView({ type: "movie", objectID: movieID, notificationType: "comment" }), function() {
                    // Stub for callback
                }, {
                    scroller: false,
                    loadPageHtml: false
                }, "discussion feed");
            });
        },

        dealloc: function() {
            this.off();
        }

	});
	
	function initializeRouter(options) {
        var router = new Router(),
            options = options || {},
            bindAppRoutes = (options.bindAppRoutes === false) ? false : true; // Default to true.

        router.bindLoginEvents();


		if (bindAppRoutes) {

            // if(User.isFacebook) { Facebook.uploadLikes(); }

			router.bindAppEvents();
            
			Backbone.history.start();


		} else {
            Backbone.history.start({ silent: true });
            Backbone.history.navigate("start", true);
		}
        return router;
    };