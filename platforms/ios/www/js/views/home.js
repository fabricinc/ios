var HomeModel = Backbone.Model.extend({

    defaults: {
        discoveryLimit: null,
        sections: [1,2,4],
        categories: null,
        currentTab: 0,
        sectionID: 0,
        start: 0,
    },
    
    initialize: function(){

        this.set("discoveryLimit", Api.appSettings.discoveryLimit);
        this.set("sectionID", APP.sectionID);


        APP.refreshSettings(function () {
            
             User.fetchMinData(function (success) {
                 
                // If user is not logged in go to login screen
                if(!success) { Backbone.history.navigate('start/true', true); }



                var discoveryLimit = this.get('discoveryLimit'),
                    sectionID = this.get('sectionID'),
                    sections = this.get('sections'),
                    start = this.get('start');

                    var sectionData = sections.map(function (section) {
                        
                        Api.getCategoryListPart3(1, 100, start, discoveryLimit, section, function(response){

                            console.log( response );
                            return response.data.categories;
                            // this.set('categories', response.data.categories);

                        });
                        
                    
                    });


                }.bind(this));

        
        }.bind(this));
        
    
    },

    changeTab: function(tab){
    
        this.set("currentTab", tab.toLowerCase()); 
    
    },

    
});

var HomeView = Backbone.View.extend({
    el: "#wrapper",

    initialize: function() {

        this.model = new HomeModel();


        this.listenTo(this.model, "change:categories", this.load);
        
    },

    render: function(callback, update) {
        callback = callback || function() { };

        var contentContainer = new HomeContent({ model: this.model });
        var tabController = new TabController({ model: this.model });
        var header = new HeaderView({ home: true });

        
        this.$el
            .html(header.el)
            .append(tabController.render().el)
            .append(contentContainer.render().el);


        callback();

    },

    load: function(){
    
        console.log( 'load' );
        console.log( this.model.get('categories') );
    
    },

    dealloc: function() {
		
    }
});

var HomeContent = Backbone.View.extend({
    id: 'home-content',
    

    initialize: function(){
    
        this.listenTo(this.model, "change:currentTab", this.changeContent);
    
    },
    
    render: function() {

        

        return this;
    },

    methodName: function(){
    
        console.log( 'change content' );
    
    },

});


var TabController = Backbone.View.extend({
    id: 'tab-control',

    events: {
        "click": "changeTab"
    },
    
    
    render: function() {

        this.$el.append( 
            "<div id='Movies'>Movies</div><div id='TV'>TV</div><div id='Music'>Music</div>" 
        );

        return this;
    },

    changeTab: function(e){

        this.model.changeTab(e.target.id);
    
    },

});