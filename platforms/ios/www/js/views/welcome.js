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
        console.log( 'welcome2' );
        this.model.setID(ID);


        var welcomeScreen2 = new WelcomeScreen2();

        welcomeScreen2.render();
        this.delegateEvents();
        
    },

    welcome3: function(){
        console.log( 'welcome3' );
        var welcomeScreen3 = new WelcomeScreen3();

        welcomeScreen3.render();
        this.delegateEvents();
    
    },
    welcome4: function(){
        console.log( 'welcome4' );
        var welcomeScreen4 = new WelcomeScreen4();

        welcomeScreen4.render();
        this.delegateEvents();
    
    },

    gotoSwipe: function(){
        console.log( 'go to swipe now' );
        
        Backbone.history.navigate("discovery?categoryID=3423&listID=null", true);
    
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
    
        console.log( 'do next' );
    
    },

});

var WelcomeScreen3 = Backbone.View.extend({
    el: "#wrapper",
    
    render: function() {

        console.log( 'welcome3' );
        this.$el.html( APP.load("welcomeScreen3") );

        return this;
    },

    next: function(){
    
        console.log( 'do next' );
    
    },

});

var WelcomeScreen4 = Backbone.View.extend({
    el: "#wrapper",
    
    render: function() {

        console.log( 'welcome 4', this );
        this.$el.html( APP.load("welcomeScreen4") );

        return this;
    },


});