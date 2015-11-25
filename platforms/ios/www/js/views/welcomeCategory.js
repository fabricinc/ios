var WelcomeCategoryModel = Backbone.Model.extend({

    initialize: function() {


    },

});

var WelcomeCategoryView = Backbone.View.extend({
    id: "welcome",

    initialize: function() {

        this.model = new WelcomeCategoryModel();

    },

    render: function(callback) {
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {
            Backbone.history.navigate("rate", true);
        } else {

            // new code


        }

        callback();
    },

    dealloc: function() {
        APP.welcome = false;
    }
});