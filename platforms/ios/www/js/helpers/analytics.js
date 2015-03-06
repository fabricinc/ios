//if (Util.isMobile()) {
        //var config = window.plugins.Config; //require('config');
        var Analytics = {
            catEventEnabled: true,
            flurryKey: "D7XRX8QYNVQP72GX6KD4", //TODO: get this to come from config.json.js

            //TODO: Update flurry Key from Dev to Production
            init: function() {
				flurry = window.plugins.flurry;
                if (!flurry) { return false; }

                if (Util.isMobile() == true) {
                    flurry.startSession(this.flurryKey, this.analyticsSessionSuccess, this.analyticsSessionFailure);
                    //flurry.setEventLoggingEnabled("Yes", analyticsSessionSuccess, analyticsSessionFailure);
                }
                // add non-mobile analytics

            },

            event: function(eventString) {
                if (!flurry) return false;

                Util.log("flurry event: " + eventString);

                if (Util.isMobile() == true) {
                    flurry.logEvent(eventString, this.analyticsEventSuccess, this.analyticsEventFailure);
                }
                // add non-mobile analytics
            },

            eventAndParams: function(eventString, params) {
                if (!flurry) return false;

                // Assuming we're only getting screen: null from from invocations with the player (no .header-text html)
                for (var key in params) {
                    if (key === 'screen' && params[key] === null)
                        params.screen = "player";
                }

                params = JSON.stringify(params);

                Util.log("Flurry event & params: " + eventString + ": " + params);

				// TODO: flurry logEvent functions are causing errors right now, fix them later 
                if (Util.isMobile() == true) {
                    flurry.logEventWithParameters(eventString, params, this.analyticsEventSuccess, this.analyticsEventFailure);
                }

                // add non-mobile analytics
            },

            // Can be sent the 'options' object from Api.dispatcher for certain tasks.
            dispatcher: function(params) {
                var listParams = { name: "List Name", listID: params.listID }; // APP.MovieListController.listName TODO: fill APP.MovieListController.listName

                switch (params.action) {
                    case "getList":
                        this.eventAndParams("List viewed", listParams);
                        break;
                    case "setMovieToList":
                        this.logListSet(params);
                        break;
                    case "createList":
                        this.logListCreate(params);
                        break;
                    case "setListSortOrder":
                        this.eventAndParams("List sort order set", listParams);
                        break;
                    case "search":
                        this.logCategorySearch(params);
                        break;
                    case "searchLists":
                        this.logListSearch(params);
                        break;
                }
            },

            /*logCategorySelected: function(params) {
                if (!this.catEventEnabled) {
                    Util.log("log category skipped");
                    this.catEventEnabled = true;
                    return false;
                }

                var options = {
                        action: "getCategoryName",
                        categoryID: params.categoryID,
                        listID: params.listID ? params.listID : ""
                    },
                    self = this,
                    previousPage = ""; //APP.History.pages[APP.History.pages.length -2];

                Api.dispatcher(options, function(response) {
                    options = {
                        category: response.name,
                        categoryID: params.categoryID,
                        listID: params.listID,
                        screen: previousPage ? previousPage : ""
                    }
                    self.eventAndParams("Category or list selected", options)
                })
            },*/

            logListSet: function(params) {
                var options = {
                        action: "getListType",
                        listID: params.listID
                    },
                    self = this;

                Api.dispatcher(options, function(response) {
                    var type = ["", "History", "Favorites", "Watchlist", "Seen", "Custom list"], // List types start with 1
                        options = {
                            publishedID: params.moviePublishedID,
                            listID: params.listID,
                            screen: $(".header-text").html()
                        },
                        event = type[response.typeID];

                    // History includes percent of movie watched.
                    if (response.typeID == 1) options.percentWatched = params.moviePercentWatched;

                    // Now we need the movie name.
                    var opts = {
                        action: "getMovieNameFromPublishedID",
                        moviePublishedID: params.moviePublishedID
                    }

                    Api.dispatcher(opts, function(response) {
                        options.name = response.name;
                        self.eventAndParams(event + " set", options);
                    });


                })
            },

            logListCreate: function(params) {
                var options = {
                    name: params.listName,
                    publishedID: params.moviePublishedID,
                    listID: params.returnedID
                }
                this.eventAndParams("List created", options);

                if ($("#lists-menu").length > 0) {
                    options = {
                        publishedID: params.moviePublishedID,
                        screen: $(".header-text").html(),
                        listID: params.returnedID
                    }
                    this.eventAndParams("Custom list set", options);
                }

            },

            logTrailerPlayed: function() { // Flurry event.
                if ($("#player").length > 0) {
                    var options = {
                        screen: "Movie Trailer", //APP.History.getLast(), TODO: Analytics
                        movie: $("nav h1").html(),
                        percentWatched: APP.Player.getPercentWatched()
                    };

                    Analytics.eventAndParams("Trailer Played", options);
                }
            },

            logCategorySearch: function(params) {
                this.eventAndParams("Category search", {searchString: params.searchString});
            },

            logListSearch: function(params) {
                this.eventAndParams("List search", {searchString: params.searchString});
            },

            logSkipMovie: function(type, isSimplePlayer) {
                var currentMovie = (APP.currentMovie === -1 ? 0 : APP.currentMovie);
                var movie = Model.movies[currentMovie],
                    options = {
                        movie: movie.title,
                        publishedID: movie.publishedid
                    },
                    getCatOpts = {
                        action: "getCategoryName",
                        categoryID: APP.currentCategory
                    },
                    event = "",
                    self = this;

                if (!isSimplePlayer) {
                    options.categoryID = APP.currentCategory;
                    options.numberInSequence = currentMovie + 1;
                    options.percentWatched = APP.Player.getPercentWatched();
                }

                // Get the category name and do the deed.
                Api.dispatcher(getCatOpts, function(result) {
                    options.category = result.name;
                    if (type === 'ended') {
                        if (isSimplePlayer) {
                            event = "Non-game trailer played through";
                        } else {
                            event = "Game trailer played through";
                        }
                    } else if (type === 'exit') {
                        if (isSimplePlayer) {
                            event = "Non-game trailer exited";
                        } else {
                            event = "Game trailer exited";
                        }
                    } else {
                        event = "Trailer skipped";
                    }

                    self.eventAndParams(event, options);
                });
            },

            logTrailerEnded: function(isSimplePlayer) {
                //this.logSkipMovie('ended', isSimplePlayer);
            },

            logPlayerExit: function() {
                this.logSkipMovie('exit');
            },

            logRoundCompleteEvent: function(movieNumber) {// Flurry event
                var options = {
                        action: "getCategoryName",
                        categoryID: APP.currentCategory
                    },
                    self = this;

                Api.dispatcher(options, function(response) {
                    options = {
                        moviesPlayed: movieNumber,
                        category: response.name,
                        categoryID: APP.currentCategory
                    };
                    self.eventAndParams("Round Complete", options);
                });

            },

            logFacebookTrailerPost: function(movie) {
                var options = {
                    action: "getCategoryName",
                    categoryID: APP.currentCategory
                }, self = this;
                Api.dispatcher(options, function(result) {
                    var options = {
                        movie: movie.title,
                        publishedID: movie.publishedid,
                        screen: $(".header-text").html(),
                        category: result.name,
                        categoryID: APP.currentCategory
                    };
                    self.eventAndParams("Facebook post: trailer", options);
                });
            },

            logQuestionAnswered: function(qID, isCorrect, bonusMultiplier, categoryID, listID) {
                if (!APP.currentCategoryName) {
                    Api.dispatcher({ action: "getCategoryName", categoryID: categoryID, listID: listID }, function(result) {
                        APP.currentCategoryName = result.name;
                        setIt();
                    });
                } else {
                    setIt();
                }

                function setIt() {
                    var options = {
                        time: document.getElementById('timer-counter').innerHTML,
                        correct: isCorrect,
                        movie: Model.movies[APP.currentMovie].title,
                        publishedID: Model.movies[APP.currentMovie].publishedID,
                        category: APP.currentCategoryName,
                        categoryID: categoryID,
                        bonusMultipliers: bonusMultiplier,
                        questionID: qID
                    };
                    Analytics.eventAndParams("Question answered", options);
                };
            },

            logQuestionsEnded: function() {
                var categoryID = APP.currentCategory,
                    options = {
                        action: "getCategoryName",
                        categoryID: categoryID
                    }, self = this;

                Api.dispatcher(options, function(result) {
                    var movie = Model.movies[APP.currentMovie],
                        options = {
                            movie: movie.title,
                            publishedID: movie.publishedid,
                            category: result.name,
                            categoryID: categoryID
                        };
                    self.eventAndParams("All questions played", options);
                });

            },

            logShoppingLinkSelected: function(vendor, publishedID) {

                var options = {
                    action: "getMovieNameFromPublishedID",
                    moviePublishedID: publishedID
                }

                Api.dispatcher(options, function(response) {
                    options = {
                        name: response.name,
                        vendor: vendor,
                        publishedID: publishedID
                    }

                    Analytics.eventAndParams("Shopping link selected", options);
                })
            },
            logMovieLobby: function(publishedID) {
                var options = {
                    action: "getMovieNameFromPublishedID",
                    moviePublishedID: publishedID
                };

                Api.dispatcher(options, function(response) {
                    options = {
                        screen: $(".header-text").html(),
                        publishedID: publishedID,
                        movie: response.name
                    };

                    Analytics.eventAndParams("Movie lobby", options);

                });
            },

            // Callback functions (placeholders)
            analyticsEventSuccess: function() {
                Util.log("Logged flurry success event");
            },

            analyticsEventFailure: function() {
                Util.log("Logged flurry failure event");
            },

            analyticsSessionSuccess: function() {
                Util.log("Successfully started flurry session");
            },

            analyticsSessionFailure: function() {
                Util.log("Failed to start flurry session");
            }

        }
//    } else {
//        var Analytics = null;
//    }