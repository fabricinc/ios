var RecommendedPeopleModel = Backbone.Model.extend({

    defaults: function() {

        return {
            people: null
        }

    },



    initialize: function(people) {

        this.set("people", people);

    }


});


// Create Recommended People section 
var RecommendedPeopleView = Backbone.View.extend({
    el: "#suggested-follow-section",
    touchObject: {},
    style: null,
    model: null,
    offset: 0,


    initialize: function(people) {
        this.model = new RecommendedPeopleModel(people);

        this.render();

        this.$el.on('transitionend', function(event) {
            
            event.currentTarget.style['webkitTransitionDuration'] =  0;
        });

    },

    // Bind events for swipeing the cards left and right
    events: {
        "touchstart" : "start",
        "touchmove" : "move",
        "touchend" : "end",
    },


    render: function() {

        var template = APP.load('recommendedPeople'),
            people = this.model.get("people");

        $(".content-scroller").prepend(template);

        // Revers order of people
        people.reverse();
        

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

        // set the elements style on the view
        if(!this.style) { this.style = event.currentTarget.style; }

        // Stop transition durration
        this.style.transitionDuration = 0;

        UI.scroller.disable();


        var touches = event.originalEvent.touches[0],
            tO = this.touchObject;

        tO.currentPosition = this.$el.position().left;
        tO.startX = touches.pageX;
        tO.startTime = Date.now();

        this.$el.addClass('dragging');

    },

    move: function(event) {

        var touches = event.originalEvent.touches,
            tO = this.touchObject;



        // Return if the touches object has not been created or class 'dragging' isn't present
        if(!this.$el.hasClass('dragging') || touches && touches.length !== 1){
            return false;
        }

        // Now set our current touch position in the touchObject
        tO.curX =  touches[0].pageX;

        // Now get swipe length
        tO.swipeLength = tO.curX - tO.startX;

        // Return if swipe is less than 10px; 
        if(tO < 10) { return; }

        var swipeMove = tO.currentPosition + tO.swipeLength;


        if(swipeMove > 0 || swipeMove < -1750) { return; }


        // Set the CSS with the swipeLength
        this.setCSS(swipeMove);

    },

    end: function(event) {

        var tO              = this.touchObject,
            durration       = Date.now() - tO.startTime,
            start           = Math.round(tO.startX),
            currentPosition = Math.round(tO.curX);


        this.$el.removeClass('dragging');

        // Only add momentum if swipe durration is > 300ms
        if(durration < 300) {

            // Calculate momentum
            this.momentum(currentPosition, start, durration);
        }
        UI.scroller.enable();
    },

    setCSS: function(swipeLength) {



        this.style['webkitTransform'] = "translate3d("+ swipeLength +"px, 0px, 0px)";
    },


    momentum: function(currentPosition, startPosition, time) {
        
        var xad = document.getElementById('suggested-follow-section'),
            distance = currentPosition - startPosition,
            direction = distance < 0 ? -1 : 1,
            speed = Math.abs(distance) / time,
            x = this.$el.position().left,
            destination,
            d = 0.0006,
            transition,
            durration;

        console.log(x);

        console.log(currentPosition);
        // console.log();


        // destination =  x + ( speed * speed ) / ( 2 * d ) * ( direction );
        destination = x + 300 * direction;

        durration =  speed / d;



        //Don't go past max right distance or min left distance 


        destination = destination < -1750 ? -1750 : destination;
        destination = destination > 0 ? 0 : destination;

        xad.style['webkitTransitionDuration'] = "800ms";

        this.$el.css({"transform" : "translate3d("+ destination +"px, 0px, 0px)"});
        // xad.style["webkitTransform"] = "translate3d("+ destination +"px, 0px, 0px)";
        // this.setCSS(destination);


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
