var SearchModel = Backbone.Model.extend({
	    view: null,
		listID: null,
		listName: "",
		searchReturn: false,
		click: false,
        query: null,

		initialize: function(options) {
			this.view = options.view;
			this.listID = options.listID;
			this.listName = options.listName;
			this.searchReturn = options.searchReturn;
            this.query = options.query;

            if(this.query) {
                this.searchReturn = true;
            }
		},
		init: function(callback) {
	        var self = this;
            callback = callback || function() { };

	        if (self.view === "movieLists") {
	            $("#search-form input.text-select-ok").attr("placeholder", "Search for people or lists");
	            $("#wrapper").addClass("allCategories");
	            $(".header-text").html("MovieLists");

				// This view needs a list to start.
	            self.getMovieLists(function() {
	                self.doOtherInitThings(self.searchReturn);
                    callback();
	            }, true, false);  // callback, (bool) isMovieLists === true tells allCategories() that we need movielists
	        } else {
	            if (self.view === 'addToList') {
	                // Search to add films to a list
	                $(".header-text").html("Add Films: " + self.listName);
	                $("#list-row").addClass("add-films");
	            } else {  // Movie search from dashboard.
	                // Search across all movies to start a round of game play.
	                $(".header-text").html("Search");
	            }
	            self.doOtherInitThings(self.searchReturn);
                callback();
	        }
	    },
		doOtherInitThings: function(searchReturn) {
	        var self = this;

	        // Search submit & clear form button
	        $("#search-form").submit(function(e) {
				e.preventDefault();
	            var searchString = $(this).find("input").val();

	            self.query = searchString;
	            self.submitSearch(searchString);

				return false;
	        });

	        $("input.text-select-ok").fastClick(function() { $(this).val(""); });

	        if (searchReturn) {
	            self.submitSearch(self.query);
	            //$("#search-form input.text-select-ok").val(self.query);
	        }	
	    },
	    submitSearch: function(searchString) {
            document.activeElement.blur();
            $("input").blur();

	        var options = {
	                "action": "searchSwipe",
	                "searchString": searchString
	            },
	            self = this;

	        if (this.view === "movieLists") {
	            Facebook.getFbFriends(function(friends) {
	                options.action = "searchLists";

                    if(friends) {
                        options.friendList = friends;
                    }

	                self.performSearch(options);
	            });
	        } else if(this.view === "searchUsers"){		// SEarch for users
	        	options.emailTrue = searchString.indexOf('@') !== -1 ? "email" : "uName";
	        	options.action = this.view;
	        	self.performSearch(options);

	        	var params = {for: searchString};
	        	if(Analytics) Analytics.eventAndParams("Searched users",  params ); 

	        } else {		//Search for movies
	            if (self.listID !== null) { options.listID = this.listID; }
	            self.performSearch(options);
	            var params = {for: searchString};
	            if(Analytics) Analytics.eventAndParams("Searched movies", params ); 
	        }

	    },
		performSearch: function(options) {
			var self = this;

			$(".text-select-ok").val("");
            Api.dispatcher(options, function(result) {
            	var template = self.view == "movieLists" ? "templates/movieListRow.html" : "templates/listRow.html",
                	userLists = APP.gameState;

				if(result.length > 0) {
					if(self.view === "searchUsers") {
						var html = APP.load("searchUserList", {followers: result});
						
						$("#search-results").prepend(html);

						UI.initScroller($("#list-row-wrapper")[0]);
						$(".lists-row").click(function(){
				            var userID = $(this).data("userid");

				            Backbone.history.navigate("profile/" + userID, true);
				            if(Analytics){ Analytics.eventAndParams("Profile (other) viewed",{ from: "User Search" }); }
				        });

					} else {

						var html = APP.load("listRow", { items: result, userLists: userLists, listID: self.listID, thumbnail: false });

						$("#search-results").prepend(html);

						setTimeout(function() {
                            UI.initScroller($("#list-row-wrapper")[0]);
                            UI.bindMovieRowEvents();
                        }, 1000);

	                    // Update history - does not work for iOS 5.0, so they do not see the old search query they had in history
	                    Backbone.history.navigate("search?q=" + self.query, { trigger: false, replace: true });
                	}
				} else {
					$("#list-row-wrapper").remove();
					$(".blank-message, .blank-instructions").show();
					return false;
				}
            });
        },
	    bindListEvents: function() {
	        var self = this;

	        // Add movie to list (lists search only)
	        $(".add-films .lists-menu").fastClick(function(e) {
				e.preventDefault();

	            var options = {
	                    "action": "setMovieToList",
	                    "listID": self.listID,
	                    "moviePublishedID": $(this).parents(".list-row").attr("moviepublishedid")
	                },
	                $added = $(this).find(".added");

	            $(this).toggleClass("active");

	            if ($(this).hasClass("active")) {
	                $added.addClass(("active"));
	            } else {
	                $added.removeClass(("active"));
	                options.action = "unsetMovieFromList";
	            }

	            Api.dispatcher(options, function(response) {
	                if (response == false) {
	                    $(this).toggleClass("active");
	                }
	            });
	        });
	    },
		getMovieLists: function(callback) {
	        var options = {
                action: "getListsListAllUsers",
                friendList: Facebook.tpFbFriendIDs
            };

	        Api.dispatcher(options, function(categories) {
	            if (categories.length === 0) {
					// load welcome message
	                //APP.WelcomeController.loadWelcomeMessage();
	            } else {
					$.get('templates/movieListRow.html', function(html) {
						var html = _.template(html, { items: categories });
						$("#list-row").html(html);
                        UI.initScroller();
					});
	            }
				callback();
	        });
		}
	});

    var SearchView = Backbone.View.extend({
		model: null,
		view: null,

		
        initialize: function(options, callback) {
			var self = this;
			options = options || {};
            callback = callback || function() {};

			options.view = options.view || "search";
			options.listID = options.listID || null;
			options.listName = options.listName || "";
			options.searchReturn = options.searchReturn || null;
            options.query = options.query || null;
            this.view = options.view;

			this.model = new SearchModel(options);	
			callback();
			
            return this;
        },
        render: function(callback) {
			var self = this;
			callback = callback || function() { };
			var placeholder = self.model.view == "searchUsers" ? "Find Friends on Fabric" : "Search for movies",
				emptyReturn = self.model.view == "searchUsers" ? "Perhaps the person you're looking for hasn't joined yet. Why not try inviting them?" :"Looks like we don't have that one yet but we're working on it";

			var html = APP.load("search", { placeholder: placeholder, noResults: emptyReturn });
			$("#wrapper").html(html);

            if (!self.header) { self.header = new HeaderView({ title: "Search" }); }
            $("#wrapper").prepend(self.header.el);


			self.model.init(function() {
                callback();
            });
        },
        dealloc: function() {
			//this.model.dealloc();
		}
    });