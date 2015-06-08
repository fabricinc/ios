var Api = {};

Api.queue = {};
Api.url = API_URL;
Api.surl = API_SURL;
Api.connected = true;
Api.appSettings = {
    timeout: 10000,
    apiTimeout: 5000,
    unseenInterval: 10000,
    maskTimeout: 30,
    cdn: "http://d3j6zu3ol1gh5f.cloudfront.net",
    shareLocation: "http://www.trailerpop.com/single_pages",
    discoveryLimit: 50,
    feedLimit: 10,
    wantToLimit: 10
};
Api.levelSettings = {};
Api.response = {};
// api responses we do not cache
Api.skipCache = {
    loadFBLikes: true,
    getUserMatches: true,
    getUnseenActivity: true,
    getSwipeCategoryData: true,
    getFabricCategoryData: true
};
// api responses that do not trigger offline mode if no response is received
Api.skipData = {
    loadFBLikes: true,
    getUnseenActivity: true
};

Api.queueRequest = function(xhr) {
    var pointer = 'index' + Object.keys(this.queue).length,
        obj = {
            index: pointer,
            xhr: xhr
        };
    this.queue[pointer] = obj;
    return pointer;
}
Api.unqueueRequest = function(index) {
    this.queue[index] = undefined;
}
Api.abortAll = function(callback) {
    callback = callback || function() { };
    this.queueAborted = true;
    for (var index in Api.queue) {
        var request = Api.queue[index];
        if(request && typeof request.xhr.abort === "function") {
            // Util.log("aborting request index: " + request.index);
            // request.xhr.abort(); // Uh oh...  can't abort jsonp requests because response wrapped as function
        }
    }
    this.queueAborted = false;
    callback();
}
Api.error = function(error, options) {
    Util.log("Error performing action: " + options.action + ".  Result: " + JSON.stringify(error));
    options = {
        action: "logError",
        status: error.status,
        text: error.statusText,
        view: "",
        client: navigator.userAgent,
        requestOptions: JSON.stringify(options)
    }
    this.dispatcher(options);
    if(!$(".player")) { UI.backButton(); }
}
Api.getJSON = function(scriptName, options, callback) {
    var self = this;
    callback = callback || function() { };
    $.ajax({
        url: Api.url + scriptName,
        dataType: 'jsonp',
        data: options,
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }
            callback(response);
        },
        error: function(jqXhr, status, error) {
            Util.log(jqXhr.status);
        },
        statusCode: {
            403: function() { // Forbidden. Prolly an expired session.
                APP.dispatcher('home');
            }
        }
    });
}
Api.checkForErrorResponse = function(response) {
    if(response && response.error) {
        if(response.error.code == 403) {
            APP.dispatcher("login");
        }
        return true;
    } else {
        return false;
    }
}
Api.dispatcher = function(options, callback) {
    var self = this;
    callback = callback || function() { };
    Util.log(JSON.stringify(options));

    var xhr = $.getJSON(Api.url + 'api.php?' + 'callback=?', options, function(response) {
        Util.log(options.action + ": " + JSON.stringify(response));
    }).success(function(response) {
            self.unqueueRequest(index);
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }

            if(self.queueAborted) {
                Util.log("requested aborted");
            } else {
                callback(response);
                if(response.ID) { options.returnedID = response.ID; }
                if(Analytics) { Analytics.dispatcher(options); }
            }
        })
        .error(function(response) {
            self.unqueueRequest(index);
            if(options.action !== "logError") { self.error(response, options); } // Would overflow stack.
        });

    // Will run before async request.
    var index = this.queueRequest(xhr);
}
Api.recoverPassword = function(email, callback) {
    var FAIL = 'There was a problem contacting our server.  If you see this message repeatedly, please contact Fabric support.',
        userAttributeArray = {
            email:  email
        },
        self = this;
    callback = callback || function() { };
    $.ajax({
        url: Api.url + 'recoverPassword.php',
        dataType: 'jsonp',
        data: userAttributeArray,
        success: function(response) {
            callback(response);
        },
        error: function(e) {
            Util.alert(FAIL, "Password Recovery Error");
            Util.log("error recover password: " + e);
        }
    });
}
Api.createRegistration = function(username, emailAddress, password, facebookID, friendList, callback) {
    var FAIL = "There server couldn't process your registration. Please try again in a bit.",
        options = {
            uName: username,
            uPassword: password,
            uEmail: emailAddress,
            facebook_id: facebookID,
            friendlist: friendList,
            settings: {
                hlsSupported: Player.isHlsSupported()
            }
        },
        self = this;
    callback = callback || function() {};
    $.ajax({
        url: Api.surl + 'createUser.php',
        dataType: 'jsonp',
        data: options,
        type: "POST",
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }

            callback(response);
        },
        error : function(e) {
            Util.alert(FAIL, "Registration Failure");
            Util.log("error in registration: " + JSON.stringify(e));
        }
    });
}
Api.createNewRegistration = function(name, email, password, facebookID, friendlist, birthday, gender, callback) {
    callback = callback || function() { };
    var FAIL = "There server couldn't process your registration. Please try again in a bit.",
        options = {
            uName: name,
            uPassword: password,
            uEmail: email,
            age: Math.abs(new Date(Date.now() - new Date(birthday).getTime()).getUTCFullYear() - 1970) || null,
            gender: gender,
            deviceUUID: APP.token,
            devicePlatform: "ios",
            settings: {
                hlsSupported: Player.isHlsSupported()
            }
        },
        self = this;

    if(facebookID) { options.facebook_id = facebookID; }
    if(friendlist) { options.friendlist = friendlist; }

    $.ajax({
        url: Api.surl + 'createFabricUser.php',
        dataType: 'jsonp',
        data: options,
        type: "POST",
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }
            callback(response);
        },
        error : function(e) {
            Util.alert(FAIL, "Registration Failure");
            Util.log("error in registration: " + JSON.stringify(e));
        }
    });
}
Api.checkLogin = function(username, password, facebookData, callback) {

    var age = null;
    if(facebookData && facebookData.birthday) {
        var age = Math.abs(new Date(Date.now() - new Date(facebookData.birthday.toString()).getTime()).getUTCFullYear() - 1970);
    }
    var options = {
            uName: username,
            uPassword: password,
            settings: {
                hlsSupported: Player.isHlsSupported()
            },
            devicePlatform: "ios",
            deviceUUID: APP.token
        },
        self = this;
        
    // we might be trying to log in via facebook
    if(facebookData) {
        options.facebookID = facebookData.id;
        options.accessToken = facebookData.accessToken;
        if(facebookData.gender) { options.gender = facebookData.gender; }
        if(age) { options.age = age; }
    }

    
    var FAIL = 'There was a problem connecting to the server. Please try again!';
    $.ajax({
        url: Api.surl + 'checkLogin.php',
        dataType: 'jsonp',
        data: options,
        type: "POST",
        success: function(response) {
            Util.log("Api.checkLogin SUCCESS");
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }

            callback(response, facebookData);
        },
        error : function(e) {
            Util.alert(FAIL, "Login Error");
            Util.log("Error in authorization: " + JSON.stringify(e));
            APP.dispatcher('home');
        }
    });
}
Api.getGameState = function(async, callback) {
    callback = callback || function() {};
    var options = {
        "iPad": Util.isTablet()
    };

    var req = $.ajax({
        url: Api.url + 'getGameState.php',
        data: options,
        async: async,
        dataType: "jsonp",
        headers: { "cache-control": "no-cache" },
        success: function(response) {
            callback(response);
        },
        error: function(response) {
            Util.alert("Server error: failed to retrieve game state.", "Game State Error");
            APP.dispatcher("home");
        }
    });
}
Api.getFabricState = function(callback) {
    callback = callback || function() {};
    var options = { "action": "getFabricState" };
    this.fetch(options, callback);
}
Api.setGameState = function(correct, totalQuestions) {
    var options = {
        "round_score": APP.score,
        "correct_answers": correct,
        "total_questions": totalQuestions,
        "rank": APP.rank,
        "category_id": APP.currentCategory
    };
}
Api.getSelectMovie = function(categoryID, start, limit, movieID, callback) {
    callback = callback || function() {};
    if(!start) { start = 0; }
    if(!limit) { limit = 10; }

    var options = {
        cate_id: categoryID,
        start: start,
        limit: limit,
        movie_id: movieID
    };

    Api.getJSON(Api.url + "getMovieForCat.php", options, function(response){
        callback(response);
    });
}
Api.getNextMovie = function(options, ref, callback) {
    callback = callback || function() {};
    options.bitRate = Player.bitRate;
    options.hlsSupported = Player.hlsSupported;

    Api.getJSON("getNextMovie.php", options, function(data) {
        callback(data, false, options.movieID, options.categoryID, ref);
    });
}
Api.getLeaderboard = function(friendlist, callback) {
    callback = callback || function() {};
    var options = {
        "friendlist": friendlist //empty |false for mixed results [fb and tp users]
    };

    Api.getJSON("getLeaderboardByTotalScore.php", options, function(response) {
        callback(response);
    });
}
Api.getLeaderboardInterval = function(interval, friendlist, callback) {
    callback = callback || function() {};
    var options = {
        "interval": interval,
        "friendlist": friendlist //empty|false for mixed results [fb and tp users]
    };

    Api.getJSON("getLeaderboardByInterval.php", options, function(response) {
        callback(response);
    });
}
Api.getMovieById = function(opts, ref, callback) {
    callback = callback || function() {};
    var options = {
        published_id: opts.movieID,
        bit_rate: Util.getBitRate(),
        hlsSupported: Player.isHlsSupported()
    };

    Api.getJSON("getMovieById.php", options, function(response) {
        callback(response, opts.isSimplePlayer, options.published_id, null, ref);
    });
}
Api.setMovieHistory = function(movieID, percentWatched) {
    var options = {
        action: "setMovieToList",
        moviePublishedID: movieID,
        moviePercentWatched: percentWatched,
        listID: APP.gameState.historyListID
    };
    this.dispatcher(options);
}
Api.getWelcomeCategories = function(callback){
    callback = callback || function() {};
    var options = {
        action: "getWelcomeCategories"
    };

    this.dispatcher(options, callback);
}
Api.getShoppingLinks = function(publishedID, callback) {
    callback = callback || function() {};
    var options = {
        moviePublishedID: publishedID,
        action: "getShoppingLinks"
    }
    this.dispatcher(options, callback);
}
Api.getCategoryList = function(opts, callback) {
    Api.getJSON("getHomeCategories.php", opts, function(response) {
        Util.log(JSON.stringify(response));
        callback(response);
        if(Analytics) { Analytics.event("Main screen selected"); }
    });
}

