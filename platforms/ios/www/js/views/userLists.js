var UserListModel = Backbone.Model.extend({

    initialize: function(options) {

    },
    bindFollowEvents: function(){
        $(".lists-row").click(function(){
            var userID = $(this).data("followid"),
                uName = $(this).find(".follow-name").html(),
                profile = uName == APP.gameState.uName ? "profile" : "profile/" + userID; 

            Backbone.history.navigate(profile, true);
        })
    }

});

var UserListView = Backbone.View.extend({
    id: "user-lists",
    model: null,
    userID: null,
    movieID: null,

    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() { };

        this.recommendations = options.recommendations;
        this.following = options.following;
        this.movieID = options.movieID;
        this.userID = options.userID;

        this.model = new UserListModel(options);
        return this;
    },

    render: function(callback) {
        var self = this,
            recommendations = this.recommendations,
            userID = this.userID !== "null" ? this.userID : null,
            following = this.following,
            movieID = this.movieID,
            action = following == "true" ? "getFollowing" : "getFollowers",
            userApiAction = recommendations ? "getRecommendationList" : "getMovieCommonUsers";
        callback = callback || function() {};

        if(movieID) {
            //if there is a movie idea we are looking at a movie list ie recommendation list or seen list
            Api[userApiAction](movieID, function(response) {
                var template = recommendations ? "recommendationsUserList" : "movieListSeen",
                    title = recommendations ? "Recommended" : "Fans";

                var html = APP.load(template, { followers: response });
                $("#wrapper").html(html);

                if (!self.header) { self.header = new HeaderView({ title: title }); }
                $("#wrapper").prepend(self.header.el);

                UI.initScroller($("#list-row-wrapper")[0]);
                self.model.bindFollowEvents();
                
                callback();
            });
        } else {
            Api[action](userID, function(response){
                var tmpAction = following == "true" ? "following" : "followers";
                var html = APP.load("userLists", { followers: response[tmpAction], followAction: tmpAction });
                $("#wrapper").html(html);

                if (!self.header) { self.header = new HeaderView({ title: tmpAction }); }
                $("#wrapper").prepend(self.header.el);

                UI.initScroller($("#list-row-wrapper")[0]);
                self.model.bindFollowEvents();

                callback();
            });
        }
    },

    dealloc: function() { }
});