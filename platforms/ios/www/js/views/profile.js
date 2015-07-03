var ProfileModel = Backbone.Model.extend({
    followerData: null,
    defaults: {
        profileData: null,
        compatibility: null,
        isFollowing: false,
        profileData: null,
        followData: null,
        messageCount: 0,
        isFriend: false,
        content: null,
        userID: null,
        self: false,

    },

    initialize: function(options) {
        this.userID = options.userID || null;

    },

    getProfileData: function() {
        var self = this;


        Api.getFabricProfile(this.userID, function (response) {


            this.set('compatibility', parseInt(response.compatibility));
            this.set('messageCount', parseInt(response.messageCount));
            this.set('isFollowing', response.following);
            this.set('followData', response.followData);
            this.set('isFriend', response.isFriend);
            this.set('userID', response.userID);
            this.set('self', response.self);
            this.set('profileData', response.profileData);


        }.bind(this));

        Api.getProfileContent(this.userID, function (response){


            this.set('content', response.content);


        }.bind(this));


    },

    viewFollowFollowers: function (routeType) {
        var userID = this.get('userID');

        var routes = {
            followers:  "userLists?userID=" + userID + "&following=false",
            following:  "userLists?userID=" + userID + "&following=true",
            friends:    "friends/"+ userID +"/"+ this.get('self')
        };

        Backbone.history.navigate(routes[routeType], true);

    },

    toggleFollow: function() {

        var following = this.get('isFollowing');


        if(following) {
            var message = "Are you sure you want to unfollow " + this.get('profileData').uName;

            navigator.notification.confirm(message, function(button){
               if(button === 2) {

                    Api.unFollowUser(this.userID, function(response) {
                        if(response.success) {

                            // self.isFollowing = false;
                            this.set('isFollowing', false);

                        }
                    }.bind(this));

                }
            }.bind(this), null, ["Cancel", "Unfollow"]);

        } else {
            Api.followUser(this.userID, function(response) {
                if(response.success) {

                    this.set('isFollowing', true);

                }
            }.bind(this));
        }

    },

    greet: function() {

        if(this.get('isFriend') || parseInt(this.get('messageCount'))) {

            Backbone.history.navigate("messages/" + this.get('userID'), true);

        } else {

            Backbone.history.navigate("greeting/" + this.get('userID'), true);

        }

    },

    settings: function() {

        Backbone.history.navigate('settings', true);

    },

    bindEvents: function() {
        var self = this;


        $(".right.button.more").fastClick(function() {
            UI.launchPopUpTwo(APP.load("reportUserPopup"), function() {
                $(".report-content .button").fastClick(function() {
                    var reason = $(".report-content textarea").val();
                    if(reason == "") { reason = "Unknown"; }
                    if(self.userID) {
                        Api.reportUser(self.userID, reason, function(response) {
                            $(".report-content p").html("This user has been reported to Fabric.");
                            $(".report-content textarea").hide();
                            $(".report-content .button").hide();
                            setTimeout(function() {
                                $('.close').click();
                            }, 3000);
                        });
                    }
                    return false;
                });
            });
            return false;
        });

    }
});

var ProfileView = Backbone.View.extend({
    model: null,
    header: null,
    id: "profile-view",


    initialize: function(options) {
        options = options || { };


        this.model = new ProfileModel(options);

        this.listenTo(this.model, 'change:content', this.fillContent);
        this.listenTo(this.model, 'change:profileData', this.fill);

    },


    // Fill the profile with the user info
    fill: function() {

        this.profileInfo = new ProfileInfoView({ model : this.model });

        this.profileInfo.render();

        this.header.model.set('moreButton', !this.model.get('self'));

        if(!this.model.get('self')) {

            this.model.bindEvents();

        }

    },

    fillContent: function() {

        this.profileContent = new ProfileContentView({ content:  this.model.get('content') });

        this.profileContent.render();

    },

    render: function(callback) {
        callback = callback || function() { };


        var data = this.model.toJSON();


        this.header = new HeaderView({
            // moreButton: (!data.self && this.model.userID !== "252990"),
            title: "Profile",
            home: false
        });


        this.$el
            .prepend(this.header.el)
            .append(APP.load("profile"));


        $("#wrapper").html(this.$el);

        this.model.getProfileData();

        // Keep this to unmask the view
        callback();

    },

    dealloc: function() {
        return this;
    }

});

var ProfileInfoView = Backbone.View.extend({
    el: "#profile-info",

    initialize: function(options){

        this.listenTo(this.model, "change:isFollowing", this.toggleFollowState);

    },

    events: {
        "touchstart #follow-info li" : "viewFollowFollowers",
        "click #settings-gear" : "settings",
        "click #follow-button" : "follow",
        "click #send-greeting" : "greet",
    },

    viewFollowFollowers: function (e) {


        this.model.viewFollowFollowers(e.currentTarget.id);

    },

    follow: function() {

        this.model.toggleFollow();

    },

    greet: function() {

        this.model.greet();

    },

    toggleFollowState: function() {

        var following = this.model.get('isFollowing') ? "Following" : "Follow";

        this.$el.find( "#follow-button" )
            .toggleClass( 'following' )
            .html( following );

    },

    settings: function() {

        this.model.settings();

    },

    render: function(){

        var info = APP.load("profileInfo", this.model.toJSON());

        this.$el.html(info);


        return this;
    }
});

var ProfileContentView = Backbone.View.extend({

    el: "#profile-content",

    initialize: function(options) {
        content = options.content;

        this.collection = new ProfileContentCollection(content);

    },

    render: function () {

        this.collection.each(this.addContent, this);

        return this;
    },

    addContent: function(contentBlock){
        
        var block = new ContentBlock({ model : contentBlock });


        this.$el.append( block.render().el );

    },

});

var ProfileContentModel = Backbone.Model.extend({

    sync: function () { return false; },

    defaults: {
        shown: false
    },

    viewList: function() {

        Backbone.history.navigate("lists/"+ this.get('listID') +"/"+ this.get('section_id'), true);

    }

});

var ProfileContentCollection = Backbone.Collection.extend({

    model: ProfileContentModel,

    initialize: function(options) {


    }

});

var ContentBlock = Backbone.View.extend({

    className: 'profile-tile',

    events: {
        'click' : 'viewList',
    },


    render: function() {

        var _D = this.model.toJSON(),
            block = APP.load( 'profileContent', _D );

        this.$el
            .css({ backgroundImage : "url("+ _D.poster +")" })
            .append( block );


        return this;

    },

    viewList: function() {

        this.model.viewList();

    }
});
