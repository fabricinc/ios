var FBActions = {
    	defaultFeedDescription: "", //Fabric is a fun and entertaining way to play movie trivia while discovering movies to watch.
	    tpUserMessage: "Please log in with a Facebook account to use Fabric's Facebook features!",

	    login: function(callback) {
	        callback = callback || function() {};
	        facebookConnectPlugin.getLoginStatus(function(response) {
	            Util.log("facebook login status: " + JSON.stringify(response));
	            if(response.status == 'connected' && response.authResponse.userID !== "") {
	                localStorage.facebookID = response.authResponse.userID;
                    User.isFacebook = true;
	                callback();
	            } else {
	                FB.login(function(response) {
	                    callback();
	                }, { scope: Facebook.permissionsScope });
	            }
	        });
	    },

	    isFacebookUser: function() {
	        if(!User.isFacebookUser()) {
	            return false;
	        } else {
	            return true;
	        }
	    },

	    inviteRequest: function() {
	        if(!User.isFacebookUser()) {
	            Util.alert(this.tpUserMessage, "Facebook Account Required");
	            return false;
	        } else {
                facebookConnectPlugin.showDialog({
                    method: "apprequests",
                    message: "Come on man, check out my application."
                }, function() {
                    // success callback
                }, function() {
                    // failure callback
                });
            }
	    },

	//    inviteListRequest: function(listName) {
	//        Util.log('clicked');
	//        if (!User.isFacebookUser()) {
	//            Util.alert("You must be logged in with a Facebook account to use Fabric's social features!");
	//            return false;
	//        }
	//
	//        var options = {
	//            method: 'apprequests',
	//            suggestions: APP.Facebook.nonTpFbFriendIDs,
	//            message: APP.gameState.uName + ' has invited you to play their list ' + listName + ' in Fabric!',
	//            redirect_uri: "www.trailerpop.com"
	//        };
	//
	//        this.login(function() {
	//            FB.ui(options, function(response) {
	//                Util.log('sendRequestInvite UI response: ', JSON.stringify(response));
	//                Analytics.eventAndParams("List invite request sent", {"name": APP.MovieListController.listName, "listID": APP.MovieListController.listID});
	//            });
	//        });
	//    },

	    postPlayEventToFeed: function(movie, callback) {
	        if(!User.isFacebookUser()) {
	            Util.alert(this.tpUserMessage, "Facebook Account Required");
	            return false;
	        }
            var self = this;
	        callback = callback || function() {};
	        movie = movie || {};

	        // Post to the user's feed
	        this.login(function() {
	            var options = {
	                method: 'feed',
	                name: APP.gameState.uName + " suggests you check out this trailer.",
	                caption: "Watch this trailer & play movie trivia for '" + movie['title'] + "' in Fabric.",
	                description: self.defaultFeedDescription,
	                link: "http://www.trailerpop.com/play_trailer/play/" + movie['publishedid'] + "/750",
	                picture: movie['poster']
	            };

	            Util.log("fb post options: " + JSON.stringify(options));

	            FB.ui(options, function() {
	                Analytics.logFacebookTrailerPost(movie);
	                callback();
	            });
	        });
	    },

	    challenge: function(listID, listName, listImage, callback) {
	        if(!User.isFacebookUser()) {
	            Util.alert(this.tpUserMessage, "Facebook Account Required");
	            return false;
	        }
            var self = this;
            callback = callback || function() {};

	        // Post to the user's feed
	        Facebook.getFirstName(function(firstName) { // May require call to Facebook so call asynchronously.
	            self.login(function() {
	                var options = {
	                        method: 'feed',
	                        name: listName + " - a movie list by " + firstName,
	                        caption: "Play movie trivia for this list & thousands of other films in Fabric.",
	                        description: self.defaultFeedDescription,
	                        link: "http://www.trailerpop.com/challenge/" + listID,
	                        picture: listImage
	                    };

	                FB.ui(options, function() {
	                    Analytics.eventAndParams("List invite request sent", {"name": listName, "listID": listID});
	                    Api.dispatcher({ action:"setListChallenged", listID: listID });
	                    callback();
	                });
	            });
	        });
	    },

	    /**
	     *
	     * @param opts = [movieName, prizeInfo, contestUrl, poster, contestID]
	     * @param callback
	     * @return {this}
	     */

	    postContest: function(opts, callback) {
	        if(!User.isFacebookUser()) {
	            Util.alert(this.tpUserMessage, "Facebook Account Required");
	            return false;
	        }
            var self = this;
	        callback = callback || function() {};

	        // Post to the user's feed
	        Facebook.getFirstName(function(firstName) { // May require call to Facebook so call asynchronously.
	            self.login(function() {
	                var options = {
	                    method: 'feed',
	                    name: firstName + " just entered a movie trivia contest for " + opts.movieName,
	                    caption: "Join " + firstName + " &amp; enter the trivia contest for ‘" + opts.movieName + "’ using Fabric. Winners will receive " + opts.prizeInfo,
	                    description: self.defaultFeedDescription,
	                    link: opts.contestUrl,
	                    picture: opts.poster
	                };

	                FB.ui(options, function() {
	                    if(Analytics) { Analytics.eventAndParams("Contest shared", {"name": opts.movieName, "contestID": opts.contestID}); }
	                    callback();
	                });
	            });
	        });
	        return this;
	    },

	    // Call this method with a User.achievement object like this:
	    // var achievement = User.achievements.stunt_double;
	    // User.facebookAchievementPost(achievement)
	    // If everything works and this user has never before earned this achievement, facebook will
	    // put together some sort of notification on facebook at its discretion.
	    facebookAchievementPost: function(achievement) {
	        this.login(function() {
	            // the url needs the user's facebook id as part of the path
	            var serverUrl = FB_GRAPH_URL + Facebook.fbUserID + '/achievements';
	            Util.log(serverUrl);
	            // posting the achievement to facebook
	            $.post(serverUrl, { achievement:achievement.facebookURL, access_token:FB_ACCESS_TOKEN }, function(response) {
	                Util.log(response);
	            });
	            Analytics.eventAndParams("Facebook achievement posted", { achievement: achievement });
	        });
	    }
	};