Api.getLocalizedStrings = function() {
    return Strings;
}
Api.getProducersClub = function(callback) {
    callback = callback || function() {};
    Api.getJSON("getProducer.php", false, callback);
}
Api.setEmailPreferences = function() {
    var url = Api.url + "setEmailPreferences.php",
        self = this;

    $.ajax({
        url: url,
        dataType: "jsonp",
        data: {
            "promotionalEmails": localStorage.promotionalEmails,
            "movieReleaseEmails": localStorage.movieReleaseEmails
        },
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }
        },
        error: function(e) {
            Util.log('setMovieHistory error: ' + e);
        }
    });
}
Api.getEmailPreferences =  function(callback) {
    callback = callback || function() {};
    var url = "getEmailPreferences.php";

    Api.getJSON(url, {}, function(data) {
        callback(data);
    });
}
Api.getInterstitialContent = function(callback) {
    callback = callback || function() {};
    var url = "getInterstitial.php?callback=?";

    Api.getJSON(url, {}, function(response) {
        // data.success = false; // FOR TESTING FALSE CONDITION
        Util.log("interstitialContent: " + JSON.stringify(response)) ;
        callback(response);
    });
}
// TODO: Legacy code
Api.setAnswer = function(movieID, questionID, points, callback) {
    callback = callback || function() {};
    var options = {
            "category_id": APP.currentCategory,
            "movie_id": movieID,
            "question_id": questionID,
            "points":points
        },
        self = this;

    $.ajax({
        url: Api.url + 'submitAnswer.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }
            if(callback) { callback(response); }

            // Flurry
            if(response.updatedRank) {
                if(Analytics) { Analytics.eventAndParams("Rank achieved", { rank: response.updatedRank }); }
            }
        },
        error: function() {
            Util.log("setAnswer server failure.");
        }
    });
}
Api.getPurchaseLinks = function(publishedID, callback) {
    callback = callback || function() {};
    var url = "getPurchaseLinks.php",
        options = {
            "publishedID": publishedID
        };

    if(Util.isMobile() || TESTING_SETTINGS) { options.isiOS = true; }

    Api.getJSON(url, options, function(data) {
        callback(data);
    });
}
// TODO: another weird function
Api.setListSortOrder = function(listID, sortOrder) {
    var options = {
        "action": "setListSortOrder",
        "listID": listID
    };

    $.ajax({
        url: Api.url + 'api.php?callback=?&' + sortOrder,
        data: options,
        dataType: "jsonp",
        success: function(response) {
            var error = self.checkForErrorResponse(response);
            if(error) { return false; }

            Util.log(JSON.stringify((response)));
            if(Analytics) { Analytics.dispatcher(options); }
        },
        error: function() {
            Util.log("setSortOrder server failure.");
        }
    });
}
Api.setListsListSortOrder = function(sortOrder) {
    var options = {
        "action": "setListsListSortOrder"
    };
    this.fetch(options);
}
// TODO: Another weird function
Api.setMovieSeen = function(moviePublishedID, seen, callback) {
    callback = callback || function() {};
    if(!APP || !APP.gameState || !APP.gameState.seenListID) { return false; }

    var options = {
        "action": "setMovieToFabricList",
        "listID": APP.gameState.seenListID,
        "moviePublishedID": moviePublishedID
    };

    if(!seen) { options.action = "unsetMovieFromList"; }

    Api.dispatcher(options, function(success) {
        if(!success.success) {
            Util.log("setMovieSeen failure");
            Util.log(success);
        } else {
            Util.log("setMovieSeen success");
        }
        callback(success.success);
    });
}
Api.getSwipeCategoryData = function(categoryID, listID, callback) {
    callback = callback || function() {};
    categoryID = categoryID || null;
    listID = listID || null;
    var options = {
        "action": "getSwipeCategoryData",
        "categoryID": categoryID,
        "listID": listID
    };
    this.fetch(options, callback);
}
Api.getRecSubList = function(listID, callback) {
    callback = callback || function() {};
    listID = listID || null;
    var options = {
        "action": "getRecommendationSubList",
        "listID": listID
    };
    
    this.fetch(options, callback);
}
Api.getUserRecommendations = function(listID, callback) {
    callback = callback || function() {};
    listID = listID || null;
    var options = {
        "action": "getUserRecommendations",
        "bitRate": Player.bitRate,
        "listID": listID
    };
    
    this.fetch(options, callback);
}
Api.categoryMovieDiscovered = function(movieID, categoryID, listID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "categoryMovieDiscovered",
        "categoryID": categoryID,
        "listID": listID,
        "movieID": movieID
    };
    this.fetch(options, callback);
}
Api.getCategoryListItems = function(id, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getCategoryListItems",
        "categoryListID": id.toString()
    };
    this.fetch(options, callback);
}
Api.getNextCategories = function(categoryID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getNextCategories",
        "categoryID": categoryID,
        "sectionID": APP.sectionID
    };
    this.fetch(options, callback);
}
// TODO: I don't see this being used, is it necessary?
Api.getRecommendedCategoryListItems = function(categoryID, listID, callback) {
    categoryID = categoryID || null;
    listID = listID || null;
    callback = callback || function() {};

    if(!categoryID && !listID) {
        Util.error("getRecommendedCategoryListItems requires either a categoryID or a listID");
        return false;
    }

    var options = {
            "action": "getRecommendedCategoryListItems",
            "categoryListID": 1,
            "categoryID": categoryID,
            "listID": listID
        },
        self  = this;

    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            callback(response.data);
        },
        error: function() {
        }
    });
}

