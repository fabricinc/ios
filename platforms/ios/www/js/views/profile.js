var ProfileModel = Backbone.Model.extend({
    userID: null,
    favoriteMovies: null,
    profileData: null,
    followerData: null,
    isFollowing: false,
    isFriend: false,

    initialize: function(options) {
        this.userID = options.userID || null;
    },

    getProfileData: function(callback) {
        var self = this;
        callback = callback || function() { };
        Api.getPassion(null, function(response) {
            if(response.success) {
                APP.userPassion = response.data;
            }
            Api.getFabricProfile(self.userID, function(response) {
                self.isFollowing = response.following;
                self.isFriend = response.isFriend;
                self.set(response);



                // fetch new FBImages if own profile
                if(response.self) {
                    Facebook.updateFBImages();
                }

                callback();
            });
        });

    },

    bindEvents: function() {
        var self = this;
        // global public events
        $("#match-message-form").submit(function(e) {
            e.preventDefault();
            var msg = $("#message").val();
            if(msg != "") {
                Api.sendMessage(self.userID, msg, function(response) {
                    $("#message").blur();
                    $("#message").val("");
                    setTimeout(function() {
                        $("#match-message").hide();
                    }, 250);
                });
            }
            return true;
        });

        $("#lists").click(function() {
            if(self.toJSON().self) {
                Backbone.history.navigate("lists", true);
            } else {
                Backbone.history.navigate("otherLists/" + self.userID, true);
            }
            return false;
        });

        $("#feed").click(function() {
            Backbone.history.navigate("userFeed/" + self.userID, true);
            return false;
        });

        $("#settings-gear").fastClick(function(){
            Backbone.history.navigate("settings", true);
        });

        $("#follow-button").click(function() {
            if(self.isFollowing) {
                var message = "Are you sure you want to unfollow " + self.toJSON().profileData.uName;
                navigator.notification.confirm(message, function(button){
                   if(button === 2) {
                        Api.unFollowUser(self.userID, function(response) {
                            if(response.success) {
                                self.isFollowing = false;
                                $("#follow-button").html("Follow");
                                $("#follow-button").toggleClass("following");
                            }
                        });
                    }
                }, null, ["Cancel", "Unfollow"]);
            } else {
                Api.followUser(self.userID, function(response) {
                    if(response.success) {
                        self.isFollowing = true;
                        $("#follow-button").html("Following");
                        $("#follow-button").toggleClass("following");
                    }
                });
            }
            return false;
        });

        $("#follow-data .fl h4").click(function() {
            var following = $(this).hasClass("following") ? true : false;
            Backbone.history.navigate("userLists?userID=" + self.userID + "&following=" + following, true);
            return false;
        });

        $("#movies-seen").click(function() {
            Backbone.history.navigate("lists/" + self.attributes.profileData.seenListID, true);
            return false;
        });

        $("#send-greeting").click(function() {
            if(self.isFriend || parseInt($(this).data("messagecount")) > 0) {
                Backbone.history.navigate("messages/" + self.userID, true);
            } else {
                Backbone.history.navigate("greeting/" + self.userID, true);
            }
            return false;
        });

        $(".info .circle").click(function() {
            UI.scroller.scrollTo(0, -500, 500);
            return false;
        });

        $(".right.button.more").fastClick(function() {
            UI.launchPopUpTwo(APP.load("reportUserPopup"), function() {
                $(".report-content .button").fastClick(function() {
                    var reason = $(".report-content textarea").val();
                    if(reason == "") { reason = "Unknown"; }
                    if(self.userID) {
                        Api.reportUser(self.userID, reason, function(response) {
                            $(".report-content p").html("This user has been reported to Fabric.");
                            $(".report-content textarea").hide();
                            $(".report-content .button").hide();
                            setTimeout(function() {
                                $('.close').click();
                            }, 3000);
                        });
                    }
                    return false;
                });
            });
            return false;
        });

        // passion events
        if($(".fav.common").length) {
            $(".fav.common").click(function() {
                Backbone.history.navigate("getFavsInCommon/" + self.userID, true);
            });
        }

        if($(".queue.common").length) {
            $(".queue.common").click(function() {
                Backbone.history.navigate("getQueueInCommon/" + self.userID, true);
            });
        }

        // favorite delta events
        $("#favorite-delta .delta-poster").click(function(){
            var movieID = $(this).closest(".feed-item").data("movie-id");
            Backbone.history.navigate("movieLobby/" + movieID, true);
        });

        $("#favorite-delta .movie-info").click(function() {
            var movieID = $(this).parent().data("movie-id");
            Backbone.history.navigate("movieLobby/"+ movieID, true);
        });

        $(".add-queue").click(function() {
            var publishedID = $(this).parent().data("movie-published-id"),
                set = $(this).hasClass("active") ? false : true,
                params = { publishedID: publishedID };

            $(this).toggleClass("active");

            Api.setMovieToFabricList(
                publishedID,
                APP.gameState.watchListID,
                set
            );
        });

        // initialize the FBImage slider
        $("#side-swipe").slick({
            autoplaySpeed: 4000,
            autoplay: false,
            arrows: false,
            dots: true,
            infinite: false
        });

        setTimeout(function() { UI.initScroller($("#profile")[0]); }, 100);
    },

    loadPassion: function() {
        if(!this.toJSON().self) {
            return APP.load("dualPassion", {
                user: APP.userPassion,
                other: this.toJSON().passion,
                profile: this.toJSON().profileData,
                favCommon: this.toJSON().favCommon,
                queueCommon: this.toJSON().queueCommon,
                userID: this.userID
            });

        } 
    }
});

var ProfileView = Backbone.View.extend({
    model: null,
    header: null,
    id: "profile-view",

    initialize: function(options, callback) {
        options = options || { };
        callback = callback || function() { };

        this.model = new ProfileModel(options);

        callback();
        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() { };

        self.model.getProfileData(function() {
            var data = self.model.toJSON();
            self.$el.html(APP.load("profile", data));

            if (!self.header) {
                self.header = new HeaderView({
                    title: "Profile",
                    moreButton: (!data.self && self.model.userID !== "252990"),
                    home: false
                });
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);
            $("#top-genres").html(self.model.loadPassion());

            if(!data.self && data.favDelta && data.favDelta.length > 0) {
                $("#favorite-delta").html(
                    APP.load("favoriteDelta", {
                        recs: data.favDelta,
                        uName: data.profileData.uName.split(" ")[0]
                    })
                );
            }

            self.model.bindEvents();
            callback();
        });

        return this;
    },

    dealloc: function() {
        return this;
    }
});