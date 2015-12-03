var WelcomeModel = Backbone.Model.extend({

    defaults: {
        query: ""
    },

    setID: function(ID) {

        this.set('query', ID);

        Api.setMovieToFabricList(ID, APP.gameState.favoriteListID, true);

    },


});

var Welcome = Backbone.View.extend({
    el: "#wrapper",
    id: "welcome",


    events: {
        'click .goto-swipe': 'gotoSwipe',
        'click .welcome-3': 'welcome4',
        'click .welcome-2': 'welcome3',
    },

    initialize: function() {

        this.model = new WelcomeModel();
        this.$el.addClass('welcome');

        window.vent.on('setID', this.welcome2, this);


    },

    render: function(callback) {
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {

            Backbone.history.navigate("rate", true);

        } else {

            // new code
            var html = APP.load('welcomeScreen1');

            this.$el.html( html );

            var search = new Search();


        }

        callback();
    },

    welcome2: function(ID){
        this.model.setID(ID);


        var welcomeScreen2 = new WelcomeScreen2();

        welcomeScreen2.render();
        this.delegateEvents();
        
    },

    welcome3: function(){
        var welcomeScreen3 = new WelcomeScreen3();

        welcomeScreen3.render();
        this.delegateEvents();
    
    },
    welcome4: function(){
        var welcomeScreen4 = new WelcomeScreen4();

        welcomeScreen4.render();
        this.delegateEvents();
    
    },

    gotoSwipe: function(){

        Backbone.history.navigate("discovery?categoryID=null&listID=null&limiter=null&onboard=true", true);
    
    },

    dealloc: function() {
        APP.welcome = false;
    }
});



var WelcomeScreen2 = Backbone.View.extend({
    el: "#wrapper",
    
    render: function() {

        
        this.$el.html( APP.load("welcomeScreen2") );

        return this;
    },

    next: function(){
    
    
    },

});

var WelcomeScreen3 = Backbone.View.extend({
    el: "#wrapper",
    
    render: function() {

        this.$el.html( APP.load("welcomeScreen3") );

        return this;
    },

    next: function(){
    
    
    },

});

var WelcomeScreen4 = Backbone.View.extend({
    el: "#wrapper",
    
    render: function() {

        this.$el.html( APP.load("welcomeScreen4") );

        return this;
    },


});