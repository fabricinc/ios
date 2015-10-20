var FriendModel = Backbone.Model.extend({
    defaults: {
        userID: null,
        isSelf: false,
    },
    initialize: function(options) {
        
        var userID = options.userID === 'null' ? null : options.userID;

        this.set('userID', userID);

        this.set('isSelf', options.isSelf);
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
            cleanFriends = [];
            
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
        callback = callback || function() { };
        options = options || { };
        var self = this;

        this.model = new FriendModel(options);
    },

    render: function(callback) {
        var self = this;

        console.log( 'friends' );
        console.log( self.model.get('userID') );

        Api.getMutualFollowers(self.model.get('userID'), function(response) {

            console.log( response );

            var friendHead = self.model.get('isSelf') === "true" ? ( self.$el.addClass('self'), APP.load("inviteUserList") ) : "",
                html = APP.load("userLists", { followers: response.friends, followAction: "following" });

            self.$el.html(friendHead + html);
            
            if (!self.header) { 
                self.header = new HeaderView({ 
                    title: "Friends" 
                }); 
                self.$el.prepend(self.header.el);
            }

            $("#wrapper").html(self.$el);

            if(response.friends.length < 1) {

                $("#friends #list-row-wrapper").addClass("no-friends");

            }

            self.model.bindFriendEvents();
            UI.initScroller($("#list-row-wrapper")[0]);
            callback();
        });
    },

    dealloc: function() { }
});