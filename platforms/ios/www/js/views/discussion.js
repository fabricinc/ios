var DiscussionModel = Backbone.Model.extend({
    data: null,
    type: null,
    objectID: null,
    notificationType: null,
    
    initialize: function(options) {
        this.type = options.type || null;
        this.objectID = options.objectID || null;
        this.notificationType = options.notificationType || null;
    },
    
    fetchData: function(callback) {
        var self = this;
        callback = callback || function() {};

        if(this.type == "feed") {
            if(this.notificationType == "like") {
                Api.getLikes(self.type, self.objectID, function(response) {
                    callback(response.likes);
                });
            } else if(this.notificationType == "comment") {
                Api.getFeedComments(self.objectID, function(response) {
                    callback(response);
                });
            }
        } else if(this.type == "movie") {
            console.log( 'movie' );
            Api.getMovieComments(self.objectID, function(response) {
                callback(response);
            });

        } else {

            callback();

        }
        
        return this;
    }
});

var DiscussionView = Backbone.View.extend({
    model: null,
    id: "notifcation-messages",
    working: false,

    initialize: function(options, callback) {
        options = options || {};
        callback = callback || function() {};

        this.model = new DiscussionModel(options);

        return this;
    },

    render: function(callback, update) {
        var self = this;
        callback = callback || function() {};

        this.model.fetchData(function(response) {


            console.log( response );
            if(self.model.type == "feed") {

                var context = typeof response.context === "undefined"
                        ? $.parseJSON(response[0].feedInfo) 
                        : $.parseJSON(response.context.feedInfo);

                    var type = self.model.notificationType;

                context.creatorID = typeof response.context !== "undefined" 
                    ? response.context.creatorID 
                    : null;

            } else {

                var context = response.context;

            }

            

            if(type == "comment") {

                var tpl = "discussion";
                var title = "Comments";

            } else if(type == "like") {

                var tpl = "likes";
                var title = "Likes";

            } else {

                type = self.model.type;
                var tpl = "discussion";

                if(self.model.type == "movie") {

                    var title = context ? context.movieTitle + " Discussion" : "Discussion";

                } else {

                    var title = "Discussion";

                }
            }

            var html = APP.load(tpl, { type: type, objects: response, context: context });

            self.$el.html(html);

            if (!self.header) {
                self.header = new HeaderView({
                    title: title
                });
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

        $(".profile-image").click(function() {
            var senderID = $(this).data("senderid");
            Backbone.history.navigate("profile/" + senderID, true);
            if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "commments screen" });
        });

        $("#message-context img").click(function(){
            Backbone.history.navigate("movieLobby/"+ $(this).data("catid"), true);
        });
        
        $("#submit").click(function() {
            if(!self.working) {
                self.working = true;
                var msg = $("#message").val(),
                    type = $(".context-info span").eq(1).text();

                if(msg !== "") {
                    if(self.model.type == "movie") {

                        console.log( 'submit' );
                        console.log( self.model.objectID );
                        console.log( msg );
                        
                        Api.createMovieComment(self.model.objectID, msg, function(response) {

                            console.log( response );
                            $("#message").blur();
                            $("#message").val("");

                            var comment = {
                                message: msg,
                                senderName: User.getUserName()
                            };

                            if(User.isFacebook) {
                                comment.senderFbID = User.getFacebookID();
                            }

                            var html = APP.load("discussionMessage", { comment: comment });

                            $("#messages-container").append(html);
                            if(Analytics) Analytics.eventAndParams("Movie - Comment:", { type: type });
                            UI.scroller.refresh();
                            self.working = false;
                        });
                    } else {
                        Api.createFeedComment(self.model.objectID, { comment: msg }, function(response) {
                            $("#message").blur();
                            $("#message").val("");

                            var comment = {
                                message: msg,
                                senderName: User.getUserName()
                            };

                            if(User.isFacebook) {
                                comment.senderFbID = User.getFacebookID();
                            }

                            var html = APP.load("discussionMessage", { comment: comment });

                            $("#messages-container").append(html);
                            if(Analytics) Analytics.eventAndParams("Feed - Comment:", { type: type });
                            UI.scroller.refresh();
                            self.working = false;
                        });
                    }
                } else {
                    self.working = false;
                }
            }
        });

        UI.initScroller($("#messages-container").parent()[0]);
    },

    dealloc: function() {
        var self = this;
        this.click = false;

        return this;
    }
});