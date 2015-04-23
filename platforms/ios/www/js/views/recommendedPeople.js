var RecommendedPeopleModel = Backbone.Model.extend({

    defaults: function() {
        return {
            data: null
        }
    },



    initialize: function() {
        console.log("initialize the model");
    },


});


// Create Recommended People section 
var RecommendedPeopleView = Backbone.View.extend({
    el: "#suggested-follow-section",
    model: null,
    people: null,


    initialize: function() {
        this.model = new RecommendedPeopleModel({ data : this.people });

        this.render();

    },


    // Bind events for swipeing the cards left and right
    events: {
        "touchstart" : "start",
        "touchmove" : "move",
        "touchend" : "end",
    },


    render: function() {


        var template = APP.load('recommendedPeople');
        this.$el.html(template);


        var newPerson = new RecommendedPerson({ model : this.model });
        this.$el.append(newPerson.render().el);



        return this;
    },

    // People card slide events 
    start: function() {
        console.log("start");
    },

    move: function() {
        console.log('move');
    },

    end: function() {
        console.log("end");
    }

});




// View for each persons card
var RecommendedPerson = Backbone.View.extend({
    

    tagName: 'li',



    model: null,


    events: {
        "touchstart p.follow" : "setFollow",
    },



    initialize: function(){
        // this.render();
        // console.log('Person');
        // console.log(this.model);
    },

    render: function() {
        var template = APP.load('recommendedPerson');
        this.$el.html(template);


        return this;
    },


    setFollow: function() {
        console.log("set Follow");
    }
});
