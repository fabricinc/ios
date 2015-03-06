var LeaderboardModel = Backbone.Model.extend({
		scroller: null,
	    currentView: null,
	    fbPrefix: "fb-",
		gplusPrefix: "gplus-",
	    $els: null,
		periods: null,
        userData: null,

		init: function(callback) {
			var self = this;
			
			if(!callback) return false;

		    this.currentView = "today";
		    this.fbPrefix = "";
			this.$els = $("ul, .score");

		    $("#" + this.currentView +  ".switch").addClass("active");
		    if (this.fbPrefix === "") {
		        $(".fb-switch.all").addClass("active");
		    } else {
		        $(".fb-switch.friends").addClass("active");
		    }

		    //Util.loadImage(User.getFacebookAvatar(false, "large"), $("#personal-best .avatar"), true);

		    //if (User.isFacebookUser()) $("#personal-best .avatar").addClass("frame");
		    this.getLeaderboard(function() {
		        self.bindEvents();
				callback();
		    });

		    return this;
		},
        getLeaderboard: function(callback) {
			callback = callback || function() {};
	        var self = this,
	            friendlist = null;


	        if (User.isFacebookUser()) {
	            Facebook.getFbFriends(function(result) {
	                friendlist = result;
	                friendlist.push(User.getFacebookID());

	                self.getLeaderboardFromApi(friendlist, callback);
	            });
	        } else {
	            friendlist = null;
	            self.getLeaderboardFromApi(friendlist, callback);
	        }

	        return this;
	    },
		getLeaderboardFromApi: function(friendList, callback) {
			callback = callback || function() {};
			var self = this;
            //Util.log("getLeaderboard: ", JSON.stringify(friendList));

            /*
            Api.getLeaderboard(friendList, function(leaderboard) {
                self.periods = leaderboard.periods;
                self.userData = leaderboard.userData;
                self.loadLeaderboardList(self, callback);
            });
            */
            self.periods = {};
            self.userData = {};

            Api.getLeaderboardInterval("today", friendList, function(leaderboard) {
				self.periods["today"] = leaderboard.periods["today"];
                self.periods["fb-today"] = leaderboard.periods["fb-today"];
                self.userData["today"] = leaderboard.userData["today"];

                self.loadLeaderboardList(self, callback);
            });

            Api.getLeaderboardInterval("thisWeek", friendList, function(leaderboard) {
                self.periods["thisWeek"] = leaderboard.periods["thisWeek"];
                self.periods["fb-thisWeek"] = leaderboard.periods["fb-thisWeek"];
                self.userData["thisWeek"] = leaderboard.userData["thisWeek"];
            });

            Api.getLeaderboardInterval("allTime", friendList, function(leaderboard) {
                self.periods["allTime"] = leaderboard.periods["allTime"];
                self.periods["fb-allTime"] = leaderboard.periods["fb-allTime"];
                self.userData["allTime"] = leaderboard.userData["allTime"];
            });
        },
		loadLeaderboardList: function(ref, callback) {
			callback = callback || function() {};
	        var self = ref,
	            view = self.currentView,
	            list = this.periods[this.fbPrefix + view],
	            myScore = 0,
	            userData = null,
	            $template,
	            i = 0;

            if(!list || list.length <= 0) {
                $("ul.scrolling").html("");
                $('.score').html("My score: 0");
                $("ul.boxes").html("<div style='width: 100%; text-align: center;'>None of your friends are playing Fabric. Invite some!</div>");
                return false;
            }

	        var l = list.length;

			$.get('templates/leaderboardListTemplate.html', function(html) {
				$newRow = $.parseHTML(html)[0];
			});
			
			$.get('templates/leaderboardBoxTemplate.html', function(html) {
				$box = $.parseHTML(html)[0];
			});
				
	        setTimeout(function() {
	            myScore = self.userData[self.currentView].score;
	            myScore = "My score: " + Util.addCommas(myScore);
	            $(".score").first().html(myScore);

	            if (User.isFacebookUser() !== true && self.fbPrefix !=="") {
	                $('#leaderboard-list ul.boxes').html('');
	                $('#leaderboard-list ul.scrolling').html('<li><div class="padding"><span class="message">You must be logged in with a Facebook account to filter by your friends!</span></div></li>');
	            } else if (l < 1) {
	                $('#leaderboard-list ul.boxes').html('');
	                $('#leaderboard-list ul.scrolling').html('<li><div class="padding"><span class="message">There are no users for this time period.</span></div></li>');
	            } else {
	                $("#leaderboard-list ul").html("");
	                for (; i < l; i += 1) {
	                    var row = list[i],
	                        avatar,
	                        $target = $("ul.scrolling"),
	                        number = i + 1 + ".";

	                    if (i < 3) {
	                        number = i + 1;
	                        $template = $box;
	                        $target = $("ul.boxes");
	                        avatar = User.getFacebookAvatar(row.facebookID, 'large', row.rank);

	                        // TODO: fix Util.loadImage to work with the local files.
	                        $($template).find('.avatar').css({"background-image": "url('" + avatar + "')"});
	                        if (row.facebookID == null) {
	                            $($template).find(".avatar").addClass("badge");
	                        } else {
	                            $($template).find(".avatar").removeClass("badge");
	                        }

	                    } else {
	                        $template = $newRow;
	                    }

	                    $($template).find('.number').html(number);
	                    $($template).find('.name').html(row.name);
	                    $($template).find('.rank').html(row.rank);
	                    $($template).find('.score').html(Util.addCommas(row.score));


	                    $target.append($($template).clone());
	                }
	            }

	            self.fadeThingsIn($("ul"));
	            self.setScroller();

	            //if ($('#mask').hasClass('on')) APP.unmask();
	
				callback();

	        }, 200); // 200 for transitions.

	        return self;
	    },
		setScroller: function() {
	        var self = this;

	        self.dealloc();
	        setTimeout(function() {
	            self.scroller = new iScroll('scrolling-list', {
	                hScroll: false,
	                hScrollbar: false,
	                vScrollbar: false,
	                fixedScrollbar: false,
	                bounce: true
	            });
	        }, 0);

	        return this;
	    },
		bindEvents: function() {
	        var self = this,
	            $that = null;

	        $('#time-period .switch').fastClick(function() {
	            self.toggleTimePeriod($(this));
	        });

	        $('.fb-switch.switch').fastClick(function() {
				Sounds.click();
	            self.toggleFriendsOnly($(this));
				// different analytics needed here
	            if(Analytics) { Analytics.event("Leaderboard friends-filter selected"); }
	        });

	        $('#invite-facebook-friends').fastClick(function(){
                FBActions.inviteRequest()
	        });

	        return this;
	    },
		fadeThingsOut: function() {
	        this.$els.removeClass("fade-in").addClass("fade-out");
	    },

	    fadeThingsIn: function() {
	        this.$els.removeClass("fade-out").addClass("fade-in");
	    },

	    toggleTimePeriod: function($that) {
	        if ($that.className === "active") return false;
            this.currentView = $that.attr("id");

            var view = this.currentView;
            var list = this.periods[this.fbPrefix + view];

            if(!list || list.length <= 0) { return false; }

	        this.fadeThingsOut($("ul"));

	        $('#time-period .active').removeClass('active');

	        $that.addClass('active');



            view = self.currentView,
            list = this.periods[this.fbPrefix + view],

	        this.loadLeaderboardList(this);

	        Sounds.click();

			// different app analytics needed
	        if(Analytics) { Analytics.event("Leaderboard date-filter selected"); }
	    },

	    toggleFriendsOnly: function($that) {
			var self = this;
	        if ($that.hasClass("active")) return;

            if(!User.isFacebookUser()) { Util.alert(FBActions.tpUserMessage, "Facebook Account Required"); return; };

	        Sounds.click();

	        $(".fb-switch.active").removeClass("active");
	        $that.addClass("active");

	        if ($that.hasClass('all')) {
	            this.fbPrefix = "";
	        } else {
	            this.fbPrefix = "fb-";
	        }

	        setTimeout(function() { self.loadLeaderboardList(self) }, 200);
	    },
		dealloc: function() {
			if (this.scroller) this.scroller.destroy();
	        this.scroller = null;
	        return this;
		}
    });

    var LeaderboardView = Backbone.View.extend({
		model: null,
		
        initialize: function(callback) {
			var self = this;
            callback = callback || function() {};

			this.model = new LeaderboardModel();
			
			callback();
            return this;
        },

        render: function(callback) {
			var self = this;
			callback = callback || function() {};
			
			APP.models.leaderboard = self.model;
			
			$.get('templates/leaderboard.html', function(html) {
	            self.$el.html(html);
	            if (!self.header) {
	                self.header = new HeaderView({
	                    title: "Leaderboard",
	                });
	                self.$el.prepend(self.header.el);
	            }

				$("#wrapper").html(self.$el.html());

				self.model.init(callback);
			});			
        },

        dealloc: function() {
			this.model.dealloc();
		}
    });