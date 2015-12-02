var WelcomeCategoryModel = Backbone.Model.extend({

    initialize: function() {


    },

});

var WelcomeCategoryView = Backbone.View.extend({
    el: "#wrapper",
    id: "welcome",

    initialize: function() {

        this.model = new WelcomeCategoryModel();
        this.$el.addClass('welcome');

    },

    render: function(callback) {
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {

            Backbone.history.navigate("rate", true);

        } else {

            // new code
            var html = APP.load('welcomeScreen1');

            this.$el.append( html );


        }

        callback();
    },

    dealloc: function() {
        APP.welcome = false;
    }
});