Api.setMovieToList = function(moviePublishedID, listID, setter, callback) {
    if(typeof moviePublishedID == "string") { moviePublishedID = parseInt(moviePublishedID); }
    if(!moviePublishedID || !listID) {
        Util.log("Api.setMovieToList: params movieID or listID missing");
        return false;
    }
    if(typeof setter === 'undefined') { setter = true; }
    callback = callback || function() { };

    var options = {
        "listID": listID,
        "moviePublishedID": moviePublishedID
    };

    if(setter) { options.action = "setMovieToList"; }
    else { options.action = "unsetMovieFromList"; }

    Api.dispatcher(options, function(success) {
        if(!success.success) {
            Util.log("Api.setMovieToList Failure");
            Util.log(success);
            return false;
        } else {
            callback();
            return true;
        }
    });
}
Api.setMovieToFabricList = function(moviePublishedID, listID, setter, callback) {
    if(typeof moviePublishedID == "string") { moviePublishedID = parseInt(moviePublishedID); }
    if(!moviePublishedID || !listID) {
        Util.log("Api.setMovieToList: params movieID or listID missing");
        return false;
    }
    if(typeof setter === 'undefined') { setter = true; }
    callback = callback || function() { };



    var options = {
        "listID": listID,
        "moviePublishedID": moviePublishedID
    };

    if(setter) { options.action = "setMovieToFabricList"; }
    else { options.action = "unsetMovieFromList"; }

    Api.dispatcher(options, function(success) {
        if(!success.success) {
            Util.log("Api.setMovieToList Failure");
            return false;
        } else {
            callback();
            return true;
        }
    });
}
Api.getUnseenMessageCount = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getUnseenMessageCount"
    };
    this.fetch(options, callback);
}
Api.getConversations = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getConversations"
    };
    this.fetch(options, callback);
}
Api.getConversation = function(otherID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getConversation",
        "otherID": otherID
    };
    this.fetch(options, callback);
}
Api.sendMessage = function(otherID, message, callback) {
    callback = callback || function() { };
    var options = {
        "action": "sendMessage",
        "receiverID": otherID,
        "message": message
    };
    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            if(response.success) {
                Api.validateMessage(response.uuid, function(response2) {
                    if(response2.success) {
                        if(Analytics) { Analytics.event("Message sent"); }
                    }
                    callback(response2);
                });
            } else {
                // failed to insert message into DB
            }
        },
        error: function() {}
    });

}
Api.validateMessage = function(uuid, callback) {
    uuid = uuid || null;
    var options = {
        "action": "validateMessage",
        "uuid": uuid
    };
    this.fetch(options, callback);
}
Api.seenConversation = function(otherID) {
    var options = {
        "action": "seenConversation",
        "otherID": otherID
    };
    this.fetch(options);
}
Api.getMatchMe = function(moviePublishedID, listType, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getMatchMe",
        "moviePublishedID": moviePublishedID,
        "listType": listType
    };
    this.fetch(options, callback);
}
Api.getMovieData = function(movieID, moviePublishedID, callback) {
    movieID = movieID || null;
    moviePublishedID = moviePublishedID || null;
    callback = callback || function() {};
    var options = {
        "action": "getMovieData",
        "movieID": movieID,
        "moviePublishedID": moviePublishedID,
        "bitRate": Player.bitRate
    };
    this.fetch(options, callback);
}
Api.getMovieCommonUsers = function(moviePublishedID, callback) {
    moviePublishedID = moviePublishedID || null;
    callback = callback || function() {};
    var options = {
        "action": "getMovieCommonUsers",
        "moviePublishedID": moviePublishedID
    };
    this.fetch(options, callback);
}
Api.getRecommendationList = function(moviePublishedID, callback) {
    moviePublishedID = moviePublishedID || null;
    callback = callback || function() {};
    var options = {
        "action": "getRecommendationList",
        "moviePublishedID": moviePublishedID
    };
    this.fetch(options, callback);
}
Api.getUserProfile = function(userID, callback) {
    userID = userID || null;
    callback = callback || function() {};
    var options = {
        "action": "getUserProfile"
    };
    if(userID && userID != "") { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getDiscoveryFeed = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getDiscoveryFeed"
    };
    this.fetch(options, callback);
}
Api.getDiscoveryFeedPart = function(offset, limit, callback) {
    offset = offset || 0;
    limit = limit || 100;
    callback = callback || function() {};
    var options = {
        "action": "getDiscoveryFeed",
        "offset": offset,
        "limit": limit,
        "sectionID": APP.sectionID
    };
    this.fetch(options, callback);
}
Api.createFeed = function(type, objectID, data, callback) {
    callback = callback || function() {};
    data = data || null;
    var options = {
        "action": "createFeed",
        "type": type,
        "objectID": objectID,
        "sectionID": APP.sectionID
    };

    if(data) {
        options.data = data;
    }
    this.fetch(options, callback);
}
Api.followUser = function(userID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "followUser",
        "userID": userID
    };
    // TODO: add optional success function?
    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            if(Analytics) { Analytics.event("Follow set"); }
            mixpanel.track("Follow set");
            callback(response);
        },
        error: function() {
            Util.log("Oops! Something went wrong!");
        }
    });
}
Api.unFollowUser = function(userID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "unFollowUser",
        "userID": userID
    };
    this.fetch(options, callback);
}
Api.isFollowing = function(userID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "isFollowing",
        "userID": userID
    };
    this.fetch(options, callback);
}
Api.getLists = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getListsList"
    };
    if(userID) { options.userID = userID };

    this.fetch(options, function(lists) {
        // split the response into custom and standard lists
        var standardLists = lists.slice(0, 4);
        var customLists = lists.slice(4);

        // special fix to add proper uncapitalized name into the object since the PHP expression can not do this
        for(var i = 0; i < standardLists.length; i++) {
            standardLists[i]["classStr"] = standardLists[i].name.toLowerCase();
        }

        callback(standardLists, customLists);
    });
}
Api.getFeedComments = function(feedID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getFeedComments",
        "feedID": feedID
    };
    this.fetch(options, callback);
}
Api.getMovieComments = function(movieID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getMovieComments",
        "movieID": movieID
    };
    this.fetch(options, callback);
}
Api.createFeedComment = function(feedID, message, callback) {
    callback = callback || function() {};
    var options = {
        "action": "createFeedComment",
        "feedID": feedID,
        "message": message
    };
    this.fetch(options, callback);
}
Api.createMovieComment = function(movieID, message, callback) {
    callback = callback || function() {};
    var options = {
        "action": "createMovieComment",
        "movieID": movieID,
        "message": message
    };
    this.fetch(options, callback);
}
Api.likeFeed = function(feedID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "likeObject",
        "objectID": feedID,
        "objectType": "feed"
    };
    this.fetch(options, callback);
}
Api.getFollowers = function(userID, callback) {
    userID = userID || null;
    callback = callback || function() {};
    var options = {
        "action": "getFollowers"
    }
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getFollowing = function(userID, callback) {
    userID = userID || null;
    callback = callback || function() {};
    var options = {
        "action": "getFollowing"
    };
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getNotifications = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getNotifications"
    };
    this.fetch(options, callback);
}
Api.getUnseenNotificationsCount = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getUnseenNotificationsCount"
    };
    this.fetch(options, callback);
}
Api.notificationsSeen = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "notificationsSeen"
    };
    this.fetch(options, callback);
}
Api.welcomeCompleted = function(friendList, callback) {
    var facebookID = APP.gameState.facebookID || null;
    friendList = friendList || [];
    callback = callback || function() {};
    var options = {
        "action" : "welcomeCompleted",
        "name" : APP.gameState.uName,
        "facebookID" : facebookID
    };
    if(friendList) { options.friendList = friendList.join(); }
    this.fetch(options, callback);
}
Api.getLikes = function(objectType, objectID, callback) {
    callback = callback || function() {};
    objectType = objectType || null;
    objectID = objectID || null;
    var options = {
        "action": "getLikes",
        "objectType": objectType,
        "objectID": objectID
    };
    this.fetch(options, callback);
}
Api.categoryDiscovered = function(categoryID, callback) {
    categoryID = categoryID || null;
    callback = callback || function() {};
    var options = {
        "action": "categoryDiscovered",
        "categoryID": categoryID
    };
    this.fetch(options, callback);
}
Api.updateUserGeoData = function(pos, callback) {
    callback = callback || function() {};
    var self  = this;

    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;

    var options = {
        "latlng": lat.toString() + "," + lng.toString(),
        "sensor": true
    };

    // another special case here, taking care of the success handling on google api return
    $.ajax({
        url:  "http://maps.googleapis.com/maps/api/geocode/json?callback=?",
        data: options,
        success: function(response) {
            if(response.status == "OK" && response.results[0]) {
                var city, state, zip, country;
                city = state = zip = country = null;

                $.each(response.results[0].address_components, function(key, value) {
                    if(value.types[0] == "locality") {
                        city = value.long_name;
                    } else if(value.types[0] == "administrative_area_level_1") {
                        state = value.short_name;
                    } else if(value.types[0] == "postal_code") {
                        zip = value.short_name;
                    } else if(value.types[0] == "country") {
                        country = value.short_name;
                    }
                });

                var geoOpts = {
                    "action": "updateUserGeoData",
                    "lat": lat.toString(),
                    "lng": lng.toString(),
                    "city": city,
                    "state": state,
                    "zip": zip,
                    "country": country
                };

                $.ajax({
                    url: Api.url + 'api.php?callback=?',
                    data: geoOpts,
                    dataType: "jsonp",
                    success: function(response) {
                        callback(response);
                    },
                    error: function() {
                        Util.log("Oops! Something went wrong!");
                    }
                });
            }
        },
        error: function() {
            Util.log("Oops! Something went wrong!");
        }
    });
}
Api.getMatches = function(categoryID, callback) {
    categoryID = categoryID || null;
    callback = callback || function() {};
    var options = {
        "action": "getMatches",
        "categoryID": categoryID
    };
    this.fetch(options, callback);
}
Api.getTopThree = function(userID, callback) {
    userID = userID || null;
    callback = callback || function() {};
    var options = {
        "action": "getTopThree",
        "userID": userID
    };
    this.fetch(options, callback);
}
Api.getRecentListItems = function(userID, callback) {
    userID = userID || null;
    callback = callback || function() {};
    var options = {
        "action": "getRecentListItems",
        "userID": userID
    };
    this.fetch(options, callback);
}
Api.updateUserPref = function(preference, value, callback) {
    preference = preference || null;
    callback = callback || function() {};
    var options = {
        "action": "updateUserPref",
        "preference": preference,
        "value": value
    };

    // special case because of success function
    // depending on how often this happens I may add it as a parameter
    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            if (response.success) {
                APP.gameState[preference] = value;
            }
            callback(response);
        },
        error: function() {
            Util.log("Oops! Something went wrong!");
        }
    });
}
Api.updateOnboard = function(section, callback){
    section = section || null; 

    if(!section) { return; }
    
    var options = {
        action : "updateOnboard",
        section : section
    };

    APP.gameState[section] = "1";


    this.fetch(options, callback);
}
Api.updateUserInfo = function(data, callback) {
    data = data || null;
    callback = callback || function() {};

    if(!data) {
        callback({ "success": false });
        return false;
    }

    var options = {
        "action": "updateUserInfo",
        "data": data
    };
    // special case becayse of success function
    // depending on how often this happens I may add it as a parameter
    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        success: function(response) {
            callback(response);
        },
        error: function() {
            Util.log("Oops! Something went wrong!");
        }
    });
}
Api.getMeetup = function(eventID, callback) {
    eventID = eventID || null;
    callback = callback || function() {};
    var options = {
        "action": "getMeetup",
        "eventID": eventID
    };
    this.fetch(options, callback);
}
Api.getMeetups = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getMeetups"
    };
    this.fetch(options, callback);
}
Api.createMeetup = function(data, callback) {
    data = data || null;
    callback = callback || function() {};
    var options = {
        "action": "createMeetup",
        "data": JSON.stringify(data)
    };
    this.fetch(options, callback);
}
Api.updateMeetup = function(eventID, data, callback) {
    eventID = eventID || null;
    data = data || null;
    callback = callback || function() {};
    var options = {
        "action": "updateMeetup",
        "eventID": eventID,
        "data": JSON.stringify(data)
    };
    this.fetch(options, callback);
}
Api.inviteMeetupUsers = function(eventID, inviteList, callback) {
    eventID = eventID || null;
    inviteList = inviteList || null;
    callback = callback || function() {};
    var options = {
        "action": "inviteMeetupUsers",
        "eventID": eventID,
        "inviteList": inviteList
    };
    this.fetch(options, callback);
}
Api.isMeetupOwner = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "isMeetupOwner"
    };
    this.fetch(options, callback);
}
Api.messageMeetupAttendees = function(eventID, message, callback) {
    eventID = eventID || null;
    message = message || null;
    callback = callback || function() {};
    var options = {
        "action": "messageMeetupAttendees",
        "eventID": eventID,
        "message": message
    };
    this.fetch(options, callback);
}
Api.cancelMeetup = function(eventID, callback) {
    eventID = eventID || null;
    callback = callback || function() {};
    var options = {
        "action": "cancelMeetup",
        "eventID": eventID
    };
    this.fetch(options, callback);
}
Api.sendMeetupRequest = function(eventID, callback) {
    eventID = eventID || null;
    callback = callback || function() {};
    var options = {
        "action": "sendMeetupRequest",
        "eventID": eventID
    };
    this.fetch(options, callback);
}
Api.acceptMeetupRequest = function(eventID, otherID, callback) {
    eventID = eventID || null;
    otherID = otherID || null;
    callback = callback || function() {};
    var options = {
        "action": "acceptMeetupRequest",
        "eventID": eventID,
        "otherID": otherID
    };
    this.fetch(options, callback);
}
Api.acceptMeetupRequest = function(eventID, otherID, callback) {
    eventID = eventID || null;
    otherID = otherID || null;
    callback = callback || function() {};
    var options = {
        "action": "acceptMeetupRequest",
        "eventID": eventID,
        "otherID": otherID
    };
    this.fetch(options, callback);
}
Api.nearbyWantToSee = function(moviePublishedID, callback) {
    moviePublishedID = moviePublishedID || null;
    callback = callback || function() {};
    var options = {
        "action": "nearbyWantToSee",
        "moviePublishedID": moviePublishedID
    };
    this.fetch(options, callback);
}
Api.createMatch = function(matchID, matchedOn, callback) {
    matchID = matchID || null;
    matchedOn = matchedOn || null;
    callback = callback || function() {};
    var options = {
        "action": "createMatch",
        "matchID": matchID,
        "matchedOn": matchedOn
    };
    this.fetch(options, callback);
}
Api.blockMatch = function(matchID, callback) {
    matchID = matchID || null;
    callback = callback || function() {};
    var options = {
        "action": "blockMatch",
        "matchID": matchID
    };
    this.fetch(options, callback);
}
Api.getUserMatches = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getUserMatches"
    };
    this.fetch(options, callback);
}
Api.getRecommendedPeople = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "getRecommendedPeople"
    }
    this.fetch(options, callback);
}
Api.incBalance = function(amount, note, callback) {
    callback = callback || function() {};
    amount = amount || null;
    note = note || null;
    var options = {
        "action": "incBalance",
        "amount": amount,
        "note": note
    };
    this.fetch(options, callback);
}
Api.decBalance = function(amount, note, callback) {
    callback = callback || function() {};
    amount = amount || null;
    note = note || null;
    var options = {
        "action": "decBalance",
        "amount": amount,
        "note": note
    };
    this.fetch(options, callback);
}
Api.sendGreeting = function(otherID, message, callback) {
    callback = callback || function() {};
    var options = {
        "action": "sendGreeting",
        "receiverID": otherID,
        "message": message
    };
    this.fetch(options, callback);
}
Api.getSuggestedGreeting = function(otherID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getSuggestedGreeting",
        "otherID": otherID
    };
    this.fetch(options, callback);
}
Api.findMoviesLikeTitle = function(title, callback) {
    callback = callback || function() {};
    var options = {
        "action": "findMoviesLikeTitle",
        "title": title
    };
    this.fetch(options, callback);
}
Api.getUserFeed = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getUserFeed"
    };
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getMovieRecommendations = function(filter, callback) {
    callback = callback || function() {};
    filter = filter || null;
    var options = {
        "action": "getMovieRecommendations",
        "filter": filter,
        "bitRate": Player.bitRate
    };
    this.fetch(options, callback);
}
Api.getFavoriteDelta = function(otherUserID, callback) {
    callback = callback || function() {};
    otherUserID = otherUserID || null;
    var options = {
        "action": "getFavoriteDelta",
        "otherUserID": otherUserID
    };
    this.fetch(options, callback);
}
Api.getProfileData = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getProfileData"
    };
    if(userID == "") { userID = null; }
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getFabricProfile = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getFabricProfile"
    };
    if(userID == "") { userID = null; }
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getPassion = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getPassion"
    };
    if(userID == "") { userID = null; }
    if(userID) { options.userID = userID; }
    this.fetch(options, callback);
}
Api.getFavsInCommon = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    Api.getListMoviesInCommon(userID, "2", function(response) {
        callback(response);
    });
}
Api.getQueueInCommon = function(userID, callback) {
    callback = callback || function() {};
    userID = userID || null;
    Api.getListMoviesInCommon(userID, "3", function(response) {
        callback(response);
    });
}
Api.getListMoviesInCommon = function(userID, listType, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "getListMoviesInCommon",
        "userID": userID,
        "listType": listType
    };
    this.fetch(options, callback);
}
Api.reportUser = function(userID, reason, callback) {
    callback = callback || function() {};
    userID = userID || null;
    var options = {
        "action": "reportUser",
        "userID": userID,
        "reason": reason
    };
    this.fetch(options, callback);
}
Api.getHomeData = function(mainCat, topCat, start, limit, sectionID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getHomeData",
        "mainCat": mainCat,
        "topCat": topCat,
        "start": start,
        "limit": limit
    };
    if(sectionID) {
        options.sectionID = sectionID;
    }
    this.fetch(options, callback);
}
Api.getHomeCategories = function(mainCat, topCat, start, limit, sectionID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getHomeCategories",
        "mainCat": mainCat,
        "topCat": topCat,
        "start": start,
        "limit": limit,
        "sectionID": sectionID
    };
    this.fetch(options, callback);
}
Api.concierge = function(callback) {
    callback = callback || function() {};
    var options = {
        "action": "concierge"
    };
    this.fetch(options, callback);
}
Api.getHomeFeed = function(start, limit, sectionID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getHomeFeed",
        "start": start,
        "limit": limit,
        "sectionID": sectionID
    };
    this.fetch(options, callback);
}
Api.getHomeRecs = function(sectionID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getHomeRecs",
        "bitRate": Player.bitRate,
        "sectionID": sectionID
    };

    this.fetch(options, callback);
}
Api.getQ = function(QID, sectionID, callback) {
    sectionID = sectionID || APP.sectionID;
    options = {
        "action": "getListV2",
        "listID": QID,
        "sectionID": APP.sectionID
    };

    this.fetch(options, callback);
}
Api.loadFBMovies = function(movieTitles) {
    var options = {
        "action": "loadFBMovies",
        "movieTitles": movieTitles
    };
    this.fetch(options);
}
Api.loadFBLikes = function(likes, callback) {
    callback = callback || function() {};

    var options = {
        "action": "loadFBLikes",
        "likes": likes
    };
    this.fetch(options, callback);
}
Api.checkFBImages = function(data, callback) {
    callback = callback || function() {};
    var options = {
        "action": "checkFBImages",
        "data": data
    };
    this.fetch(options, callback);
}
Api.deleteAccount = function(callback) {
    callback = callback || function() {};
    var options = { "action": "deleteAccount" };
    this.fetch(options, callback);
}
Api.activateAccount = function(callback) {
    callback = callback || function() {};
    var options = { "action": "activateAccount" };
    this.fetch(options, callback);
}
Api.getFabricCategoryData = function(categoryID, callback) {
    callback = callback || function() {};
    var options = {
        "action": "getFabricCategoryData",
        "bitRate": Player.bitRate,
        "categoryID": categoryID,
        "test": true        // REMOVE THIS
    };
    this.fetch(options, callback);
}
Api.getUnseenActivity = function(callback) {
    callback = callback || function() {};
    var options = { "action": "getUnseenActivity" };
    this.fetch(options, callback);
}
Api.getRecommendedLists = function(callback, offset, limit) {
    offset = offset || 0;
    limit = limit || 0;
    callback = callback || function() {};
    var options = {
        "action": "getRecommendedLists",
        "offset": offset,
        "limit": limit
    };
    this.fetch(options, callback);
}
Api.getCategoryListPart = function(options, callback) {
    options = options || {};
    callback = callback || function() {};
    options.action = "getCategoryListPart";
    options.sectionID = APP.sectionID;
    this.fetch(options, callback);
}
Api.getCategoryDiscoveryData = function(categoryID, callback) {
    categoryID = categoryID || null;
    callback = callback || function() {};
    var options = {
        "action": "getCategoryDiscoveryData",
        "categoryID": categoryID,
        "bitRate": Util.getBitRate()
    };
    this.fetch(options, callback);
}
Api.getListMovies = function(listID, recommendation, callback) {
    callback = callback || function() {};
    recommendation = recommendation || false;
    var options = {
        "action": "getListMovies",
        "listID": listID,
        "bitRate": Util.getBitRate()
    };
    if(recommendation) { options.recommendation = recommendation; }
    this.fetch(options, callback);
}
Api.getMutualFollowers = function(callback) {
    callback = callback || function() {};
    var options = { "action": "getMutualFollowers" };
    this.fetch(options, callback);
}
Api.getAppSettings = function(callback) {
    callback = callback || function() {};
    var options = { "action": "getAppSettings" };
    this.fetch(options, callback);
}

