var RecommendedPeopleModel = Backbone.Model.extend({

    defaults: function() {

        return {
            people: null
        }

    },



    initialize: function(people) {

        this.set("people", people);

    },


    test: function() {
        console.log('hiiii');
    }


});


// Create Recommended People section 
var RecommendedPeopleView = Backbone.View.extend({
    el: "#suggested-follow-section",
    touchObject: {},
    model: null,
    offset: 0,


    initialize: function(people) {
        this.model = new RecommendedPeopleModel(people);

        console.log("NEW PEOPLE");
        this.render();

    },

    // Bind events for swipeing the cards left and right
    events: {
        "touchstart" : "start",
        "touchmove" : "move",
        "touchend" : "end",
        "swipe" : "swipe",
    },


    render: function() {

        var template = APP.load('recommendedPeople'),
            people = this.model.get("people");

        $(".content-scroller").prepend(template);

        // this.$el.html(template);


        people.forEach(function(person, i, a){


            this.addPersonCard(person);

        }.bind(this));



        return this;
    },

    addPersonCard: function(person) {

        var newPerson = new RecommendedPerson({ model : person });


        this.$el.append(newPerson.render().el);

    },


    // People card slide events 
    start: function(event) {

        var touches;
        
        if(event.originalEvent !== undefined && event.originalEvent.touches !== undefined){
            touches = event.originalEvent.touches[0];
        }

        this.touchObject.startX = this.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        this.touchObject.currentPosition = this.$el.position().left;

        this.$el.addClass('dragging');

    },

    move: function(event) {

        var touches, curLeft;

        // get our touch events
        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        curLeft = this.$el.position().left;

        // Return if the touches object has not been created or class 'dragging' isn't present
        if(!this.$el.hasClass('dragging') || touches && touches.length !== 1){
            return false;
        }

        // short and sweet
        var tO = this.touchObject;

        // Now set our current touch position in the touchObject
        this.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;

        // Now get swipe length
        this.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(this.touchObject.curX - this.touchObject.startX, 2)));

        // Muliplyer to determine the swipe direct
        positionOffset = this.touchObject.curX > this.touchObject.startX ? 1 : -1;

        var swipeMove =  (this.touchObject.currentPosition - 10)+ this.touchObject.swipeLength * positionOffset;


        // Set the CSS with the swipeLength
        this.setCSS(swipeMove);

    },

    end: function(event) {

        this.$el.removeClass('dragging');

    },

    setCSS: function(swipeLength) {

        var stop = swipeLength > 0 || swipeLength < -1780 ? true : false;
        

        // If we are at the end prefent css update
        if(stop) { return; }

        var move = {"-webkit-transform" : "translate3d("+ swipeLength +"px, 0px, 0px)"}


        this.$el.css(move);
    },


    bounceBack: function(position) {
        // var bounceAmount = position > 10



    }

});




// View for each persons card
var RecommendedPerson = Backbone.View.extend({
    
    className: 'recommended-person',


    following: false,


    tagName: 'li',


    model: null,


    events: {
        "click .profile-picture" : "visitProfile",
        "click .follow-button" : "setFollow",
    },



    initialize: function(){
        // this.render();
        // console.log('Person');
        // console.log(this.model);
    },

    render: function() {
        
        var data = JSON.stringify(this.model);
        var template = APP.load('recommendedPerson', { person: this.model });
        this.$el.html(template);


        return this;
    },


    visitProfile: function(event) {

        Backbone.history.navigate("profile/"+this.model.userID, true);

    },


    setFollow: function(event) {
        var ifFollowing = $(event.target).hasClass('following');

        var followSet = this.following ? "unFollowUser" : "followUser";


        Api[followSet](this.model.userID, function(response) {
            if(response.success){
                this.following = ! this.following;


                $(event.target)
                    .toggleClass("following");

            }   

        }.bind(this));


        $(event.target).on('transitionend', function(event) {
            var text = $(this).hasClass('following') ? "Following" : "Follow";

            $(this).html(text);
        });

    }


});
