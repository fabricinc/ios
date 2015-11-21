

var Section = Backbone.Model.extend({

    defaults: {
        discoveryLimit: null,
        categories: null,
        currentTab: 0,
        digest: null,
        sectionID: 0,
        start: 0,
    },
    
    initialize: function(){

        this.set("discoveryLimit", Api.appSettings.discoveryLimit);


        var discoveryLimit = this.get('discoveryLimit'),
            sectionID = this.get('sectionID'),
            start = this.get('start');


        
        Api.getCategoryListPart3(1, 100, start, discoveryLimit, sectionID, function(response){

            this.set('categories', response.data.categories);

        }.bind(this));


        Api.getDigestLite(function (response) {
            
            this.set("digest", response.digestData.filter(this.filterDigest, this)[0]);

        }.bind(this));
                
                    
    
    },

    changeTab: function(tab){
    
        this.set("currentTab", tab.toLowerCase()); 
    
    },

    filterDigest: function(item){

        return +item.section_id === this.get('sectionID');
    
    },

    
});

var Sections = Backbone.Collection.extend({

    model: Section,
    

});

var HomeModel = Backbone.Model.extend({

    defaults: {
        sectionID: 0
    },
    
    initialize: function() {

        this.set("sectionID", APP.sctionID);
        
        
    },

    changeSection: function(tab){
    
        this.set("sectionID", tab);
    
    },

});

var HomeView = Backbone.View.extend({
    el: "#wrapper",

    initialize: function() {

        var sections = [{sectionID: 1}, {sectionID: 2}, {sectionID:4}];
        this.collection = new Sections(sections);

        this.model = new HomeModel();


        // this.listenTo(this.model, "change:categories", this.load);
        
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

        this.model.changeSection(e.target.id);
    
    },

});