// parent ajax function to handle timeouts
Api.fetch = function(options, callback, success) {
    callback = callback || function() {};
    success = success || function() {};
    var key = Util.encode(options); // the access key for he last response, based off options
    
    
    Util.checkAPI(function(connected) {
        if(connected) {

            $.ajax({
                url: Api.url + 'api.php?callback=?',
                data: options,
                dataType: "jsonp",
                timeout: Api.appSettings.timeout,
                success: function(response) {
                    Api.reconnect();
                    Api.storeResponse(options, response);

                    success();
                    callback(response);
                },
                error: function(response) {

                    Api.disconnect();

                    // If data is skippable (get unseen activity) don't send back cached version and don't trigger no connection
                    if(Api.skippableData(options.action)) {
                        callback(null);
                    } else {
                        if(Api.response[key]) {
                            success();
                            callback(JSON.parse(Api.response[key])); // send back last known response
                        } else {
                            UI.noConnection(options, callback);
                        }
                    }
                }
            });

        } else {
            Api.disconnect();

            // If data is skippable (get unseen activity) don't send back cached version and don't trigger no connection
            if(Api.skippableData(options.action)) {
                callback(null);
            } else {
                if(Api.response[key]) {
                    success();
                    callback(JSON.parse(Api.response[key])); // send back last known response
                } else {
                    UI.noConnection(options, callback);
                }
            }
        }
    });
}

