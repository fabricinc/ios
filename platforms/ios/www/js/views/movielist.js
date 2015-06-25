	var MovieListModel = Backbone.Model.extend({
		start: 0,
		offset: 0,
	    limit: 50,
	    count: 50,
	    paginationNumber: 30,
	    listLength: null,
	    endOfList: false,
	    lastCategoryID: null,
	    scroller: null,
	    target: $("#list-row"),
	    renderView: null,
	    rowTemplate: null,
	    listName: null,
	    typeID: null,
	    listID: null,
		movieID: null,
		categoryID: null,
	    permissions: ["private", "friends", "public"],
	    click: false,
		searchView: null,
		html: null,
        data: null,
        userID: null,

		initialize: function(renderView, options) {
	        self.click = false;
			options = options || {};

	        // Zero search unless we're at selectMovie. Exception for selectMovie loaded from movielists (search).
	        if (renderView != "selectMovie") { this.start = 0; }

	        this.renderView = renderView;
			this.target = $('#list-row');
			
	        if (options) {
	            this.lastCategoryID = options.categoryID;
	            this.categoryID = options.categoryID;
	            this.listID = options.listID;
	            this.movieID = options.movieID;
	            this.userID = options.userID;
                this.sectionID = options.sectionID || APP.sectionID;
	        }
		},
	    getLists: function(callback) {
	    	Api.getLists(this.userID, callback);
	    },
	    getListData: function(callback) {
	    	callback = callback || function(){};
	    	var self = this,
				options = {
					"action": "getListV2",
					"listID": self.listID,
					"offset": self.offset,
					"limit": self.limit,
					"sectionID": self.sectionID
				};

			self.offset += self.limit;

			Api.dispatcher(options, function(list) { callback(list); });
	    },
	    getMoreMovies: function(callback) {
	    	callback = callback || function(){};
	    	var self = this,
				options = {
					"action": "getListV2",
					"listID": self.listID,
					"offset": self.offset,
					"limit": self.limit
				};


			Api.dispatcher(options, function(listPart) { callback(listPart); });

            // Increase list incriment to load next chunk of movies
			self.offset += self.limit;
	    }
	});

    var MovieListView = Backbone.View.extend({
		id: "movie-list-view",
		view: null,
        list: null,
        model: null,
		listID: null,
        header: null,
		userID: null,
        filter: null,
        movieID: null,
        loadMore: true,
        ownQueue: false,
        listPosition: 50,
		
        initialize: function(options, callback) {
			var self = this;
            callback = callback || function() {};
			
			this.view = options.view;
			this.movieID = options.movieID || null;
			this.listID = options.listID || null;
			this.categoryID = options.categoryID || null;
			this.userID = options.userID || null;
            this.other = options.other || false;
            this.sectionID = options.sectionID || null;
            this.ownQueue = options.listID == APP.gameState.watchListID ? true : false;
			
			this.model = new MovieListModel(this.view, { listID: this.listID, userID: this.userID, sectionID: this.sectionID });

            return this;
        },
        render: function(callback) {
			var self = this,
				list = self.model.listID,
				userLists = APP.gameState,
				listUserID = this.model.userID;
			callback = callback || function() {};

			//load specific list
			if(list) {
				self.model.getListData(function(list) {
                    self.loadMore = list.length < 50 ? false : true; // if the list is shorter than 50 we don't need to load more
                    
                    if(self.ownQueue) {
                        if(APP.queueFilter) { // If coming from lobby or view recs or play all apply the filter
                            list = list.sort(self.sortFunction(APP.queueFilter));
                            self.filter = APP.queueFilter;
                            APP.queueFilter = null;
                        }
                    }

                    self.list = list;
					var listItems = self.ownQueue ? list.slice(0, 50) : list, 
                        html = APP.load("listRow", { items: listItems, userLists: userLists, ownQueue: self.ownQueue }),
						title = list.listName ? list.listName : list[0].listName;

					self.$el.html(html);

		            if (!self.header) {
                        self.header = new HeaderView({
                            title: "Fabric",
                            filterButton: self.ownQueue ? true : false
                        });
                    }

                    self.$el.prepend(self.header.el);
                    $("#wrapper").html(self.$el);

                    if(self.filter) {
                        $(".filter.check").removeClass("check");
                        $("#"+ self.filter).addClass("check"); 
                    }

                    //If viewing own list on 3.5' screen adjust the height to 
                    // account for search and loading spinner
                    if( $("#list-search-form").length && $(window).height() <= 480 ) {
                        $("#list-row-wrapper").height(429);
                    }
                    self.bindEvents();
					callback();
				});
			} else {
	            self.model.getLists(function(standardLists, customLists) {
	                var html = APP.load("lists", {
	                	standardLists: standardLists, 
	                	customLists: customLists,
	                	userID: listUserID
	                });

                    self.$el.html(html);

                    if(!self.header) {
                        self.header = new HeaderView({
                            title: "Lists",
                            home: false
                        });
                    }

					$("#wrapper").html($(html).prepend(self.header.el));

                    var other = self.model.userID ? true : false;
		            UI.bindMovieRowEvents(other);
		            UI.initScroller($("#list-row-wrapper")[0]); 
	                callback();
	            });
        	}

        	return this;
        },
        sortFunction: function(property) {
            var sortOrder = 1,
                numberFilters = ["criticsScore", "totalCount", "Count"],
                dateFilters = ["releaseDate", "modified"];


            if(numberFilters.indexOf(property) !== -1) { //Show these in reverse order
                var numb = true; 
                sortOrder = -1; 
            } else if(dateFilters.indexOf(property) !== -1) {
                var date = true;
                sortOrder = -1;
            } 

            return function (a,b) {
                if(numb) {
                    var result = ( parseInt(a[property]) < parseInt(b[property]) ) ? -1 : ( parseInt(a[property]) > parseInt(b[property]) ) ? 1 : 0;
                } else if(date) {
                    var result = new Date(a[property].slice(0,10)) - new Date(b[property].slice(0,10));
                } else {
                    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                }
                return result * sortOrder;
            }
        },
        bindEvents: function() {
            var self = this;
            var sUpdate = $("#slide-search-form");

            $("#recommendation-filters div").fastClick(function(e){
                e.preventDefault();     e.stopPropagation();

                // seperate self.list into 2 seperate arrays of valid objects and non valid objects
                var validArr = [],
                    invalidArr = [],
                    filter = $(this).data("filter");

                self.list.forEach(function(item) {
                    if(item[filter] && item[filter] != "") {
                        validArr.push(item);
                    } else {
                        invalidArr.push(item);
                    }
                });

                var sortedList = validArr.sort(self.sortFunction(filter)); //Sort list by filter selected
                var newSortedList = sortedList.concat(invalidArr);
                var html = APP.load("moreMovies", { items: newSortedList.slice(0, 50), userLists: APP.gameState });

                $(".filter.check").removeClass("check");
                $(this).addClass("check");

                self.filter = filter;
                UI.scroller.scrollTo(0,0,0);    

                $("#list-movies").html(html);     //Clean out list scroller div and add new list

                UI.scroller.refresh();

                self.list = newSortedList;             //Save sorted list as current list for progressive load
                self.listPosition = 50;             //Set list position to 50 for progressive load

                $("#recommendation-filters, #screen").toggleClass("show");
                self.bindEvents();

                return false;
            }); 

            sUpdate.on("input", function(e) {
                var title = $(this).val();
                $("#close-search-drop").show();

                if(title.length > 2) {
                    Api.findMoviesLikeTitle($(this).val(), function(response) {
                        self.moviesLike = response.data;
                        if(response.data.length > 0) {
                            var html = APP.load("feedSearchResults", { data: response.data });

                            $("#status-drop div").html(html);
                            $("#status-drop").addClass("on");

                            $("#status-drop .result").unbind("click").click(function(e) {
                                e.preventDefault();

                                var movie = self.moviesLike[$(this).data("arrpos")];
                                if(!movie) {
                                    return false;
                                }

                                if($(".blank-message").length) { $(".blank-message").hide(); }
                                if($(".blank-instructions").length) { $(".blank-instructions").hide(); }

                                sUpdate.blur();
                                Api.setMovieToFabricList($(this).data("publishedid"), self.listID, true);

                                var html = APP.load("listRowItem", { movie: movie, userLists: APP.gameState });

                                var a = ""
                                if(self.listID == APP.gameState.favoriteListID) {
                                    Api.createFeed("favorite", $(this).data("movieid"));
                                    a = "favorite";
                                }
                                if(self.listID == APP.gameState.watchListID) {
                                    Api.createFeed("queue", $(this).data("movieid"));
                                    a = "queue";
                                }
                                if(self.listID == APP.gameState.seenListID) {
                                    a = "seen";
                                }

                                $("#list-movies").prepend(html).children().first().addClass("fade-in").find("." + a + "-button").removeClass("off");
                                $("#status-drop").removeClass("on");

                                $("#status-drop div").html("");
                                $("#status-drop").removeClass("on");

                                // remove scroller from it
                                UI.deallocScroller();
                                UI.initScroller($("#list-row-wrapper")[0]);
                                UI.bindMovieRowEvents();

                                return false;
                            });

                            UI.deallocScroller();
                            UI.initScroller($("#status-drop")[0]);

                            setTimeout(function() {
                                if(UI.scroller) {
                                    UI.scroller.on('scrollStart', function () {
                                        sUpdate.blur();
                                    });
                                }
                            }, 500);
                        } else {
                            // hide the thing
                            $("#status-drop div").html("");
                            $("#status-drop").removeClass("on");
                            // remove scroller from it
                            UI.deallocScroller();
                            UI.initScroller($("#list-row-wrapper")[0]);
                        }
                    });
                } else if(title.length === 0) {

                    $("#close-search-drop").hide();

                } else if($("#status-drop").hasClass("on")) {
                    // hide the thing
                    $("#status-drop div").html("");
                    $("#status-drop").removeClass("on");
                    // remove scroller from it
                    UI.deallocScroller();
                    UI.initScroller($("#list-row-wrapper")[0]);
                }
            });

            /*sUpdate.focusout(function() {
             UI.scroller.scrollTo(0,0,400);
             $("#close-status-drop").hide();
             });*/

            $(document).on("keydown", function(e) {
                if(e.keyCode == 13) { sUpdate.blur(); }
            });

            $("#close-search-drop").fastClick(function(e) {
                e.preventDefault();
                e.stopPropagation();

                sUpdate.val("");
                $("#close-search-drop").hide();
                $("#status-drop div").html("");
                $("#status-drop").removeClass("on");

                UI.deallocScroller(); // self.setTimeouts();
                UI.initScroller($("#list-row-wrapper")[0]);
                // UI.scroller.scrollTo(0,0,400);

                return false;
            });

            $("#fabric-player-button").click(function() {
                Backbone.history.navigate("fabricPlayer/" + self.model.listID, true);
            });

            UI.initScroller($("#list-row-wrapper")[0]);
            UI.bindMovieRowEvents();


            $("#fabric-player-button, .list-movie-image, .recommended-by").click(function(){
                APP.queueFilter = self.filter;
            });

            setTimeout(function() {
                UI.scroller.refresh();
                UI.scroller.on("scrollEnd", function() {
                    if(Math.abs(this.maxScrollY) - Math.abs(this.y) < 10 && self.loadMore) { //We only load more if loadMore is true

                        if(self.ownQueue){      // IF Watchlist progressive load differently
                            var moreMovies = APP.load("moreMovies", { items: self.list.slice(self.listPosition, self.listPosition += 50), userLists: APP.gameState });
                            // $(".load-more-spinner").hide(); // hide old spinner before the new one is on the page
                            $(".load-more-spinner").hide();
                            $("#list-movies").append(moreMovies);
                            UI.scroller.refresh();
                            UI.bindMovieRowEvents();
                        } else {
                            $(".load-more-spinner").css({"visibility": "visible"});
                            self.model.getMoreMovies(function(listPart) {
                                var moreMovies = APP.load("moreMovies", { items: listPart, userLists: APP.gameState });
                                $(".load-more-spinner").hide(); // hide old spinner before the new one is on the page
                                $("#list-movies").append(moreMovies);
                                UI.scroller.refresh();
                                UI.bindMovieRowEvents();
                                self.model.count += self.model.limit;
                                setTimeout(function() { UI.scroller.refresh() }, 1000); // we refresh again in 1 second
                                if(listPart.length < self.model.limit) {
                                    self.loadMore = false; // Set Load more to false so we don't keep hitting the api
                                    $(".load-more-spinner").css({"background-image": "none"}).html("End of List");
                                }
                            });
                        }
                    }
                });
            }, 1000);
        },
        dealloc: function() {
            var self = this;
		}
    });