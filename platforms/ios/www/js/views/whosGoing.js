var NearbyAttendingModel = Backbone.Model.extend({

    initialize: function(options) {

    },
    bindEvents: function(){
        $(".lists-row").click(function(){
            var userID = $(this).data("followid"); 

            Backbone.history.navigate("profile/"+ userID, true);
            if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "whos going near me" });
        })
    }
});

var NearbyAttendingView = Backbone.View.extend({
    id: "nearby-attending",
    model: null,
    userID: null,
    moviePublishedID: null,

    initialize: function(options, callback) {
        var self = this;
        callback = callback || function() { };
        
        this.moviePublishedID = options.movieID;
        this.userID = options.userID;

        this.model = new NearbyAttendingModel(options);
        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};

        Api.nearbyWantToSee(self.moviePublishedID, function(response){
            var nearby = response.success ? response.data.nearby : false,
                title = nearby ? nearby[0].title : "",
                params = { 
                    moviePublishedID: self.moviePublishedID, 
                    title: title
                };

            var html = APP.load("whosGoing", { nearby : nearby }); 
            self.$el.html(html);

            if (!self.header) { 
                self.header = new HeaderView({ 
                    doneButton: true,
                    leftButton: { class: "" },
                    title: "Invite"
                }); 
                self.$el.prepend(self.header.el);
            }

            

            if(Analytics) { Analytics.eventAndParams("User swiped", params); }

            $("#wrapper").html(self.$el);
            self.model.bindEvents();
            UI.initScroller($("#list-row-wrapper")[0]);
            callback();
        });

        
    },

    dealloc: function() { }
});