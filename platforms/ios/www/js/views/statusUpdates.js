var StatusUpdatesModel = Backbone.Model.extend({
    movieID: 0,
    moviePublishedID: 0,
    movieData: null,

    initialize: function(opts) {
        this.movieID = opts.movieID || null;
        this.moviePublishedID = opts.moviePublishedID || null;
    },

    fetchData: function(callback) {
        var self = this;
        callback = callback || function() { };

        Api.getMovieData(self.movieID, null, function(response) {
            if(!response.success) {
                Util.alert("Sorry! There was an error gathering movie data!");
                return false;
            }

            self.movieData = response.movie;

            callback(response.movie);
        });

        return this;
    }
});

var StatusUpdatesView = Backbone.View.extend({
    id: "statusUpdates",
    model: null,

    initialize: function(options, callback) {
        callback = callback || function() { };
        options = options || { };

        this.model = new StatusUpdatesModel(options);

        callback();
        return this;
    },

    render: function(callback, update) {
        var self = this;
        callback = callback || function() { };

        self.model.fetchData(function(movieData) {
            var html = APP.load("statusUpdateMovie", { movie: movieData });
            self.$el.html(html);

            if (!self.header) {
                self.header = new HeaderView({ title: "Write Question", postButton: true });
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);

            self.bindEvents();

            callback();
        });

        return this;
    },

    bindEvents: function() {
        var self = this;
        $(".post").fastClick(function() {
            var movie = self.model.movieData,
                params = {
                    movieID: movie.movieID,
                    title: movie.title
                };

            var text = $(".text-box textarea").val(),
                url = Api.appSettings.shareLocation + "/item.php?movieID=" + movie.movieID;

            if(text == "") {
                $(".text-box textarea").addClass('false');
                // Util.alert("Please make sure your message is not blank","Invalid Message");
                return false;
            }

            if($("#twitter-share").hasClass('active')) {
                window.plugins.socialsharing.silentTweet(
                    text,
                    url,
                    function(response) {
                        // success function
                        Util.log(response);
                    },
                    function(response) {
                        // error function
                        Util.alert("Sorry! There was an error submitting your tweet.");
                        Util.log(response);
                    }
                );
                params.twitter = true;
            }

            if ($("#facebook-share").hasClass('active')) {
                window.plugins.socialsharing.silentFBPost(
                    text,
                    url,
                    function(response) {
                        // success function
                        Util.log(response);
                    },
                    function(response) {
                        // error function
                        Util.alert("Sorry! There was an error with FB Post");
                    }
                );

                params.facebook = true;
            }

            Api.createFeed("watchstatus", self.model.movieID, { comment: $(".text-box textarea").val() }, function(response) {
                // set filter so user goes to acitivity feed
                APP.feedFilter = 'activity-filter';
                
                Backbone.history.navigate("rate", true);
            });
            
            

            if(Analytics) { Analytics.eventAndParams("Staus Updated ", params); }
            mixpanel.track("Status Update", params);
        });

        $(".text-box textarea").on('focus', function() {
            $(this).removeClass('false');
        });


        $(".share-icons div").click(function(){
            $(this).toggleClass('active');
        });
    },

    dealloc: function() {
        return this;
    }
});