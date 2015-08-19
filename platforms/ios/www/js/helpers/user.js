/*
 *
 * 2/18/13 Issues:
 *
 *  Why are still persisting FB ID in localStorage?
 *  APP.Facebook.Actions.login is not appropriately named.
 *  Api.login has a callback hardwired to it, needs moving to a lambda function
 *  APP.Facebook.handleLogin has Api.login hardwired to it, making it impossible to use it as a callback to Actions.login.
 *
 *
 *
 */

    User = {
        emailRegex: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
        fbWait: false,
        isFacebook: false,

        // TODO: move User model stuff into a separate file.
        createUserModel: function(data) {
            data = data || {};
            var model = Backbone.Model.extend({
                defaults: {}
            });
            model = new model;
            model.set(data);
            return model;
        },

        fetchData: function(callback) {
            callback = callback || function() {};

            Api.getFabricState(function(response) {
                if (response && response.success) { // No active session, or userID not set in our session.  Login required.
                    // check if active or not
                    
                    if(response.active) {
                        response = response.data;
                        response.success = true;
                        response.isFacebook = (parseInt(response.facebookID) > 0) ? true : false;
                        response.facebookID = (response.facebookID == "null") ? 0 : parseInt(response.facebookID);
                        
                        User.isFacebook = response.isFacebook;
                        APP.gameState = response;

                        MobileDevice.getGeolocation(function(pos) {
                            Api.updateUserGeoData(pos);
                        });

                        mixpanel.identify(response.favoriteListID);
                        mixpanel.people.set({
                            "$city": response.city,
                            "$name": response.uName,
                            "Facebook User": Boolean(response.facebookID)
                        });

                        if (!APP.models.currentUser) {
                            APP.models.currentUser = User.createUserModel(response);
                        } else {
                            APP.models.currentUser.set(response);
                        }


                        if (parseInt(response.facebookID) > 0 && !User.isFacebookUser()) {
                            Facebook.promptLogin(callback);
                            //callback(true);
                        } else {
                            callback(true);
                        }
                    } else {
                        // not active - deactivated user
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });

            return this;
        },

        fetchMinData: function(callback) {
            callback = callback || function() {};
            Api.getFabricState(function(response) {
                if (response) {
                    if(response.active) {
                        response = response.data;
                        response.success = true;
                        response.isFacebook = (parseInt(response.facebookID) > 0) ? true : false;
                        response.facebookID = (response.facebookID == "null") ? 0 : response.facebookID;

                        APP.gameState = response;

                        if (!APP.models.currentUser) {
                            APP.models.currentUser = User.createUserModel(response);
                        } else {
                            APP.models.currentUser.set(response);
                        }

                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });
            return this;
        },

        register: function(callback) {
            console.log('register');
            callback = callback || function(success) { Util.log("Registration success: " + success); };
            var firstname = $('#register-firstname').val(),
                lastname = $('#register-lastname').val(),
                email = $('#register-email').val(),
                password = $('#register-password').val(),
                passwordConfirm = $('#register-confirm').val(),
                birthday = $('#register-birthday').val(),
                gender = $('.gender-buttons .active').attr("id"),
                self = this;


            if (this.registrationValidation(firstname, lastname, email, password, passwordConfirm, birthday, gender)) {
                Api.createNewRegistration(firstname + " " + lastname, email, password, null, null, birthday, gender, function(data) {
                    if (Analytics) { Analytics.event("Fabric registration"); }

                    mixpanel.alias();
                    mixpanel.people.set({
                        "$email": email,
                        "$birthday": birthday,
                        "$gender": gender
                    });
                    mixpanel.register({'gender': gender});
     
                    if (data) {
                        callback(self.registerCallback(data, firstname + " " + lastname));
                    } else {
                        Util.alert(FAIL, "Registration Error");
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        },

        registerCallback: function(response, username, facebookID) {
            var self = this;
            if(response.success) {
                localStorage.userName = User.userName = username; // Used only at profile with null game state.
                this.setFacebookID(facebookID);

                // Set properties to check in DashboardController so we know if we need to show welcome notices.
                APP.welcome = true;
                APP.welcomeEnd = true;
                APP.tapPosters = true;

                // Enable app routes
                if (!APP.router) { APP.router = Router.initialize(); }
                APP.router.bindAppEvents();

                self.fetchData(function(success) {
                    if(success) {
                        APP.dispatcher("welcome");
                    } else {
                        Util.log("register callback failed to successfully get game state data");
                    }
                });

                return true;
            } else {
                if(response.duplicateEmail) {
                    Util.alert('That email address is already registered. Are you already registered?', "Email Registered");
                } else if(response.duplicateUserName) {
                    Util.alert('Sorry, that user name is already taken.', "Username Unavailable");
                } else {
                    Util.alert("Oops! Your registration didn't go through. Please try again.", "Registration Error");
                }

                return false;
            }
        },
        createRegistrationWithFacebookData: function(facebookData, friends) {
            var name = facebookData.name,
                email = facebookData.email,
                password = undefined,
                facebookID = facebookData.id,
                friendList = friends.toString(),
                gender = facebookData.gender,
                birthday = facebookData.birthday,
                self = this;

            Api.createNewRegistration(name, email, password, facebookID, friendList, birthday, gender, function(data) {
                if(data) {
                    self.registerCallback(data, name, facebookID);
                    self.setFacebookID(facebookID);
                    self.sendFacebookLikes();

                    mixpanel.alias();
                    mixpanel.people.set({ "$email": email });
  
                    if(Analytics) { Analytics.eventAndParams("Facebook auth", JSON.stringify(data)); }
                } else {
                    Util.alert("Oops! There was an error during registration. Please wait a few minutes and try again.", "registration failed");
                }
            });
            //logAnalyticsEvent("facebook user registered");
        },

        sendFacebookMovies: function() {
            if(User.isFacebook) {
                Facebook.getMovies(function(movies) {
                    if(movies) {
                        if(movies.length > 0) {
                            var movieTitles = [];
                            movies.forEach(function(el) {
                                movieTitles.push(el.name);
                            });
                            Api.loadFBMovies(movieTitles);
                        }
                    } else {
                        Util.log("Facebook.getMovies response null");
                    }
                });
            }
        },

        sendFacebookLikes: function() {
            var options = {
                "action": "importFbLikes",
                "facebookID": this.getFacebookID(),
                "accessToken": Facebook.accessToken
            }

            Api.dispatcher(options);
        },

        registrationValidation: function(firstname, lastname, email, password, passwordConfirm, birthday, gender) {
            if (typeof(firstname) !== 'string' || firstname.length < 1) {
                Util.alert('Your first name is required to register!', "First Name Required");
                return false;
            }

            if (typeof(lastname) !== 'string' || lastname.length < 1) {
                Util.alert('Your last name is required to register!', "Last Name Required");
                return false;
            }

            if (/['"]/g.test(firstname) || /['"]/g.test(lastname)) {
                Util.alert('Single quotes are not allowed in first or last names!', "Syntax Error");
                return false;
            }

            if (!this.emailRegex.test(email)) {
                Util.alert('Oops! That email address looks incorrect. Please try again.', "Invalid Email");
                return false;
            }

            if (typeof(password) != 'string' || password.length < 1) {
                Util.alert('A password is required.', "Password Required");
                return false;
            }

            if (password != passwordConfirm) {
                Util.alert('Passwords must match!', "Password Mismatch");
                return false;
            }

            var age = Math.abs(new Date(Date.now() - new Date(birthday).getTime()).getUTCFullYear() - 1970);
            if (age < 18) {
                Util.alert('You must be at least 18 years old to use this application!', "Invalid Age");
                return false;
            }

            return true;
        },

        recover: function(callback) {
            callback = callback || function() {};
            var email = $('#recover-email').val(),
                msg = "",
                failMsg = "Oops! There was a problem contacting our server.  If the problem persists, please contact Fabric support.";

            if (this.emailRegex.test(email)) {

                Api.recoverPassword(email, function(response){
                    if(response) {
                        Util.log(JSON.stringify(response));

                        if(response.success) {
                            msg = "We have emailed username and password reset information to: " + email;

                        } else if (response.error.code === 0) { // Email address not found.
                            msg = "Oops! " + email + " is not in our records. Please double check and try again, or create a new account.";

                        } else if (response.error.code === 1) { // Facebook account.
                            msg = "Oops! " + email + " is for a Facebook account.  Please try logging in with Facebook instead!";

                        } else { // WTF?
                            var error = self.checkForErrorResponse(response);
                            if (error) {
                                msg = failMsg;
                                return false;
                            }
                        }

                    } else {
                        msg = failMsg;
                    }

                    Util.alert(msg);
                    callback(response.success);

                });

            } else {

                Util.alert("Oops! That email address doesn't appear to be formatted correctly.", "Invalid Email");

            }

        },

        login: function() {
            var self = this;
            var password = $('#password').val(),
                username = $('#username').val();

            if (/['"]/g.test(username)) {
                Util.alert('Single quotes are not allowed in user names!', "Username Format");
                return false;
            }


            UI.mask();
            
            // server-side auth
            Api.checkLogin(username, password, undefined, function(response, facebookData) {
                self.loginCallback(response, facebookData);
            });
            localStorage.uName = username;
        },

        loginFormComplete: function(username, password) {
            if(typeof(username) != 'string' || username.length < 1) {
                Util.alert('Oops! Your username is required to log in!', "Username Missing");
                return false;
            }

            if(typeof(password) != 'string' || password.length < 1) {
                Util.alert('Your password is required to log in!', "Password Required");
                return false;
            }

            return true;
        },

        loginCallback: function(response, facebookData, cb) {
            cb = cb || function() {
                APP.router.dealloc();
                APP.router.bindAppEvents();
                APP.router.bindLoginEvents();
                APP.dispatcher("rate");
            };
            var self = this;
            if(response.authorized && response.active) {


                MobileDevice.getGeolocation(function(pos) {
                    Api.updateUserGeoData(pos);
                });

                
                if (facebookData) {
                    if (Analytics) { Analytics.event("Facebook login"); }
                    self.setFacebookID(facebookData.id);
                    self.isFacebook = true; // Why?

                    cb(true);
                } else {
                    if (Analytics) { Analytics.event("Fabric login"); }
                    self.isFacebook = false;

                    cb(true);
                }
            } else if(response.facebookUserNotFound) {
                Facebook.getFbFriends(function(tpFbFriends) {
                    self.createRegistrationWithFacebookData(facebookData, tpFbFriends);
                });
            } else if(response.authorized && !response.active) {
                //cb(false);
                // deactivated user is authorized but not active - was deleted at some point but returned
                $("input").blur();
                setTimeout(function() {
                    UI.unmask();
                    UI.launchPopUpTwo(APP.load("inactiveAccount"), function() {
                        $(document.getElementById("activate")).fastClick(function() {
                            Api.activateAccount(function() {
                                $(".close").click();
                                var newFragment = Backbone.history.getFragment($(this).attr('href'));
                                if (Backbone.history.fragment == newFragment) {
                                    // need to null out Backbone.history.fragement because
                                    // navigate method will ignore when it is the same as newFragment
                                    Backbone.history.fragment = null;
                                    Backbone.history.navigate(newFragment, true);
                                }
                            });
                            return false;
                        });

                        $(document.getElementById("cancel")).fastClick(function() {
                            $(".close").click();
                            return false;
                        });
                    }, function() {
                        $("#pop-up-wrapper").hide();
                    });

                }, 200);
            } else {

                cb(false);
                
            }
        },

        logout: function() {
            var self = this;
            UI.mask();

            Api.abortAll(function() { // This will kill any outstanding requests
                Api.dispatcher({ action:"logout" }, function(response) {
                    Api.clearUserCache();
                    if (response.success) {
                        self.clearClasses();
                        APP.models.currentUser = null;

                        if(self.isFacebookUser()) {
                            self.facebookLogout(function() {
                                self.setFacebookID('');
                                APP.dispatcher("start");
                            });
                        } else {
                            APP.dispatcher("start");
                        }
                    } else { // Oh shit.
                        APP.dispatcher("start");
                    }
                });
            });
        },

        clearClasses: function() {
            $("html").removeClass("facebook").removeClass("not-facebook");
        },

        // Call this method with a User.achievement object like this:
        // var achievement = User.achievements.stunt_double;
        // User.facebookAchievementPost(achievement)
        // If everything works and this user has never before earned this achievement, facebook will
        // put together some sort of notification on facebook at its discretion.
        facebookAchievementPost: function(achievement) {
            FB.api('/me', function(response) {
                if(response.id) {
                    // the url needs the user's facebook id as part of the path
                    var serverUrl = 'https://graph.facebook.com/' + response.id + '/achievements';
                    // posting the achievement to facebook
                    $.post(serverUrl, { achievement:achievement.facebookURL, access_token:FB_ACCESS_TOKEN }, function(response) {
                        Util.log(response);
                    });
                    if(Analytics) { Analytics.eventAndParams("Facebook achievement posted", { achievement: achievement }); }
                }
            });
        },

        facebookLogout: function(callback) {
            callback = callback || function() {};

            Facebook.tpFbFriendIDs = null;
            Util.log("logout callback", callback);
            facebookConnectPlugin.logout(callback, callback);
        },

        // public twitter function
        tweet: function(movie, tweetCase) {
            var link = movie.publishedid != "" ? "http://www.trailerpop.com/play_trailer/play/" + movie.publishedid : "",
                itunesLink = "bit.ly/11RyceI",
                movieTitle = movie['title'],
                image = "",
                text = '';
                
            // String (including single quotes) is 81 chars, from 120 (20 for t.co url) = 39 , padding a little.
            if (movieTitle.length > 37) {
                movieTitle = movieTitle.slice(0, 34); // Need three chars for elipsis.
                if (movieTitle.slice(33, 34) === " ") movieTitle = movieTitle.slice(0, 33); // Trim.
                movieTitle += "...";
            }

            switch(tweetCase){
                case "categoryComplete":
                    text = "I've seen "+ movie.categoryPercent +" of the movies in @trailerpop's '"+ movieTitle +"' category. Find out your % with: "+ itunesLink;
                    break;
                case "shareMovie":
                    text = "Check out '"+ movieTitle +"', found on @trailerpop " + link;
                    break;
            }
            // text = "Check out the trailer & play trivia for " +  movieTitle + " on @Fabric. ";
            Util.log("twitter text: " + text);

            window.plugins.twitter.composeTweet(
                function(s) {
                    Util.log("Tweet success");
                    $('.share-with-twitter').removeClass('active');
                },
                function(e) {
                    if(e.toString() != 'Cancelled') {
                        Util.alert("Oops! There was an error sending your tweet.", "Twitter Error");
                        Util.log('Tweet failed: ' + e);

                    }
                },
                text,
				// link,
				image
            );

            Analytics.eventAndParams("Tweet", {
                screen: $(".header-text").html(),
                movie: movieTitle,
                publishedID: movie.publishedid
            });
        },

        getUserID: function() {
            return null;
        },

        setFacebookID: function(facebookID) {
            if (typeof facebookID === "undefined") return false;


            if (facebookID === "") {
                localStorage.removeItem("facebookID");
            } else {
                localStorage.facebookID = facebookID;
            }
        },

        getFacebookID: function() {
            return localStorage.facebookID;
        },

        isFacebookUser: function() {
            return this.isFacebook;
        },
        getFacebookAvatar: function(facebookID, size, rank) {
            if (!facebookID || facebookID === null) {
                if (facebookID !== null && this.isFacebookUser()) {
                    facebookID = this.getFacebookID();
                    if(facebookID) {
                        facebookID = facebookID.replace(/'/g, "");
                    }
                } else {
                    return null;
                }
            }

            if (size) {
                size = "?type=" + size; // square, small, large; defaulting to square
            } else {
                size = "";
            }

            return "https://graph.facebook.com/" + facebookID + "/picture" + size;
        },

        getUserName: function() {
            return APP.gameState.uName;
        },

        getFirstName: function() {
            if (this.isFacebookUser()) {
                return Facebook.getFirstName();
            } else {
                return this.getUserName(); // Don't have first name if they're not a Facebook user.  Only full name.
            }
        },

        welcomeCompleted: function() {
            APP.welcome = false;
            APP.firstRate = true;
            APP.gameState.welcomeComplete = 1;

            var friendsInApp = Facebook.tpFbFriendIDs || null;
            Api.welcomeCompleted(friendsInApp);

            if(User.isFacebook) {
                User.sendFacebookMovies();
                Facebook.uploadLikes();
            }
        }

        /*
        getLevel: function() {
            // level formula
            var catsComp = parseInt(APP.gameState.catsDiscovered); // total # of cats discovered
            var userLevel = 0;

            // loops through array
            for(var i = 0; i < Api.levelSettings.length; i++) {
                var num = parseInt(Api.levelSettings[i].categoryThreshold);
                var level = Api.levelSettings[i].userLevel;

                if(catsComp < num || catsComp == 0) {
                    // we found their level
                    userLevel = level;
                    break;
                }
            }

            return parseInt(level);
        },

        currentLevelThreshold: function() {
            var lvlSettings = Api.levelSettings[parseInt(User.getLevel())];
            return parseInt(lvlSettings.categoryThreshold);
        }
        */
    };