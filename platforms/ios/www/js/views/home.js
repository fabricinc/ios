

var Section = Backbone.Model.extend({

    defaults: {
        discoveryLimit: null,
        categories: [],
        digest: null,
        sectionID: 0,
        matches: [],
        start: 0,
    },
    
    initialize: function(){

        this.set("discoveryLimit", Api.appSettings.discoveryLimit);


        var discoveryLimit = this.get('discoveryLimit'),
            sectionID = this.get('sectionID'),
            start = this.get('start');


        Api.getCategoryListPart3(1, 100, start, discoveryLimit, sectionID, function (response){

            // console.log( 'categories', response.data );
            this.set('categories', response.data.categories);

        }.bind(this));


        Api.getDigestLite(function (response) {

            this.set("digest", response.digestData.filter(this.filterDigest, this)[0]);

        }.bind(this));


        Api.getMatchDisplay(function (matches) {

            this.set("matches", matches);
        
        }.bind(this));
                
    
    },

    filterDigest: function(item){

        return +item.section_id === this.get('sectionID');
    
    },

    
});

var Sections = Backbone.Collection.extend({

    model: Section,
    

});

var Pack = Backbone.Model.extend({

    defaults: {
        
    },
    
    initialize: function() {

        
        
    },

});

var PackCollection = Backbone.Collection.extend({

    model: Pack,

});

var Person = Backbone.Model.extend({

    defaults: {
        
    },
    
    initialize: function() {

        
        
    },

});

var People = Backbone.Collection.extend({

    model: Person,
    
});

var HomeModel = Backbone.Model.extend({

    defaults: {
        currentTab: 0,
        sectionID: 0,
    },
    
    initialize: function() {

        this.set("currentTab", +APP.sectionID);
        
        
    },

    changeSection: function(tab){
    
        if(tab === this.get('currentTab')) { return; }


        this.set("currentTab", +tab);
    
    },

});

var HomeView = Backbone.View.extend({
    el: "#wrapper",

    initialize: function() {
        // alert();

        this.sections = [];

        var sections = [{sectionID: 1}, {sectionID: 2}, {sectionID:4}];
        this.collection = new Sections(sections);

        this.model = new HomeModel();

        this.listenTo(this.model, 'change:currentTab', this.changeTab, this);
        
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


        this.collection.each(this.addPage, this);

        this.sections[this.model.get('currentTab')].render();

        callback();

    },

    addPage: function(section){
    

        var sectionView = new SectionView({ model: section });

        this.sections.push(sectionView);
    
    },

    changeTab: function(){
        
        console.log( 'change tab' );
        console.log( 'sections', this.sections );
        var section = this.model.get('currentTab');


        this.sections[section].render();
    
    },

    
    dealloc: function() {
        console.log( 'dealloc', this );
        
        // this.sections.empty();
		
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



});


var TabController = Backbone.View.extend({
    id: 'tab-control',

    events: {
        "touchstart .nav-tab": "changeTab"
    },

    initialize: function(){
    
        this.listenTo(this.model, 'change:currentTab', this.activeTab);
    
    },
    
    
    render: function() {

        this.$el.append( 
            "<div class='nav-tab' data-tag='0' id='movies'>Movies</div><div class='nav-tab' data-tag='1' id='tv'>TV</div><div class='nav-tab' data-tag='2' id='music'>Music</div>" 
        );


        // Set active class on current tab
        var tab = this.$('.nav-tab')[this.model.get('currentTab')];

        $(tab).addClass('active');

        return this;
    },

    changeTab: function(e){
        
        this.model.changeSection(e.target.dataset.tag);
    
    },

    activeTab: function(){
    

        var t = this.model.get('currentTab');
        var tab = this.$('.nav-tab')[t];

        this.$('.active').removeClass('active');


        $(tab).addClass('active');
    
    },

});

var SectionView = Backbone.View.extend({
    el: '#home-content',
    people: [],
    packs: [],
    
    initialize: function(){
    
        
        this.listenTo(this.model, "change:categories", this.loadPacks);
        this.listenTo(this.model, "change:matches", this.loadMatches);
        // this.listenTo(this.model, "change:digest", this.loadDigest);
    
    },
    
    render: function() {


        this.$el
            .html( "<div id='pick'></div><div id='people'></div><div id='packs'></div>" )
            .prepend(this.model.get('sectionID'));


        // var people = new PeopleView({ model: this.model });
        var pick = new PickView({ model: this.model });

        pick.render();
        // people.render();

        this.loadMatches.call(this);
        this.loadPacks.call(this);


        return this;
    },

    loadPacks: function(){
        
        var packList = this.model.get('categories');

        if(!packList.length) { console.log( 'no packs' ); return; }


        this.packs = this.packs.length ? this.packs : new PackCollection(packList);

        
        this.packs.each(this.addPack, this);
        
    
    },

    loadMatches: function(){

        var people = this.model.get('matches');


        if(!people.length) { return; }


        this.people = this.people.length ? this.people : new People(people);

        this.people.each(this.addPerson, this);
            
    
    },

    loadDigest: function(){
        
        var pickView = new PickView({ model: this.model });
    
    },

    addPack: function(packModel){
    
        var pack = new PackView({ model: packModel });

        this.$('#packs').append( pack.render().el );

    },

    addPerson: function(personModel){
    
        var person = new PeopleView({ model: personModel });


        this.$("#people").append( person.render().el );
    
    },

});

var PickView = Backbone.View.extend({
    el: "#pick",

    initialize: function(){
    
        this.listenTo(this.model, 'change:digest', this.render);
    
    },
    
    render: function() {

        if(!this.model.get('digest')) { return; }


        var data = JSON.parse(this.model.get('digest').data);


        this.$el.html( "Pick: "+ data.objectTitle );

        return this;
    },

});

var PeopleView = Backbone.View.extend({
    className: 'match',

    // initialize: function(){
    
    //     this.listenTo(this.model, 'change:matches', this.render);
    
    // },
    
    render: function() {

        this.$el.html( this.model.get('uName') );

        

        return this;
    },

});

var PackView = Backbone.View.extend({
    className: 'pack',
    
    
    render: function() {

        this.$el.html( this.model.get('title') );

        return this;
    },

});

