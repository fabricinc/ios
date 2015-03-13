Facebook = {
    // Common properties
    fbAppID: '908540922496603',
    fbGraphUrl: 'https://graph.facebook.com/',
    permissionsScope: "email,user_friends,user_birthday,user_photos,user_likes",
    // User specific properties
    friendList: null,
    accessToken: null,
    fbUserID: null,
    friendIDs: null,
    tpFbFriendIDs: null,
    nonTpFbFriendIDs: null,
    userName: null,
    email: null,
    gender: null,
    firstName: null,
    init: function() {
        var self = this,
            fbInitOptions = {
                appId: self.fbAppID,
                version: 'v2.1',
                useCachedDialogs: false,
                status: false,
                oauth: true,
                frictionlessRequests: true
            };

        if (Util.isMobile()) {
            //fbInitOptions.nativeInterface = CDV.FB;
            doFbInit();
        } else {
            window.fbAsyncInit = function () {
                doFbInit();
            };

            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        }

        function doFbInit() {
            FB.init(fbInitOptions);
        }
    },
    dealloc: function() {
        facebookConnectPlugin.logout(function() {
            this.friendList =  null;
            this.accessToken =  null;
            this.fbUserID =  null;
            this.friendIDs =  null;
            this.tpFbFriendIDs =  null;
            this.nonTpFbFriendIDs =  null;
            this.userName =  null;
            this.email =  null;
            this.gender =  null;
            this.firstName =  null;
        });
    },
    promptLogin: function(cb) {
        cb = cb || function() {
            if(APP.router) {
                APP.router.dealloc();
                APP.router.bindAppEvents();
                APP.router.bindLoginEvents();
                APP.dispatcher("");
            }
        };
        var self = this;
        if (!FB) { Util.alert("Facebook is not initialized. If the problem persists, please contact Fabric support", "Facebook Error"); }

        facebookConnectPlugin.getLoginStatus(function(response) {
            if(response.status == "unknown") {
                facebookConnectPlugin.login(Facebook.permissionsScope.split(','), function(response) {
                    self.handleLogin(response, cb);
                }, function(error) {
                    Util.log(error);
                });
            } else if(response.status == "connected") {
                self.handleLogin(response, cb);
            }
        });

    },
    authUser: function() {
        FB.Event.subscribe('auth.login', self.handleLogin);
        var self = this;
    },
    handleLogin: function(session, cb) {
        cb = cb || function() {
            APP.router.dealloc();
            APP.router.bindAppEvents();
            APP.router.bindLoginEvents();
            APP.dispatcher("rate");
        };
        var self = this;
        
        Util.log('Got the user\'s session: ' + JSON.stringify(session));

        if (session.authResponse) {
            Facebook.accessToken = session.authResponse.accessToken;
            document.body.className = 'timerActive';

            facebookConnectPlugin.api('/me', [], function(response) {
                if(response) {
                    if (response.error) {
                        Api.error("facebook error", { "fbErrorResponse": response.error });
                        facebookConnectPlugin.login(Facebook.permissionsScope.split(','), function(response) {
                            self.handleLogin(response, cb);
                        });
                        APP.click = false;

                        return false;
                    }

                    localStorage.facebookID = response.id;
                    User.isFacebook = true;
                    self.fbUserID = response.id;
                    self.userName = response.name;
                    self.email    = response.email;
                    self.gender   = response.gender;
                    self.firstName = response.first_name;
                    self.birthday = response.birthday;

                    Facebook.getFbFriends();
                    Facebook.updateFBImages();

                    if (flurry) { Analytics.eventAndParams("Facebook auth", JSON.stringify(response)); }
                    APP.click = false;
                    Api.checkLogin(undefined, undefined, response, function(response, facebookData) {
                        User.loginCallback(response, facebookData, cb);
                    });
                } else {
                    APP.click = false;
                    // TODO: Fallback logic here?
                    UI.unmask();

                }
            });
        } else {
            APP.click = false;
            document.body.className = 'not_connected';
        }
    },
    getFbFriends: function(callback) {
        var self = this;

        // Fallback for synchronous calls to this.
        if (typeof callback !== "function")
            callback = function() {
                return self.tpFbFriendIDs;
            };

        if (this.tpFbFriendIDs !== null) {
            callback(self.tpFbFriendIDs);
            return self.tpFbFriendIDs;
        }

        if (User.isFacebookUser()) {
            var friends,
                friendIDs = [],
                appFriendIDs = [],
                nonAppFriendIDs = [];

            Util.log("prefetch found null friendlist");
            /*
            facebookConnectPlugin.api(
                "/me/invitable_friends",
                [],
                function (response) {
                    if (response && !response.error) {
                        /* handle the result
                    }
                }
            );
            */

            // Get friends, friends that are using the app, and friends that are not.
            //facebookConnectPlugin.api({ method: 'friends.getAppUsers' }, [], function(appFriendResponse) {
                //Util.log(JSON.stringify(appFriendResponse));

                //if (appFriendResponse.error || appFriendResponse.error_code) {
                //    Util.log("There was a problem contacting Facebook.  Facebook said: " + appFriendResponse.error_code.message);
                    callback([]);
                    return false;
                //}

                //appFriendIDs = self.tpFbFriendIDs = appFriendResponse;

                // Now fetch all of the user's friends so that we can determine who isn't using the app.
                facebookConnectPlugin.api('/me/friends', [], function(friendResponse) {
                    friends = friendResponse.data;

                    // Limit to 200 friends for performance
                    for (var k = 0; k < friends.length; k++) {
                        var friend = friends[k];
                        friendIDs.push(friend.id);
                    }

                    for (var i = 0; i < friendIDs.length  && i < 200; i++) {
                        if (appFriendIDs.indexOf(friendIDs[i]) === -1) {
                            nonAppFriendIDs.push(friendIDs[i]);
                        }
                    }

                    self.tpFbFriendIDs = appFriendIDs;
                    self.friendIDs = friendIDs;
                    self.nonTpFbFriendIDs = nonAppFriendIDs;

                    Util.log("fbFriends set: " + JSON.stringify(appFriendIDs));

                    callback(self.tpFbFriendIDs);
                    return self.tpFbFriendIDs;

                });
            //});
        } else {
            callback(false);
            return false;
        }
    },
    getFirstName: function(callback) {
        if (!callback) var callback = function() {};

        if (typeof this.firstName === "string" && this.firstName !== 'undefined') {
            Util.log("first name: " + this.firstName);
            callback(this.firstName);
            return this.firstName;
        } else {
            var self = this;
            FBActions.login(function() {
                facebookConnectPlugin.api('/me', [], function(response) {
                    if(response) {
                        self.fbUserID = response.id;
                        localStorage.facebookID = response.id;
                        self.userName = response.name;
                        self.email    = response.email;
                        self.gender   = response.gender;
                        self.firstName = response.first_name;

                        callback(self.firstName);
                        return response.first_name;
                    } else { // Not sure how we would get here, but just in case return full name from gameState.
                        callback(self.firstName);
                        return User.getUserName();
                    }
                });
            });
        }
    },
    getPhotos: function(callback) {
        callback = callback || function() {};
        if(Api.connected) {
            facebookConnectPlugin.api('/me/photos', [], function(response) {
                if (response && !response.error) {
                    Util.log("Response successful for /me/photos");
                } else {
                    if(response) {
                        Util.log("Error in response from FB.api('/me/photos'): " + response.error);
                    } else {
                        Util.log("No response from FB.api('/me/photos')");
                    }
                }
            });
        } else {
            callback();
        }
    },
    getAlbums: function(callback) {
        if(Api.connected) {
            callback = callback || function() {};
            facebookConnectPlugin.api('/me/albums', [], function(response) {
                if (response && !response.error) {
                    Util.log("Response successful for /me/albums");
                    callback(response.data);
                } else {
                    if(response) {
                        Util.log("Error in response from FB.api('/me/albums'): " + response.error);
                    } else {
                        Util.log("No response from FB.api('/me/albums')");
                    }
                }
            });
        } else {
            callback(null);
        }
    },
    getAlbum: function(albumID, callback) {
        callback = callback || function() {};
        if(Api.connected) {
            facebookConnectPlugin.api('/' + albumID + "/photos", [], function (response) {
                    if (response && !response.error) {
                        callback(response.data);
                    } else {
                        callback();
                    }
                }
            );
        } else {
            callback();
        }
    },
    getLikes: function(callback) {
        callback = callback || function() {};
        if(Api.connected) {
            facebookConnectPlugin.api('/me/likes', [], function(response) {
                if (response && !response.error) {
                    callback(response);
                } else {
                    if(response) {
                        Util.log("Error in response from FB.api('/me/likes'): " + response.error);
                    } else {
                        Util.log("No response from FB.api('/me/likes')");
                    }
                    callback();
                }
            });
        } else {
            callback();
        }
    },
    getMovies: function(callback) {
        callback = callback || function() {};
        if(Api.connected) {
            facebookConnectPlugin.api('/me/movies', [], function(response) {
                if (response && !response.error) {
                    callback(response.data);
                } else {
                    if(response) {
                        Util.log("Error in response from FB.api('/me/movies'): " + response.error);
                    } else {
                        Util.log("No response from FB.api('/me/movies')");
                    }
                    callback();
                }
            });
        } else {
            callback();
        }
    },
    uploadLikes: function() {
        if(Api.connected) {
            this.getLikes(function(likes) {
                if(likes) {
                    // loop through
                    var i,j,temparray,chunk = 10;
                    for (i=0,j=likes.data.length; i<j; i+=chunk) {
                        temparray = likes.data.slice(i,i+chunk);
                        // do whatever
                        Api.loadFBLikes(temparray);
                    }
                }
            });
        }
    },
    updateFBImages: function() {
        var self = this;
        if(User.isFacebook && Api.connected) {
            self.getAlbums(function(albums) {
                if(albums.length > 0) {
                    albums.some(function(album) {
                        if(album.name == "Profile Pictures") {
                            self.getAlbum(album.id, function(pictures) {
                                var length = (pictures.length > 5) ? 5 : pictures.length;
                                var data = [];
                                for(var i = 0; i < length; i++) {
                                    data.push({
                                        fb_obj_id: pictures[i].id,
                                        picture: pictures[i].picture,
                                        source: pictures[i].source
                                    });
                                }
                                Api.checkFBImages(data);
                            });
                            return true;
                        }
                    });
                }
            });
        }
    }
};