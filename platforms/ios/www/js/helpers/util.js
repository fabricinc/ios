var Util = {};

// global variables
var MIN_TABLET_PIXEL_WIDTH = 500;

// public functions
Util.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

Util.isFunction = function(possibleFunction) {
    return (typeof(possibleFunction) == typeof(Function));
};

Util.addCommas = function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3}),?/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};
Util.defined = function(variable) {

    return typeof variable === 'undefined' ? false : true;
};

Util.isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
Util.profilePic = function(userId){
    
};

// an enumeration of browser types
Util.browserType = {
    ipad : {value: 0, name: "ipad"},
    ipadRetina : {value: 1, name: "ipad retina display"},
    iphone : {value: 2, name: "iphone"},
    iphoneRetina : {value: 3, name: "iphone retina display"},
    androidPhone : {value: 4, name: "android phone"},
    androidTablet : {value: 5, name: "android tablet"},
    other : {value: 6, name: "other web browser"}
};

Util.detectBrowserType = function() {
    var agent = navigator.userAgent.toLowerCase();
    var hash = window.location.hash;

    if (hash == "#other") return Util.browserType.other;

    // is this an iPad?
    if(agent.match(/ipad/)) {
        if(isRetinaDisplay())
            return Util.browserType.ipadRetina;
        else
            return Util.browserType.ipad;
    }
    // is this an iphone?
    else if (agent.match(/iphone/)) {
        if(isRetinaDisplay())
            return Util.browserType.iphone;
        else
            return Util.browserType.iphoneRetina;
    }
    // is this android?
    else if (agent.match(/android/)) {
        if(isPhone())
            return Util.browserType.androidPhone;
        else
            return Util.browserType.androidTablet;
    }
    else {
        return Util.browserType.other;
    }
};

Util.validArray = function(array, filter){
    array = array || null;
    filter = filter || null;
    var validArray = [], invalidArray = [], returnArray = [];

    $.each(array, function(i, val){
        if(val[filter] && val[filter] !== ""){
            validArray.push(val);
        } else {
            invalidArray.push(val);
        }
    });
    return returnArray = [validArray, invalidArray];
};
Util.sortFunction = function(property) {
    var sortOrder = 1,
        numberFilters = ["criticsScore", "totalCount", "Count"],
        dateFilters = ["releaseDate", "modified"];


    if(numberFilters.indexOf(property) !== -1) { //Show these in reverse order
        var numb = true; 
        sortOrder = -1; 
    } else if(dateFilters.indexOf(property) !== -1) {
        var date = true;
        sortOrder = -1;
    } 

    return function (a,b) {
        if(numb) {
            var result = ( parseInt(a[property]) < parseInt(b[property]) ) ? -1 : ( parseInt(a[property]) > parseInt(b[property]) ) ? 1 : 0;
        } else if(date) {
            var result = new Date(a[property].slice(0,10)) - new Date(b[property].slice(0,10));
        } else {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        }
        return result * sortOrder;
    };
};
Util.trailerPlayer = function(){
    var player = $("video"), //object for video player
        trailer = player[0], //object for current trailer (play - pause)
        loader = $("#trailer-loader");
    
    trailer.addEventListener("loadstart", function() {
        setTimeout(function() {
            loader.show();
        }, 250);
    }, false);

    trailer.addEventListener("playing", function() {
        trailer.currentTime = 0;
        loader.hide();
    }, false);

    //pressed 'done' and exited full screen
    trailer.addEventListener("webkitendfullscreen", function() {
        setTimeout(function(){
            player.css({ "top": "460px" });
            loader.hide();
        },250);
        setTimeout(function(){
            player.hide();
            // player.remove();
        },400);
    }, false);

    // Error occurs with playback
    trailer.addEventListener("error", function() {
        player.css({ "top": "460px" });
        loader.hide();
        setTimeout(function(){
            player.hide();
            player.remove();
        },400);
    });

    // Trailer ends and exits full screen then disappears 
    trailer.addEventListener("ended", function(){
        trailer.webkitExitFullscreen();
        setTimeout(function(){
            player.css({ "top": "460px" });
            
        },250);
        setTimeout(function(){
            player.hide();
            // player.remove();
        },400);
    }, false);
};
Util.createShareLink = function(isMovie, itemId){
    var link = Api.appSettings.shareLocation,
        route = isMovie ? "/item.php?movieID=" + itemId 
                        : "/list.php?listID=" + itemId + "&category=true";

    return link + route; 
};
//detect if ipad 
Util.isIPad =  function(){
    var iPad = navigator.userAgent.match("iPad");
    if (iPad) { return true; }
    else { return false; }
};
// simple property to get if this is a mobile device
Util.isMobile = function() {
    return Util.detectBrowserType() != Util.browserType.other;
};

Util.vAlign = function (e) {
    $(e).each(function () {
        var el = $(this).children(':first');
        var ph = $(this).height();
        var ch = el.height();
        var mh = (ph - ch) / 2;
        el.css('top', mh);
    });
};

