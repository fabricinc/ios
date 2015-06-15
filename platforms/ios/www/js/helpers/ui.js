var UI = {
        requestTimeout: 30,
        maskTimer: null,
        scroller: null,
        popupScroller: null,
        defaultScrollTarget: "#list-row",
		click: false,
		active: false,
        oldScrollID: null,
        oldScrollPos: 0,
        oldTitle: null,
        mask: function(spinner, callback) {


            // if(!spinner) { callback(); }

            var el = document.getElementById("mask"),
                self = this;
            callback = callback || function() { };
            spinner = spinner || function () { };

            if (el.className == "off" && spinner) {
                el.className = "on";

                var maskTime = 0;
                this.maskTimer = window.setInterval(function() {
                    maskTime++;
                    if (maskTime === Api.appSettings.maskTimeout) {
                        Util.alert("Oops! The server is taking a long time to respond. Please try again in a bit.  If the problem persists, please contact Fabric support.", "Server Timeout");
                        maskTime = 0;
                        window.clearInterval(self.maskTimer);
                        //this.History.go(0);
						Backbone.history.navigate("");
                    }
                }, 1000);

                setTimeout(function() {
                    callback();
                }, 300);
            } else {
                callback();
            }
        },
        unmask: function(callback) {
            if (this.maskTimer) window.clearInterval(this.maskTimer);
            this.maskTimer = null;

            document.getElementById("mask").className = "off";

            if (typeof callback == "function") {
                window.setTimeout(callback, 800);
            }
        },
		launchPopUpTwo: function(html, callback, closeCallback) {
            closeCallback = closeCallback || function() {};
            callback = callback || function() {};
            var self = this,
                $wrapper = $('#wrapper'),
                $popUp = $("<div id=\"pop-up-wrapper\"><div id=\"pop-up\" class=\"pop-up-content\"></div></div>"); //$(load("popup", null, true));

            if($("#pop-up-wrapper").length > 0) {
                // we found it
                $("#pop-up-wrapper").find("#pop-up").html(html).prepend('<div class="close"></div>');
                $popUp = $("#pop-up-wrapper");
            } else {
                // create it
                $popUp.find("#pop-up").html(html).prepend("<div class=\"close\"></div>");
                $wrapper.append($popUp);
            }

            $popUp.show();
            $popUp.find("#pop-up").show();

            $popUp.fadeIn(200, function() {
                // Initiate our close button with callback
                $('.close').fastClick(function() {
                    self.closePopUp(function() {
                        closeCallback();
                    });
                });
                callback();
            });
        },
        bindCoachEvents: function(section){
            section = section || null
            $("#coach-button").fastClick(function(){
                $("#coach-section").css({ opacity : 0 });
                
                //Update the gameState and database
                return;
                Api.updateOnboard(section);

            });
            $("#coach-section").on('transitionend', function(){

                $(this).hide().empty();
            });
        },
        launchPopUp: function(popUpHTML, callback) {
            callback = callback || function() {};
            var self = this,
                $wrapper = $('#wrapper'),
                $popUp = $("<div id=\"pop-up-wrapper\"><div id=\"pop-up\" class=\"fullScreen\"></div></div>"); //$(load("popup", null, true));

            //
            $popUp.find('#pop-up').html(popUpHTML).find(' > :first-child').addClass("pop-up-content").prepend('<div class="close"></div>');
            $wrapper.append($popUp);

            $popUp.fadeIn(200, function() {
                // Initiate our close button with callback
                $('.close').fastClick(function() {
                    self.closePopUp(function() {
                        callback();
                    });
                });
            });
        },
 		closePopUp: function(callback) {
            var $popUp = $("#pop-up-wrapper");

            callback = callback || function() {};

			if ($("input").is(":focus")) {
                $("input").blur();
                setTimeout(function() {
                    $popUp.find("#pop-up").empty();
                    $popUp.fadeOut(200, function() {
                        $('.ticket.active').removeClass('active');
                        this.hide();

                        callback();
                    })
                }, 500);
			} else {
                $popUp.fadeOut(200, function() {
                    $popUp.find("#pop-up").empty();
					if($("#player").length > 0) {
						Player.resumePlayer();
					}
                    if($('.ticket.active').length > 0) {
                        $('.ticket.active').removeClass('active');
                    }
                    $popUp.hide();
                    callback();
                })
            }
        },
        backButton: function() {
            Sounds.back();

            if(typeof(History.pages) == 'undefined') {
                window.history.back();
                return;
            }
                History.go(-1);
        },
		listMenuRender: function(publishedID, includeSeen, callback) {
	        var self = this,
	            options = {
	                "action": "getListsMenu",
	                "moviePublishedID": publishedID,
	                "includeSeen": includeSeen
	            };

	        if (!callback) callback = function() {};

            self.launchPopUpTwo(function () {
                Api.dispatcher(options, function(lists) {
                    var i = 0,
                        l = lists.length,
                        list = null,
                        listC = '',
                        $listHTML = '';

                    if (l > 0) {
                        for (; i < l; i += 1) {
                            list =  lists[i];
                            if (list.listTypesID != 1 ) { // No History in this list.  History should always have typeID = 1
                                $listHTML = self.makeRow(list, publishedID);
                                listC += $listHTML.html();
                            }
                        }

                        // this is not working for some reason...
                        //var html = _.template(menuTemplate);
                        var html = "<div><div class=\"custom-list-item\"><div class=\"label\"><div></div><span class=\"list-label\">New List</span><span class=\"custom-list-button\"></span></div><form class=\"list-input-form\" movieID=\"\" listID=\"\"><input class=\"custom-list-item text-select-ok\" type=\"text\" placeholder=\"New List\" name=\"new-list\" autocapitalize=\"on\" autocorrect=\"on\" autocomplete=\"off\" /><span class=\"custom-list-close\"></span><input type=\"submit\" /></form></div></div>";

                        var $listHTML = $(html);

                        $listHTML.find(".custom-list-item").attr("movieid", publishedID).find(".list-label").html('New List').end()
                            .find('.list-input-form').attr("movieid", publishedID);

                        if($listHTML.html()) { listC += $listHTML.html(); }

                        listC = '' +
                            '<div id="pop-up-wrapper">' +
                            '<div id="lists-menu">' +
                            '<div id="lists-menu-title">Select a list</div>' +
                            '<div id="menu-scroller-wrapper">' +
                            '<div id="menu-scroller">' + listC + '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>';


                        var player = false;

                        //self.launchPopUp(listC, function() {
                        //    //self.dealloc(player);
                        //    callback();
                        //});



                        self.popupHTML(listC, function() {
                            //UI.initScroller();
                        });
                        self.bindListMenuEvents();

                        //self.initScroller($("#menu-scroller").parent()[0]);
                        //if(self.popupScroller) {
                        //    self.popupScroller.refresh();
                        //} else {
                            self.popupScroller = new iScroll($("#menu-scroller").parent()[0], {
                                hScroll: false,
                                hScrollbar: false,
                                vScrollbar: false,
                                fixedScrollbar: false,
                                bounce: false
                            });
                        //}

                        callback();
                    }
                });
            });

	        return this;
	    },
		makeRow: function(list, publishedID) {
	        var $listHTML = "",
	            camelName = list.list.replace(/ /g, "").toLowerCase(),
	            active = (list.active != 0) ? ' active' : '';

	        $listHTML = $('<div><div class="list-item" movieID="" listID=""><div></div></div></div>');
	        $listHTML.find(".list-item").addClass(camelName).addClass(active).attr("movieid", publishedID).attr("listID", list.ID).find("div").append(list.list);
	        if (list.listTypesID != 5) $listHTML.find(".list-item div").prepend('<span class="list-menu-icon"></span>');
	        return $listHTML;
	    },
        showShareOptions: function(element){

            var mask = $("<div>", {
                id: "settings-mask"
            });
            if(!$("#settings-mask").length){
                $("#" + element).append(mask);
            }
            $("#popup-options").show();
            setTimeout(function(){ 
                $("#settings-mask").addClass("show");
                $("#popup-options").addClass('show');
            }, 400);
        },
        putAwaySlideUp: function(){
            $("#popup-options, #gender-options").removeClass('show');
            $("#settings-mask").removeClass('show');
            setTimeout(function(){ 
                $("#settings-mask").remove();
                $("#popup-options").hide();
            }, 250);
        },
		bindListMenuEvents: function() {
	        var self = this;

	        // fastClick events mess with the scrolling :-(
	        $("#lists-menu").on("click", ".list-item", function() {
	            self.toggleMenuItem($(this));
	        });

	        $(".custom-list-item .list-label, .custom-list-item .custom-list-button").fastClick(function() {
	            $(this).parents(".custom-list-item").find(".list-input-form").addClass("active").find("input").val("").focus();
	        });

	        $(".custom-list-close").fastClick(function() {
	        	self.closeInput();
	        });

	        var click = false;
	
	        // New list button
	        $(".list-input-form").submit(function(e) {
	            e.preventDefault();
	            if (click) return false;
	            click = true;

	            var that = self,
	                val = $(this).find("input.custom-list-item").val();

	            // Can't create a list without a name.
	            if (/^\s*$/.test(val)) {
	                self.closeInput();
	                return false;
	            }

	            var options = {
	                    "action": "createList",
	                    "listName": val,
	                    "moviePublishedID": $(this).attr("movieid"),
	                    "listID": $(this).attr("listID")
	                };

	            if ($(this).hasClass('edit')) options.action = "updateListName";

	            Api.dispatcher(options, function(response) {
	                self.closeInput();
	                var $listHTML = "",
	                    list = {
	                        "ID": response.ID,
	                        "list": options.listName,
	                        "active": 1,
	                        "listTypesID": 5
	                    };

	                    $listHTML =self.makeRow(list, options.moviePublishedID);
	                $("div.custom-list-item").before($listHTML.html());

	                click = false;

	                //that.initScroller();

	            });
	        });
	    },
        imgError: function(image){
            image.onerror = "";
            image.src = "images/discovery/avatar.png";
            return true;
        },
        avatar: function(facebookID, userID){
            facebookID = facebookID || null; 


            var msPop = parseInt(userID) === 252990 ? " msPop" : "", 
                src = facebookID ? "https://graph.facebook.com/"+ facebookID +"/picture?height=100&width=100" : "images/discovery/avatar.png";
                
            var avatar = $('<img />', { 
                class : 'profile-picture'+ msPop, 
                src : src, 
            });


            return avatar[0].outerHTML;
        },
        loadRightMenu: function(options) {
            if(!$("#right-menu").length) {
                var html = APP.load("rightMenu");
                $("#wrapper").prepend(html);
            }
        },
        bindSideMenuEvents: function() {
            $(".nav-menu-item").click(function() {
                var list    = APP.gameState,
                    wClass  = $("#wrapper").attr("class").split(" ")[0],
                    nav     = $(this).data().actionid,
                    listID  = nav === "queue" ? list.watchListID : list.favoriteListID;

                if(nav === "queue") {
                    Backbone.history.navigate('lists/' + listID, true);
                } else {
                    Backbone.history.navigate(nav, true);
                }
                
                if(Analytics) { Analytics.event(nav +" selected"); }

                UI.menuSlideAction();
            });


            // side nav close
            $("#side-nav-close").fastClick(function() {
                UI.menuSlideAction();
                return false;
            });

            var sUpdate = $("#menu-search-form input");
            // set up the auto drop down
            sUpdate.on("input", function(e) {
                var title = $(this).val();
                $("#close-menu-drop").show();

                if(title.length > 2) {
                    Api.findMoviesLikeTitle($(this).val(), function(response) {
                        if(response.data.length > 0) {
                            var html = APP.load("feedSearchResults", { data: response.data });

                            $("#menu-drop div").html(html);
                            $("#menu-drop").addClass("on");

                            $("#menu-drop .result").unbind("click").click(function() {
                                var movieID = $(this).data("movieid");
                                Backbone.history.navigate("movieLobby/" + movieID, true);
                            });

                            UI.deallocScroller();
                            UI.initScroller($("#menu-drop")[0], false);
                            setTimeout(function() {
                                // IN IOS 8 BLUR COLLAPSED DROP DOWN
                                // UI.scroller.on('scrollStart', function () {
                                //     sUpdate.blur();
                                // });
                            }, 500);
                        } else {
                            // hide the drop down
                            $("#menu-drop div").html("<p style=\"padding-left: 10px;\">No results</p>");
                            //$("#menu-drop").removeClass("on");
                        }
                    });
                } else if(title.length === 0) {
                    $("#close-menu-drop").hide();
                } else {
                    // hide the thing
                    $("#menu-drop div").html("");
                    $("#menu-drop").removeClass("on");
                    // remove scroller from it
                }
            });

            /*
             sUpdate.blur(function() {
             sUpdate.val("");
             $("#close-menu-drop").hide();
             $("#menu-drop div").html("");
             $("#menu-drop").removeClass("on");

             UI.deallocScroller();

             return false;
             });
             */

            $(document).on("keydown", function(e) {
                if(e.keyCode == 13) { sUpdate.blur(); }
            });

            $("#close-menu-drop").fastClick(function(e) {
                e.preventDefault();  e.stopPropagation();

                sUpdate.val("");
                $("#close-menu-drop").hide();
                $("#menu-drop div").html("");
                $("#menu-drop").removeClass("on");

                return false;
            });
        },
        rightMenuSlide: function(html) {
            var sideNav = $("#right-menu"),
                delay   = (sideNav.hasClass("open-slide")) ? 500 : 10;

            $("#right-menu .content").html(html);
            $("#wrapper").toggleClass("rightMenu");

            setTimeout(function() {
                $(sideNav).toggleClass('open-slide');
            }, delay);
        },
        loadConversations: function(el, callback) {
            callback = callback || function() {};
            Api.getConversations(function(data) {
                var html = APP.load("messages", { conversations: data.conversations.reverse(), userData: data.userData.reverse(), userID: data.userID });
                el.html(html);
                callback();
            });
        },
		toggleMenuItem: function(self) {
	        var options = {
	                "listID": $(self).attr("listID"),
	                "moviePublishedID": $(self).attr("movieid")
            };
		
	        $(self).toggleClass("active");

	        if ($(self).hasClass("active")) {
	            options.action = "setMovieToList";
	        } else {
	            options.action = "unsetMovieFromList";
	        }

	        if ($(self).hasClass("seen")) $('.row-seen[rel="' + options.moviePublishedID + '"]').toggleClass("active");

	        Api.dispatcher(options, function(success) {
	            if (!success.success) {
	                $(self).toggleClass('active');
	                if ($(self).hasClass("seen")) $('.row-seen[rel="' + options.moviePublishedID + '"]').toggleClass("active");
	            }
	        });
	    },
		closeInput: function() {
	        var self = this;
	        self.click = true;
	        setTimeout(function() {
	            $(".list-input-form").removeClass("active").find("input.custom-list-item").blur();
	            self.click = false;
	        }, 0);
	    },
        initScroller: function(target, save) {
            var self = this;
            if (typeof save === 'undefined') { save = true; }
            if (!target) {
                target = $(this.defaultScrollTarget).parent()[0];
                if(!target) {
                    target = "scroller";
                }
            }
            if(save) { APP.scrollerEle = target; }
            _.defer(function() { // Important.  Sometimes fails to initialize without!!
                if (self.scroller)
                    self.scroller.destroy();
                self.scroller = new window.IScroll(target, {
                    vScrollbar: false,
                    hScroll: false,
                    click: true
                });
                self.scroller.scrollTo(0, 0, 0.2);  
            });
        },
        initScrollerOpts: function(target, options) {
            var self = this;
            if (!target) {
                target = $(this.defaultScrollTarget).parent()[0];
                if(!target) {
                    target = "scroller";
                }
            }
            APP.scrollerEle = target;
            _.defer(function() { // Important.  Sometimes fails to initialize without!!
                if (self.scroller) { self.scroller.destroy(); }
                self.scroller = new window.IScroll(target, options);
            });
        },
        initInfiniteScroller: function(target, elements, dataSet, dataFiller) {
            var self = this;
            if (!target) {
                target = $(this.defaultScrollTarget).parent()[0];
                if(!target) {
                    target = "scroller";
                }
            }

            _.defer(function() {
                if (self.scroller)
                    self.scroller.destroy();
                self.scroller = new window.IScroll(target, {
                    mouseWheel: false,
                    infiniteElements: elements,
                    dataset: dataSet,
                    dataFiller: dataFiller,
                    cacheSize: 10
                });
            });
        },
        bindMovieRowEvents: function(other) {
            other = other || false;
            //Load specific lists (favorites, queue, seen)
            $(".lists-row").unbind("click").click(function(e){
                e.preventDefault();
                if(other) {
                    var navigate = "otherList/" + $(this).attr("listid");
                } else {
                    var navigate = "lists/" + $(this).attr("listid");
                }

                Backbone.history.navigate(navigate, true);
            });

            $(".list-button").unbind("click").click(function(e){
                e.preventDefault();
                e.stopPropagation();

                var publishedID = $(this).closest('.list-row').data("moviepublishedid"),
                    movieID = $(this).closest('.list-row').data("movieid"),
                    isQueued = $(this).siblings(".queue-button").hasClass("off"),
                    userSeenListID = APP.gameState.seenListID,
                    userQueueID = APP.gameState.watchListID,
                    listID = $(this).data("listid"),            //get list id from button data attr
                    favSeen = listID != userQueueID ? true : false,
                    set = $(this).hasClass("off") ? true : false; // set the add or remove from list functionality for the api

                //update list
                Api.setMovieToFabricList(publishedID, listID, set); 

                $(this).toggleClass("off");

                //If queue is active and seen of favorite is clicked 
                //remove movie from queue and update DOM
                if(favSeen && set && !isQueued){
                    $(this).siblings(".queue-button").addClass("off");      //only update sibling queue button
                    Api.setMovieToFabricList(publishedID, userQueueID, false);
                }

                if(listID == APP.gameState.favoriteListID && set) {
                    Api.createFeed("favorite", movieID);
                    // Api.setMovieSeen(publishedID, true);
                    $(this).siblings(".seen-button").removeClass("off");
                } else if(listID == APP.gameState.watchListID && set) {
                    Api.createFeed("queue", movieID);
                }
            });
            $(".list-movie-image").unbind("click").click(function(e){
                e.preventDefault();
                var movieID = $(this).closest('.list-row').data("movieid");
                Backbone.history.navigate("movieLobby/" + movieID, true);
            });


            $("#new-list").unbind("click").click(function(){
                Backbone.history.navigate("search/:" + $("#list-movies").data("listid"), true);
            });
            $(".add-to-list").unbind("click").click(function(e){
                e.preventDefault();
                e.stopPropagation();
                var movieID = $(this).closest(".list-row").data("moviepublishedid"),
                    listID = $(this).data("listid");

                Api.setMovieToFabricList(movieID, listID, true)
                $(this).toggleClass("on");

            });
            $(".recommended-by").unbind("click").click(function(){
                var moviePublishedID = $(this).closest(".list-row").data("moviepublishedid");

                Backbone.history.navigate("recommendedByList/" + moviePublishedID, true);
            });
	    },
        userList: function(){
            Backbone.history.navigate("lostOfUsers", true);
        },
		listMenuPopUp: function(ele) {
			var self = this;
			if (self.click) return;
            self.click = true;

            var that = ele,
                includeSeen = true;

            if ($(ele).siblings(".row-seen.hidden").length > 0) { includeSeen = false; }

            $(ele).addClass('active');
            Sounds.standardButton();

            self.listMenuRender($(ele).attr('rel'), includeSeen, function() {
                self.click = false;
                $(that).removeClass('active');
            });
		},
		ticketPopUp: function(ele) {
			var self = this;
			
			if (self.click) return;
            self.click = true;

            Sounds.standardButton();
			var moviePublishID = $(ele).attr('rel');

            self.launchPopUpTwo(function() {
                Api.getPurchaseLinks(moviePublishID, function(response) {
                    if(!response || response.length <= 0) {
                        var html = "<div class=\"share-pop-up-wrapper pop-up-border\"><div>Great choice but this movie is not available at this time. Check back soon!</div></div>";
                        self.popupHTML(html);
                    } else {
                        $.get('templates/rentLink.html', function(html) {
                            var html = _.template(html, { items: response });
                            self.popupHTML(html);
                        });
                    }
                });
            });
		},
		socialShare: function(ele) {
			var html = "<div class=\"share-pop-up-wrapper\"><div class=\"share-with-facebook\"><span>Share with Facebook</span></div><div class=\"share-with-twitter\"><span>Share with Twitter</span></div></div>";
									
			this.launchPopUp(html, function() {
				$(ele).removeClass("active");
			});
		},
		deallocScroller: function() {
            if (this.scroller !== null) {
                this.scroller.destroy();
                this.scroller = null;
            }
        },
        dealloc: function() {
            this.deallocScroller();
        },
    	clear: function() {
			$("#wrapper").empty();
		},
		loadListRow: function() {
			$("#wrapper").append("<div id=\"list-row-wrapper\"><div id=\"list-row\"></div></div>");
		},
		clearList: function() {
			this.clear();
			this.loadListRow();
		},
        popupHTML: function(html, callback) {
            callback = callback || function() {};
            var self = this;

            $popUp = $("#pop-up-wrapper");
            $popUp.find('#pop-up').html(html).find(' > :first-child').addClass("pop-up-content").prepend('<div class="close"></div>');

            //if(Util.isMobile()) {
                $popUp.find(".commerce").fastClick(function() {
                    Util.handleExternalUrl(this);
                });
            //}

            $('.close').fastClick(function() {
                self.closePopUp(function() {
                    self.active = false;
                    callback();
                });
            });

            self.click = false;
        },
        getFeedText: function(list) {
            var type = list.eventType,
                obj = list.object,
                name = list.userName,
                text = "";

            // Event types correspond to list types.
            if (type == 2) {
                text = " favorited: ";
            } else if (type == 3) {
                text = " wants to see: ";
            } else if (type == 5) {
                text = " added a film to: " + obj;
            } else if (type == 99) {
                text = " played: ";
            } else if (type == 100) {
                text = " has leveled up to: ";
            } else if (type == 1000) { // Not a FB user
                return "You must be logged in with a Facebook account to filter by friends!";
            } else if (type == 1001) { // FB user has 0 Fabric friends :-(
                return "None of your friends are playing Fabric.  Invite some!";
            }

            return name + text;
        },
        updateAllNumbers: function() {
            var i = 1;
            $(".list-row").each(function() {
                var newNum = i++;
                $(this).find(".number").html(newNum);
            });
        },
        bindPlayButtons: function() {
            $('.play-now').fastClick(function() {
                var movieOptions = {
                    movieID: $(this).attr('movieid'),
                    categoryID: $(this).attr('categoryid'),
                    listID: $(this).attr('listid')
                }
                APP.playerDispatcher(movieOptions);
            });
        },
        toggleNotifications: function() {

            var self = this;
            if($("#notifications-container").length) {

                $("#notifications-container").toggleClass("open");

                $("#notifications-menu").toggleClass("on");


                if($("#notifications-container").hasClass("open")) {
                    // self.oldScrollPos = parseInt(UI.scroller.y);
                    self.oldTitle = $("header nav h1").html();
                    
                    $("header nav h1").html("Notifications");
                    Api.getNotifications(function(response) {
                        self.bindNotificationEvents(response.notifications);
                        APP.click = false;
                    });
                } else {
                    $("header nav h1").html(self.oldTitle);
                    self.oldTitle = null;
                    if(self.oldScrollID) {
                        if(self.oldScrollPos != 0) {
                            // UI.initScrollerOpts($("#"+self.oldScrollID)[0], {
                            //     vScrollbar: false,
                            //     hScroll: false,
                            //     bounce: true,
                            //     click: true,
                            //     startY: self.oldScrollPos
                            // });
                            // self.oldScrollPos = 0;
                        } else {
                            // UI.initScroller($("#"+self.oldScrollID)[0]);
                        }
                    }
                    APP.click = false;
                }
            } else {
                // if(UI.scroller) {
                //     self.oldScrollID = UI.scroller.scroller.parentElement.id;
                //     self.oldScrollPos = parseInt(UI.scroller.y);
                // }
                $("#wrapper").append("<div id=\"notifications-container\" class=\"open\"></div>");
                $("#notifications-menu").addClass("on");
                Api.getNotifications(function(response) {
                    self.bindNotificationEvents(response.notifications);
                    APP.click = false;
                });
                self.oldTitle = $("header nav h1").html();
                $("header nav h1").html("Notifications");
            }
        },
        bindNotificationEvents: function(notifications) {
            var html = APP.load("notifications", { notifications: notifications });
            $("#notifications-container").html(html);
            $("#notifications-num").html("").hide();
            Api.notificationsSeen();
            // setTimeout(function() { UI.initScroller($("#notifications-container")[0]) }, 10);

            $(".notification .content").click(function(e) {
                var objectID = $(this).parent().data("objectid");
                var objectType = $(this).parent().data("objecttype");
                var notificationType = $(this).parent().data("notificationtype");
                var senderID = $(this).parent().data("senderid");

                if(notificationType == "comment" || notificationType == "thread") {
                    APP.feedPos = self.oldScrollPos;
                    Backbone.history.navigate("feedDiscussion/" + objectID, true);
                } else if(notificationType == "follow") {
                    Backbone.history.navigate("profile/" + senderID, true);
                } else if("followback") {
                    Backbone.history.navigate("profile/" + senderID, true);
                } else {
                    APP.feedPos = self.oldScrollPos;
                    Backbone.history.navigate("feedLikes/" + objectID, true);
                }
                var params = { type: notificationType};
                if(Analytics) Analytics.eventAndParams("Notification tapped", params);
            });

            $(".notification .avatar").click(function(e) {
                var senderID = $(this).parent().data("senderid");
                Backbone.history.navigate("profile/" + senderID, true);
                if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "Notifications" });
            });
        },
        noConnection: function(options, callback) {
            if($("#no-connection").length) {
                return false;
            }

            var html = APP.load("noConnection");
            $(html).appendTo("#wrapper").click(function() {
                $("#no-connection p").html("Loading...");
                $("#retry").addClass("spin");

                
                Api.fetch(options, callback);
                // add rotating animation
                return false;
            });
        }
}
