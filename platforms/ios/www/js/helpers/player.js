
    var _V_ = false;

    var Player = {
        player: null,
        movie: null,
        videoJsLoaded: false,
        hlsSupported: null,
        h264Supported: null,
        bitRate: null,
        timerActive: true,
        timer: 0,
        pTimeout: 60000, // HLS doesn't seem to return progress events very often, so this is pure buffering time.
		playerModel: null,
        start: 0,
        progressTimer: null,
        paused: false,

        initialize: function() {
            if (this.h264Supported === null) this.h264Supported = Modernizr.video.h264;
            if (this.hlsSupported === null) this.hlsSupported = this.isHlsSupported();

            if (this.hlsSupported && this.bitRate === null) {
				if (MobileDevice.connectionIsCellular()) {
                    if (MobileDevice.isTablet()) {
                        this.bitRate = 750;
                    } else {
                        this.bitRate = 450;
                    }
                } else {
                    Util.log("isCellular is false");
                    this.bitRate = 750; // bitRate is irrelevant in hls.
                }
            } else { // We're using progressive download so get the bitRate.
                this.bitRate = Util.getBitRate();
            }

            if (!this.h264Supported) { // No support for video format so we need the flash fallback.
                Util.loader("http://vjs.zencdn.net/c/video.js");
            }

            APP.Player = this;
            this.player = this;

            return this;
        },

        set: function(ref, callback) {
            if (!callback) callback = function () {};

            if (_V_) {
                this.player = _V_("player");
            } else {
                this.player = document.getElementsByTagName("video")[0];
            }
			
			this.playerModel = ref;

            return this;
        },

        // This may seem a little redundant / extreme, but html5 video in mobile Safari has some weird buggy leaks
        dealloc: function() {
            var self = this;
            this.timer = 0;
            this.timerActive = false;
            APP.click = false;

            this.player.pause();
            this.pause();

            this.addEvent("canplaythrough", function() {});
            this.addEvent("loadstart", function() {});
            this.addEvent("progress", function() {});
            this.addEvent("stalled", function() {});
            this.addEvent("waiting", function() {});
            this.addEvent("ended", function() {});

            this.player.src = "";
            this.player = null;

            $(document.getElementsByTagName("video")[0]).remove();

            return this;
        },

        pressPlay: function(movie, isSimplePlayer, ref) {
			var self = this;
            self.playerModel = ref;
            this.volume(1);

            setTimeout(function(){
                self.timerActive = false;
                self.play();
            }, 0);
            return this;
        },

        // Player native / videoJS bridge methods
        ready: function(callback) {
            var self = this;

            if (!callback) callback = function() {};

            this.callback = callback;
            this.timerActive = true;

            this.addEvent("canplaythrough", function() {
                self.loadStatus("canplaythrough");
            });
            this.addEvent("loadstart", function() {
                self.loadStatus("load");
                self.callback();
            });
            this.addEvent("progress", function() { self.loadStatus("progress"); });
            this.addEvent("stalled", function() { self.loadStatus("stalled") });
            this.addEvent("waiting", function() { self.loadStatus("waiting") });
            this.addEvent("ended", function() { self.end(); });

            return this;
        },

        loadTimer: function() {
            var self = this;

            setTimeout(function() {
                if (!self.timerActive) return false;

                if (self.timer >= self.pTimeout) {
                    self.timerActive = false;
                    self.handleLoadTimeout();

                    return false;
                }

                self.timer += 1000;
                self.loadTimer();

            }, 1000);
        },

        handleLoadTimeout:function() {
			var self = this;
            Util.alert("Oops! There was a problem retrieving this trailer from our server.  Sorry, but we have to skip this one...", "Trailer Error");
            var opts = {
                movie: Model.movies[self.playerModel.currentMovie]
            };
            Api.error('video load timout', opts)
            self.playerModel.skipMovie();
        },

        end: function(ref) {
            ref = ref || this;
            $("#play").removeClass("playing");
            $("#poster-layover").show();
            if(ref && ref.playerModel) {
                ref.playerModel.skipMovie();
            }
            if(Analytics) { Analytics.logTrailerEnded(); }
        },

        loadStatus: function(msg) {
            switch (msg) {
                case "load":
                    msg = "Loading the trailer...";
                    this.loadTimer();
                    break;

                case "progress":
                    this.timer = 0;
                    msg = "Almost there...";
                    break;

                case "stalled":
                    msg = "Stalled...";
                    break;

                case "waiting":
                    msg = "Wating...";
                    break;
            }

            //$("#video-load-status").html(msg);
        },

        addEvent: function(event, callback) {
            if (!callback) callback = function() {};

            if (_V_) {
                this.player.addEvent(event, function() {
                    callback();
                });
            } else {
                this.player.addEventListener(event, callback, false);
            }

            return this;
        },
        removeEvent: function(event, callback) {
            if (!callback) callback = function() {};

            if (_V_) {
                this.player.removeEvent(event, callback);
            } else {
                this.player.removeEventListener(event, callback, false);
            }

            return this;
        },
        volume: function(level) {
            if (_V_) {
                this.player.volume(level);
            } else {
                this.player.volume = level;
            }

            return this;
        },
        play: function() {
            if (this.player !== null) { 
				this.player.play();
			}
            return this;
        },
        pause: function() {
            if (this.player !== null) this.player.pause();
            return this;
        },

        // These to do not return 'this'
        paused: function() {
            if (_V_) {
                return this.player.paused();
            } else if (this.player !== null) {
                return this.player.paused;
            }
        },
        currentTime: function() {
            if (_V_) {
                return this.player.currentTime();
            } else if (this.player !== null) {
                return this.player.currentTime;
            }
        },
        duration: function() {
            if (_V_) {
                return this.player.duration();
            } else  if (this.player !== null) {
                return this.player.duration;
            }
        },

        // Utilities
        getPercentWatched: function() {
            var p = Math.round((this.currentTime() / this.duration()) * 100);
            if (isNaN(p)) p = 0;
            return p;
        },

        isHlsSupported: function() {
            if (!this.hlsSupported === null) {
                return this.hlsSupported;
            }

            var a = navigator.userAgent,
                b = document.createElement('video'),
                support = true;

            if ((/iPhone|iPod|iPad/).test(a)) {
                support = true
            } else {
                try {
                    support =  b && b.canPlayType && !! b.canPlayType('application/x-mpegURL; codecs="avc1.42E01E, mp4a.40.2"')
                }
                catch(c) {
                    support = false
                }
            }
            this.hlsSupported = support;
            return support;
        },

        resumePlayer: function() {
            var player = this.player
            if (player) {
//                if (player.paused() && !player.ended() && player.currentTime() > 0) {
                player.play();
//                } else {
//                    APP.History.go(0);
//                }
            }
        },

        toggleVideoPlayPause: function() {
            var player = APP.Player.set(),
                $button = $("#play"),
                poster = $("#poster-layover");

            if (player.paused()) {
				Sounds.startGame();
                player.play();
                $button.addClass("playing")
                $button.removeClass('paused');
                poster.hide();
            } else {
                player.pause();
                $button.removeClass("playing");
                $button.addClass('paused');
            }
        }
    };