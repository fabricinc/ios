var WelcomeModel = Backbone.Model.extend({

    defaults: {
        query: ""
    },

    initialize: function() {


    },

});

var Welcome = Backbone.View.extend({
    el: "#wrapper",
    id: "welcome",


    events: {
        'submit form.single-field-form' : 'nextStep',
    },

    initialize: function() {

        this.model = new WelcomeModel();
        this.$el.addClass('welcome');

    },

    render: function(callback) {
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {

            Backbone.history.navigate("rate", true);

        } else {

            // new code
            var html = APP.load('welcomeScreen1');

            this.$el.html( html );


        }

        callback();
    },

    nextStep: function(e){
        e.preventDefault(); e.stopPropagation();

        console.log( e );
        this.model.set(e);
        
        this.$el.html( APP.load("welcomeScreen2") );
    },

    dealloc: function() {
        APP.welcome = false;
    }
});