// handles the refetch specifically
Api.refetch = function(options, callback, success) {
    success = success || function() {};
    callback = callback || function() {};
    var key = Util.encode(options); // the access key for he last response, based off options

    if(Api.response[key]) {
        success();
        callback(JSON.parse(Api.response[key]));

        $.ajax({
            url: Api.url + 'api.php?callback=?',
            data: options,
            dataType: "jsonp",
            timeout: 20000,
            success: function(response) {
                Api.reconnect();
                Api.storeResponse(options, response);
            },
            error: function() {
                Api.disconnect();
                if(Api.response[key]) {
                    callback(JSON.parse(Api.response[key]));
                } else {
                    UI.noConnection(options, callback);
                }
            }
        });
    } else {
        $.ajax({
            url: Api.url + 'api.php?callback=?',
            data: options,
            dataType: "jsonp",
            timeout: 20000,
            success: function(response) {
                Api.reconnect();
                Api.storeResponse(options, response);
                success();
                callback(response);
            },
            error: function() {
                Api.disconnect();
                if(Api.response[key]) {
                    callback(JSON.parse(Api.response[key]));
                } else {
                    UI.noConnection(options, callback);
                }
            }
        });
    }
}

// Api load settings
Api.loadSettings = function(response, cb) {
    cb = cb || function() {};
    if(response.appSettings) {
        Api.appSettings = response.appSettings;
    }
    if(response.levelSettings) {
        Api.levelSettings = response.levelSettings;
    }
    cb();
}

