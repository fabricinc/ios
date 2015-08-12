
	var MobileDevice = {
		onDeviceReady: function() {
            setTimeout(function() {
                cordova.exec(null, null, "SplashScreen", "hide", []);
            }, 500);


			var self = MobileDevice;
		    // all the listeners for online, offline, pause, etc.
            //TODO: These eventListeners were not working, U suspect because this is not being correctly set somehow
		    document.addEventListener("offline", self.onDeviceOffline, false);
		    document.addEventListener("online", self.onDeviceOnline, false);
		    document.addEventListener("pause", self.onDevicePause, false);
		    document.addEventListener("resume", self.onDeviceResume, false);

		    //document.addEventListener("batterycritical", function() { APP.Player.resumePlayer() }, false);
            //document.addEventListener("batterylow", function() { APP.Player.resumePlayer() }, false);

            // Get token for Push notifications
 			MobileDevice.setPushNotifications();

            //MobileDevice.getGeolocation(function(pos) {
            //    console.log("getGeolocation callback");
            //    console.log(pos);
            //    Api.updateUserGeoData(pos);
            //});

		    Util.log("onReady Fired");

		    // starting the application here
            // pre-load all the templates and store them for later use
            APP.loadTemplates();
		},

		setPushNotifications: function(){
			
		    var pushOptions = {
		            "badge":"true",
			        "sound":"true",
			        "alert":"true",
			        "ecb":"onNotificationAPN"
		    };

		    window.plugins.pushNotification.register(getToken, pushError, pushOptions);
		    
		    function getToken(token){ APP.token = token; }
		    
		    function pushError(error){  }
		},

		getGeolocation: function(callback) {
		    callback = callback || function() {};
		    if (navigator.geolocation) {
		        navigator.geolocation.getCurrentPosition(function(pos) {
		            callback(pos);
		        });
		    } else {
		        callback();
		    }
		},
		networkConnectionIsFast: function() {
		    var state = MobileDevice.getNetworkState();
		    return state == cordova.ETHERNET ||
		        state == cordova.WIFI ||
		        state == cordova.CELL_4G;
		},
		networkConnectionIsSlow: function() {
		    return (MobileDevice.networkConnectionIsFast() === false);
		},
		connectionIsWIFI: function() {
		    var state = MobileDevice.getNetworkState();
		    return state == cordova.WIFI;
		},
		connectionIsCellular: function() {
		    try {
		        var state = MobileDevice.getNetworkState();

		        var isCellular =  state.type == "2g" ||
		            state.type == "3g" ||
		            state.type == "4g" ||
		            state == cordova.CELL_2G ||
		            state == cordova.CELL_3G ||
		            state == cordova.CELL_4G;
		        return isCellular;
		    }
		    catch (e) {
		        Util.log("Error getting isCellular", e);
		        return false;
		    }
		    finally {
		        return isCellular;
		    }
		},

		//
		//MobileDevice.connectionIs2G = function() {
		//    var state = getNetworkState();
		//    return state == Connection.CELL_2G;
		//}
		//
		//MobileDevice.connectionIs3G = function() {
		//    var state = getNetworkState();
		//    return state == Connection.CELL_3G;
		//}
		//
		//MobileDevice.connectionIs4G = function() {
		//    var state = getNetworkState();
		//    return state == Connection.CELL_4G;
		//}

		getNetworkState: function() {
		    var networkState;
		    try {
		        networkState = navigator.network.connection;
		    }
		    catch(ex) {
		        Util.log("could not access connection type: " + ex);
		    }
		    finally {
		        return networkState;
		    }
		},
		report: function(msg) {
		    Util.log(msg);
		},
		onDeviceOffline: function() {
            //MobileDevice.report('going into offline mode');
		    //$.blockUI({ message: '<div class="blocking-dialog"><img src="images/waitingForInternet.gif"><p><h1>waiting for internet connection...</h1></div>' });
            Util.CenterItem('.blocking-dialog');
		},
		test: function() {
            MobileDevice.onDeviceOffline();
		},
		onDevicePause: function() {
		    if ($('#wrapper').hasClass("player")) {
		        //APP.playerBackButton();
                Util.log("on device pause");
		    }
            Util.log('going into pause mode');
		},
		onDeviceResume: function() {
		    MobileDevice.checkNetworkConnection();
		    if (!APP.click) {  // Will be false unless we're waiting for Facebook login.
		        Api.getFabricState(function(response) {
                    Util.log(response);
                    Util.log("game state is ok.");
		            if (response.success) {
		            	if(APP.url.set) { APP.dispatcher(APP.url.route); }   // IF deep route URL is set take them to that route
		            } else { // WTF happened to our session?
		                Util.log("game state NOT ok. login again");
		                APP.dispatcher("rate");
		            }
		        });
		    } else {
		        APP.click = false;
		    }
		},
		onDeviceOnline: function() {
		    //$.unblockUI();
			this.checkNetworkConnection();
            Util.log('device online');
		    //if ($("#wrapper").hasClass("player")) { APP.skipMovie(); }
		},
		displayCellularWarning: function() {
			Util.alert('This networked game is very data-intensive. You may want to connect to a WIFI network.', 'Cellular Network Warning');
		},
		checkNetworkConnection: function() {
		    if(MobileDevice.connectionIsCellular()) {
                MobileDevice.displayCellularWarning();
		    }
		}
	}