Util.log = function(text, e) {
    var text = text + ((e) ? ": " + e : "");
    if (LOGGING) console.log(text);
};

// centers an item both horizontally and vertically
Util.CenterItem = function(theItem){
    var winWidth=$(window).width();
    var winHeight=$(window).height();
    var windowCenter=winWidth/2;
    var itemCenter=$(theItem).width()/2;
    var theCenter=windowCenter-itemCenter;
    var windowMiddle=winHeight/2;
    var itemMiddle=$(theItem).height()/2;
    var theMiddle=windowMiddle - (itemMiddle + (itemMiddle * .75)); //a bit off vertical center
    if(winWidth>$(theItem).width()){ //horizontal
        $(theItem).css('left',theCenter);
    } else {
        $(theItem).css('left','0');
    }
    if(winHeight>$(theItem).height()){ //vertical
        $(theItem).css('top',theMiddle);
    } else {
        $(theItem).css('top','0');
    }
};

// use the native alert on mobile devices
Util.alert = function(message, title, buttonName, callback) {
    if (!title) title = "Fabric Alert";
    if (!buttonName) buttonName = "OK";
    if (!callback) callback = function(){};

    if(Util.isMobile()) {
        navigator.notification.alert(message, callback, title, buttonName);
    } else {
        alert(message);
        callback();
    }

    callback();
};

Util.getBitRate = function() {
    var bit_rate;
    if (Util.isMobile() === true && MobileDevice.networkConnectionIsSlow() === true) {
        bit_rate = 212;
    } else {
        if (localStorage.highDef === "true") {
            bit_rate = 1500;
        } else {
            bit_rate = 750; //750;
        }
    }
    return bit_rate;
};

// Loads an image as a css background and adds fade-in class on load.
Util.loadImage = function(url, $container, customSize) {
    var img = new Image,
        css = {
            "background-image": "url(" + url + ")", "background-repeat": "no-repeat"
        };

    if (!customSize) {
        css["background-size"] = "auto 100%";
    }

    img.onload = function() {
        $container.css(css).removeClass("fade-out").addClass("fade-in");
        delete img;
        return true;
    }

    img.src = url;
}

// private (helper) functions

// Trying to detect a 2 x resolution device such as retina display
// ... and since Safari is the only browser to expose the
// devicePixelRatio property this is ios-specific.
function isRetinaDisplay() {
    if(window.devicePixelRatio) {
        return window.devicePixelRatio  > 1;
    }
    return false;
}

// trying to figure out if this is mobile phone device
Util.isPhone = function() {
    if (!Util.isMobile()) return false;
    return (window.screen.width <= MIN_TABLET_PIXEL_WIDTH || $("#wrapper").width() <= MIN_TABLET_PIXEL_WIDTH);
}

// trying to figure out if this is tablet device
Util.isTablet = function() {
    return ($(window).width() >= 768);
}

// Will load js or css files
Util.loader = function(src, callback) {
    var type = src.slice(src.length - 3, src.length);

    if (!callback) callback = function() {};

    if (type === ".js") {
        var script = document.createElement("script");
        script.src = src;
        var el = document.getElementsByTagName("script")[0];
        el.parentNode.insertBefore(script, el);
        el.onload = callback;
    } else if (type === "css") {
        var css = document.createElement("link");
        css.href = src;
        css.rel = "stylesheet";
        var el = document.getElementsByTagName("link")[0];
        el.parentNode.insertBefore(css, el);
    } else {
        Util.alert('No loader for type: ' + type);
    }
}

Util.touchHandler = function(event) {
    var touches = event.changedTouches,
        first = touches[0],
        type = "";

    var $target = $(event.target);
    if( $target.hasClass('drag-icon') ) {
        event.preventDefault();

        switch(event.type) {
            case "touchstart": type = "mousedown"; break;
            case "touchmove":  type = "mousemove"; break;
            case "touchend":   type = "mouseup"; break;
            default: return;
        }
        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }
}

// Will invoke URLSchemeSniffer plugin.  Runs asynchronously.
Util.schemeSniffer = function(scheme, callback) {
    if (!callback) callback = function() {};

    if (Util.isMobile() === false) {
        callback(true);
    } else {
        return cordova.exec(function(result) {
            result = (result == 1 ? true : false)
            Util.log("scheme " + scheme + " supported: " + result);
            callback(result);
        }, function() {
            callback('sniffer sneezed');
        }, 'URLSchemeSniffer', 'urlSchemeSupported', [scheme]);
    }
}

Util.hasSent = false;

Util.linkSent = function() {
    var self = this;
    this.hasSent = true;
    setTimeout(function() {
        self.hasSent = false;
    }, 1000);

}

