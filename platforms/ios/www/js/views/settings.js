	var SettingsModel = Backbone.Model.extend({

		initialize: function() {

    	},
	    bindEvents: function() {
	    	var s = APP.gameState,
	    		minAge = parseInt(s.matchMinAge),
	    		maxAge = parseInt(s.matchMaxAge),
	    		distance = parseInt(s.matchMaxDistance);

	        $("button.settingsNotifications, button.settingsSocial").click(function(e) {
	        	e.preventDefault();
	        	e.stopPropagation();
	        	var nav = $(this).attr("class").split(" ")[1];

	        	Backbone.history.navigate("settings/" + nav, true);
	        });

	        $("#logout").click(function() {
	        	Backbone.history.navigate("logout", true);
	        });

	        $("#age-slider").slider({
	        	min: 18,
	        	max: 60,
	        	step: 1,
	        	range: true,
	        	values: [ minAge , maxAge ],
	        	slide: function(event, ui) {
	        		var rangeDisplay = ui.values[1] == 60 	? ui.values[0] + " - No Limit" 
	        												: ui.values[0] + " - " + ui.values[1];
	        		$("#age-range").html(rangeDisplay);
	        	},
	        	stop: function(event, ui) {
	        		var preference = ui.values[0] === ui.value ? "matchMinAge" : "matchMaxAge",
	        			value = ui.values[0] === ui.value ? ui.values[0] : ui.values[1];
	        		
	        		Api.updateUserPref(preference, value);
	        	}
	        });

	        $("#distance-slider").slider({
	        	min: 1,
	        	max: 50,
	        	step: 1,
	        	range: "min",
	        	value: distance,
	        	slide: function(event, ui) {
	        		var distanceDisplay = ui.value == 50 ? "No Limit" : ui.value + " Miles";
	        		$("#distance-range").html( distanceDisplay );
	        	},
	        	stop: function(event, ui) {
	        		var value = ui.value.toString(),
	        			preference = "matchMaxDistance";

                    if(parseInt(value) >= 50) {
                        value = "20000";
                    }

	        		Api.updateUserPref(preference, value);
	        	}
	        });

	        $(".gender-settings span").click(function(){
	        	var value = $(this)[0].id;

	        	if(!$(this).hasClass("active")){
	        		$(this).siblings().removeClass("active").end().toggleClass("active");
	        		Api.updateUserPref("matchGender", value);
	        	}
	        });

	        /*$(".gender-settings").fastClick(function(){

	        	var buttonID = s.matchGender == "all" ? "everyone" : s.matchGender;

	        	$("#"+ buttonID).addClass("active"); //find selected gender button and add class acitve
	        	var mask = $("<div>", {
	        		id: "settings-mask"
	        	});
	        	$("#settings-wrapper").append(mask);
	        	$("#gender-options").show();
	        	setTimeout(function(){ 
		        	$("#settings-mask").addClass("show");
		        	$("#gender-options").addClass('show');
	        	}, 400);
	        });

	        $("#gender-options :button").fastClick(function(){
	        	var value = $(this).attr('id') === "everyone" ? "all" : $(this).attr('id'),
	        		preference = "matchGender";

	        	if(value != "done" && !$(this).hasClass("active")){	//only update api and buttons if a new value is selected
		        	$(this)	.siblings('.active') //Remove current element with class active
		        			.attr("class", ' ');

		        	$(this).addClass("active");  //Add active to current

		        	$("#gender").html($(this).attr('id'));

		        	Api.updateUserPref(preference, value);
	        	}
	        	UI.putAwaySlideUp();
	        });

	        $("#done").fastClick(function(){
	        	$("#gender-options").removeClass('show');
	        	$("#settings-mask").removeClass('show');
	        	setTimeout(function(){ 
	        		$("#settings-mask").remove();
	        		$("#gender-options").hide();
	        	}, 250);
	        });*/

	        $(".onoffswitch").click(function(e){
	        	e.preventDefault();		e.stopPropagation();

	        	var checkbox = $(this).children(':first'),
	        		checked = !checkbox.prop('checked'),	//flip value with ! 
	        		preference = checkbox.attr('id'),		//preference we are changing 
	        		value = checked | 0;					//Convert boolean to number

	        	checkbox.prop('checked', checked); 			//Toggle check box
	        	Api.updateUserPref(preference, value);		//Update API and gameState

	        	return false;
	        });

	        $(".settingsTerms, .settingsPrivacy").click(function() {

	        	var link = $(this).hasClass("settingsTerms") ? "TOS/" : "privacy/",
	        		prefix = 'http://www.tryfabric.com/';

	        	window.open(prefix + link, '_blank', 'location=yes');
	        });
	        $('#freebase').fastClick(function(){
	        	window.open('https://www.freebase.com/', '_blank', 'location=yes');
	        });

            $(".settingsAccount").fastClick(function(e) {
                e.preventDefault();
                e.stopPropagation();

                Backbone.history.navigate("settings/editAccount", true);

                return false;
            });
	    }
    });

    var SettingsView = Backbone.View.extend({
		model: null,
		id: "settings",
		template: "settings",
		backButton: "back",
		click: false,
		
        initialize: function(options, callback) {
			var self = this;
			options = options || {};
            callback = callback || function() {};

            this.template = (typeof options.template !== 'undefined') ? options.template : this.template;
			this.model = new SettingsModel();

            return this;
        },

        render: function(callback) {
			var self = this,
				facebookConnect = User.isFacebook ? "Connected" : "Connect",
				heading = self.template !== "settings" ? self.template.split("settings")[1] : "Settings";
            if(self.template == "editAccount") { heading = "Edit Account"; }

			var html = APP.load(self.template, { settings: APP.gameState });
	        self.$el.html(html);
	        
	        if (!self.header) { 
	            self.header = new HeaderView({
	                leftButton: { class: self.backButton },
	                title: heading
	            }); 
	            self.$el.prepend(self.header.el);
	        }

			$("#wrapper").html(self.$el);
			$("#fb-connected").html(facebookConnect);

			self.model.bindEvents();

            // dynamic binding of events by template name, to bind different actions for different templates
            if(this[self.template]) {
                this[self.template]();
            }

			$("#"+ APP.gameState.matchGender).addClass("active");

            //UI.initScroller($("#settings-wrapper")[0]);

			callback();
        },

        editAccount: function() {
            var self = this;
            // binds the edit account functions
            $("#logout").unbind("click").click(function() {
                if(!self.click) {
                    self.click = true;
                    navigator.notification.confirm("Are you sure you want to delete your account?", function(button) {
                        if(button === 1) {}
                        if(button === 2) {
                            Api.deleteAccount(function() {
                                self.click = false;
                                Backbone.history.navigate("logout", true);
                            });
                        }
                        self.click = false;
                    }, "Delete Confirmation", ["Cancel", "Delete"]);
                }
                return false;
	        });

            $("#update").fastClick(function() {
                if(self.click) { return false; }
                self.click = true;

                var email = $("#email").val();
                var name = $("#name").val();
                var age = $("#age").val();

                if(email == "" || name == "") {
                    // call method to let them know which is wrong?
                    return false;
                }
                // else make data package to send
                var data = {
                    email: email,
                    name: name,
                    age: age
                }
                Api.updateUserInfo(data, function(response) {
                    if(response.success) {
                        APP.gameState.age = response.data.age;
                        APP.gameState.email = response.data.email;
                        APP.gameState.uName = response.data.name;
                        var message = "Your account information has been updated";
                    } else {
                        var message = "Oops! Something went wrong while saving your account information.";
                    }
                    navigator.notification.confirm(message, function(button) { self.click = false; }, null, ["Ok"]);
                });

                return false;
            });
        },

        settingsMatch: function() {
            var ageRange = $("#age-slider").slider("values", 0 ) + " - " + $("#age-slider").slider("values", 1 ),
                distance = $("#distance-slider").slider("value");
            $("#age-range").html(ageRange);
            $("#distance-range").html( distance + " Miles" );
        },

        dealloc: function() {
            self.click = false;
        }
    });