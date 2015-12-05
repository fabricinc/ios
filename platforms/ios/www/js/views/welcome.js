var WelcomeModel = Backbone.Model.extend({

    defaults: {
        movieID: null,
        title: null,
    },

    setMovie: function(movie) {

        this.set('movieID', movie.moviePublishedID);
        this.set('title', movie.movieTitle);

        Api.setMovieToFabricList(movie.moviePublishedID, APP.gameState.favoriteListID, true);

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

        window.vent.on('setMovie', this.welcome2, this);


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

    welcome2: function(movie){
        this.model.setMovie(movie);


        var welcomeScreen2 = new WelcomeScreen2({ title: this.model.get('title') });

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


var WelcomeModel2 = Backbone.Model.extend({

    defaults: {
        matchCount: 0,
        matches: []
    },
    
    initialize: function() {

        Api.getMatchDisplay(function (matches) {

            this.set("matches", matches);
        
        }.bind(this));

        Api.getMatchCount(function (count) {

            this.set('matchCount', +count[0].MatchCount);

        }.bind(this));
        
    },

});

var WelcomeScreen2 = Backbone.View.extend({
    el: "#wrapper",

    initialize: function(){
    
        this.model      = new WelcomeModel2();
        this.collection = new People();

        this.listenTo(this.model, 'change:matchCount', this.addMatchCount);
        this.listenTo(this.model, 'change:matches', this.addMatches);
        this.listenTo(this.collection, 'add', this.addPerson);
    
    },
    
    render: function() {

        
        this.$el.html( APP.load("welcomeScreen2", this.options) );

        return this;
    },

    addMatches: function(){
        
        this.collection.add(this.model.get('matches'));
    
    },

    addPerson: function(person){
        
        var personView = new PersonView({ model : person });

        personView.$el.addClass('tastemate-item');
        personView.undelegateEvents();
        

        this.$('.tastemates-row').prepend( personView.render().el );
    
    },
    addMatchCount: function(){

        var count = this.model.get('matchCount') - 5;

        this.$('.tastemates-row').append('<li class="more tastemate-item"><div class="more-count">'+ count +'+</div></li>');
        this.$('.m-count').html(this.model.get('matchCount'));
    
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