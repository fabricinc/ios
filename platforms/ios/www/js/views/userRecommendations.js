var UserRecommendationsModel = Backbone.Model.extend({
		view: null,
        list: null,
        listID: null,
        filter: null,
        listPosition: 50,

		initialize: function(options) {
            this.listID = options.listID;
        },
        fetchData: function(callback) {
            var self = this; 

            Api.getUserRecommendations(this.listID, function(response){
                if(response.success){
                    self.list = response.data; 
                    callback(response.data);
                }
            });
        },
        events: function() {
            var self = this;

            $(".trailer-still, .movie-poster").click(function(){
                if(!$(this).parent().hasClass("play-button")){
                    var ID = $(this).closest(".feed-item").data("movie-id");
                    Backbone.history.navigate("movieLobby/"+ ID, true);
                }
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
            $(".movie-poster").click(function(){
                var ID = $(this).closest(".feed-item").data("movie-id");

                Backbone.history.navigate("movieLobby/"+ ID, true);
            });
            $(".feed-buttons span").click(function(){
                var publishedID = $(this).parent().data("movie-published-id"),
                    movieID = $(this).parent().data("movie-id");

                if($(this).hasClass("info-button")){
                    Backbone.history.navigate("movieLobby/" + movieID, true);
                } else {
                    var set = $(this).hasClass("on") ? false : true;
                    Api.setMovieToFabricList(publishedID, APP.gameState.watchListID, set);
                    $(this).toggleClass("on");
                }
            });
            $(".rec span").click(function(){
                var publishedID = $(this).data("movie-published-id");
                Backbone.history.navigate("recommendedByList/"+ publishedID, true);
            });
            $("#fabric-player-button").click(function() {
                Backbone.history.navigate("fabricPlayerRec/" + self.listID, true);
            });
            $("#recommendation-filters div").fastClick(function(e){
                e.preventDefault();     e.stopPropagation();

                var filter = $(this).data("filter"),
                    sortedList = self.list.sort(self.sortFunction(filter)), //Sort list by filter selected
                    html = APP.load("recItems", { movies: sortedList.slice(0, 50) });

                $(".filter.check").removeClass("check");
                $(this).addClass("check");

                self.filter = filter;
                UI.scroller.scrollTo(0,0,0);

                $("#list-scroller").html(html);     //Clean out list scroller div and add new list

                UI.scroller.refresh();

                self.list = sortedList;             //Save sorted list as current list for progressive load
                self.listPosition = 50;              //Set list position to 0 for progressive load

                $("#recommendation-filters, #screen").toggleClass("show");
                self.events();

                return false;
            }); 
        },
        sortFunction: function(property){
            var sortOrder = 1;

            if(property === "criticsScore" || property === "friendRecs" || property === "totalCount"){      //Show these in reverse order 
                var numb = true; 
                sortOrder = -1; 
            } else if(property === "theatricalReleaseDate"){
                var date = true;
                sortOrder = -1; 
            }

            return function (a,b) {
                if(numb){
                    var result = ( parseInt(a[property]) < parseInt(b[property]) ) ? -1 : ( parseInt(a[property]) > parseInt(b[property]) ) ? 1 : 0;
                } else if(date) {
                    var result = new Date(a[property]) - new Date(b[property]);
                } else {
                    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                }
                return result * sortOrder;
            }
        }
	});
	
	var UserRecommendationsView = Backbone.View.extend({
        id: "recommended-list",
		model: null,
		header: null,
        listID: null,
        

        initialize: function(options, callback){
            callback = callback || function() {};

            this.model = new UserRecommendationsModel(options);

            return this;
        },
        render: function(callback){
			var self = this;
            callback = callback || function() {};
            
            self.model.fetchData(function(list){

                var sortList = APP.recFilter ? list.sort(self.model.sortFunction(APP.recFilter)) : list,
                    html = APP.load("userRecs", { movies: sortList.slice(0, 50) });

                self.$el.html(html);

                if (!self.header) {
                    self.header = new HeaderView({
                        title: "Recommended",
                        filterButton: true
                    });
                    self.$el.prepend(self.header.el);
                }

                $("#wrapper").html(self.$el);

                if(Util.isIPad()) { $('.js-masonry').masonry(); }

                if(APP.recFilter){ 
                    $(".filter.check").removeClass("check");
                    $("#"+ APP.recFilter).addClass("check"); 
                }


                UI.initScroller($("#list-items.scroller-settings")[0]);
                self.model.events();
                Util.trailerPlayer();
                setTimeout(function() {
                    UI.scroller.refresh();
                    UI.scroller.on("scrollEnd", function() {
                        if(Math.abs(this.maxScrollY) - Math.abs(this.y) < 10) { //We only load more if loadMore is true
                            // $(".load-more-spinner").css({"visibility": "visible"});

                            var moreMovies = APP.load("recItems", { movies: list.slice(self.model.listPosition, self.model.listPosition += 50) });
                            // $(".load-more-spinner").hide(); // hide old spinner before the new one is on the page
                            $("#list-scroller").append(moreMovies);
                            UI.scroller.refresh();
                            self.model.events();

                            if(Util.isIPad()) { $('.js-masonry').masonry(); }

                            // self.count += self.limit;
                            setTimeout(function() { UI.scroller.refresh() }, 1000); // we refresh again in 1 second
                        }
                    });
                }, 1000);

                callback();
            });

        },
        dealloc: function(){
            var self = this;

            if(self.model.filter) { APP.recFilter = self.model.filter; }
        }
    });