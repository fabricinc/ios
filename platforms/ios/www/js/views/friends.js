var FriendModel = Backbone.Model.extend({

    initialize: function(options) {

    },

    bindFriendEvents: function() {
        $(".lists-row").click(function() {
            var userID = $(this).data("followid"),
                uName = $(this).find(".follow-name").html(),
                profile = uName == APP.gameState.uName ? "profile" : "profile/" + userID; 

            Backbone.history.navigate(profile, true);
        });

        $("#invite-facebook").click(function() {
            FBActions.inviteRequest();
        });

        $("#search-users").submit(function(e) {
            e.preventDefault();
            var searchTerm = $("#search-users input").val();
            Backbone.history.navigate("searchUsers/" + searchTerm, true);
        });
    },

    removeAppUsers: function(FBFriends) {
        var currentAppUsers = Facebook.tpFbFriendIDs,
            cleanFriends = [],
            clean;
            
        for(f = 0; f < FBFriends.length; f++) {
            var clean = $.inArray(FBFriends[f].id, currentAppUsers);
            
            if(clean === -1){
                cleanFriends.push(FBFriends[f]);
            }  
        }
        return cleanFriends;
    }
});

var FriendView = Backbone.View.extend({
    id: "friends",
    model: null,
    userID: null,

    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() { };
        options = options || { };

        this.model = new FriendModel(options);
        return this;
    },

    render: function(callback) {
        var self = this;

        Api.getMutualFollowers(function(response) {
            var friendHead = APP.load("inviteUserList"),
                html = APP.load("userLists", { followers: response.friends, followAction: "following" });

            self.$el.html(friendHead + html);
            
            if (!self.header) { 
                self.header = new HeaderView({ 
                    slider: true,
                    leftButton: { class: "slide" },
                    title: "Friends" 
                }); 
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);
            if(response.friends.length < 1) {
                $("#friends #list-row-wrapper").addClass("no-friends");//.css({ height: "439px" });
            }

            self.model.bindFriendEvents();
            UI.initScroller($("#list-row-wrapper")[0]);
            callback();
        });
    },

    dealloc: function() { }
});