Api.getUserCache = function() {
    var options = { "action": "getUserCache" };
    $.ajax({
        url: Api.url + 'api.php?callback=?',
        data: options,
        dataType: "jsonp",
        timeout: 20000,
        success: function(response) {
            if(response) {
                // set cache for
                Api.response[Util.encode({"action":"getFabricProfile"})] = JSON.stringify(response.profile);
                Api.response[Util.encode({"action":"getPassion"})] = JSON.stringify(response.passion);
                Api.response[Util.encode({"action":"getMutualFollowers"})] = JSON.stringify(response.friends);
                Api.response[Util.encode({"action":"getUserMatches"})] = JSON.stringify(response.matches);
                Api.response[Util.encode({"action":"getNotifications"})] = JSON.stringify(response.notifications);
                Api.response[Util.encode({"action":"getConversations"})] = JSON.stringify(response.messages);
                Api.response[Util.encode({"action":"getListsList"})] = JSON.stringify(response.lists);
                Api.response[Util.encode({"action":"getUserFeed"})] = JSON.stringify(response.feed);
            }
        },
        error: function() {}
    });
}

Api.storeResponse = function(options, response) {
    // if action is NOT skippable,
    
    if(!Api.skippableCache(options.action)) {
        // the actual cache storing happens here
        Api.response[Util.encode(options)] = JSON.stringify(response);
    }
}

Api.skippableCache = function(action) {
    // return true if we skip cache of this action
    return Api.skipCache.hasOwnProperty(action);
}

Api.skippableData = function(action) {
    // return true if response data not necessary for online mode
    return Api.skipData.hasOwnProperty(action);
}

Api.clearUserCache = function() {
    Api.response = {};
}

Api.reconnect = function() {
    if(!Api.connected) {
        Api.connected = true;
        $("#no-connection").remove();
        UI.unmask();
    }
}

Api.disconnect = function() {
    Api.connected = false;
}