Util.handleExternalUrl = function(el) {
    if(this.hasSent) {
        return false;
    }

    console.log( 'external' );

    var link = $(el).attr("href"),
        vendor = $(el).data("vendor"),
        appOnlyVendors = [
            'fandango',
            'crackle',
            'spotify',
            'netflix',
            'itunes',
            'amazon',
            'vudu',
            'hulu'
        ];


    // is this an in-app purchase from itunes store?
    if(vendor == 'itunes') {
        link = decodeURIComponent(link);
        cordova.exec(
            function() {
                // will open in iTunes store inside of our app - ios is >= 6.0
                Util.log("iTunesPlugin can open store locally");
                // regex to extract the itunes product id from the passed url
                var matches = /id(\d+)/.exec(link);
                if(matches.length > 0) {
                    var productId = matches[1];
                    // launch the store
                    cordova.exec(
                        function() {
                            Util.log("iTunesPlugin called the success callback");
                            window.scrollTo(0,0);
                        },
                        function() {
                            Util.log("iTunesPlugin called the failure callback");
                            window.scrollTo(0,0);
                            openStore(); // timeout - took > 10 seconds, or failed. Open external store.
                        },
                        "iTunesPlugin", "openStoreWithProductId", [productId]);
                }
            },
            function() {
                Util.log("iTunesPlugin can NOT open store locally");
                openStore(); // will open in iTunes store outside of our app - ios is < 6.0
            },
            "iTunesPlugin", "canOpenStoreInApp", []
        );
    } else {
        openStore();
    }

    function openStore() {
        var appLinks = {
            'netflix' : "https://itunes.apple.com/us/app/netflix/id363590051",
            'spotify' : "https://itunes.apple.com/us/app/spotify-music/id324684580?mt=8",
            'amazon' : "https://itunes.apple.com/us/app/amazon-instant-video/id545519333?mt=8"
        }
        Util.schemeSniffer(link, function(result) {
            if (result) {
                if ((appOnlyVendors.indexOf(vendor) !== -1)) {  // app 2 app required
                    if (vendor === 'fandango') {
                        webView(link);
                    } else {
                        window.location = link;
                    }
                } else {
                    // No app 2 app required.  Open with web view.
                    Util.linkSent();
                    webView(link);
                }
            } else { // url not supported so we are sending most of them to the app store
                if (vendor === 'fandango') {
                    // Web view.
                    Util.linkSent();
                    webView(link);
                } else {
                    window.location = appLinks[vendor];
                }
            }
        });
    }

    function webView(link) {
        if (Util.isMobile()) {

            window.open(link, '_blank', 'location=yes'); // Deprecated: ChildBrowser.showWebPage(link);
            
            return false;
        }
    }
    if ($(el).hasClass("commerce")) {
        Analytics.logShoppingLinkSelected(vendor, $(el).attr("publishedid"));
    }
}

Util.getCurrentHour = function() {
    var t = new Date();
    return t.getHours();
}

Util.getTranslateX = function(elID) {
    function matrixToArray(matrix) {
        return matrix.substr(7, matrix.length - 8).split(', ');
    }

    elID = document.getElementById(elID);
    var matrix = $(elID).css("-webkit-transform");

    matrix = matrixToArray(matrix);

    return matrix[4];

}


Util.getTranslateY = function(elID) {
    function matrixToArray(matrix) {
        return matrix.substr(7, matrix.length - 8).split(', ');
    }

    elID = document.getElementById(elID);
    var matrix = $(elID).css("-webkit-transform");

    matrix = matrixToArray(matrix);

    return matrix[5];

}

Util.getURLParameter = function(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20'))||null;
}

Util.isiPhone = function() {
    if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
        return true;
    } else {
        return false;
    }
}

Util.iOSVersion = function() {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
    }
}

Util.randomizeArray = function(arr) {
    if(!arr || arr.length <= 0) { return []; }
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}


Util.timeAgo = function(timeStamp) {
    if(!timeStamp) { return ""; }
    var t = timeStamp.split(/[- :]/);
    return $.timeago(new Date(t[1] + "/" + t[2] + "/" + t[0] + " " + t[3] + ":" + t[4] + ":" + t[5] + " UTC")).replace("about", "");
}

Util.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

Util.hasSwearWord = function(str) {
    var badWords = BadWords.listArr();
    badWords.forEach(function(badWord) {
        var rgx = new RegExp('\\b' + badWord + '\\b', 'gi');
        if (rgx.test(str)) {
            return true;
        }
    });
    return false;
}

Util.getDeviceID = function() {
    var token = "Unknown";
    window.plugins.socialsharing.getDeviceID(function(deviceToken) {
        token = deviceToken;
    }, function(error) {
        token = "Unknown: iOS error";
        Util.log(error);
    });
    return token; 
}

// hash encryption / decryption for response storage
Util.Base64 = {
    _keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Util.Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},
    decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Util.Base64._utf8_decode(t);return t},
    _utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},
    _utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}
}
Util.encode = function(hash) { return Util.Base64.encode(JSON.stringify(hash)); }
Util.decode = function(string) { return Util.Base64.decode(string); }
Util.checkAPI = function(cb) {
    $.ajax({
        type: "HEAD",
        url: Api.url,
        timeout: 5000,
        success: function() {
            cb(true);
        },
        error: function() {
            cb(false);
        }
    });
}