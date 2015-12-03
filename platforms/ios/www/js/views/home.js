

var Section = Backbone.Model.extend({

    defaults: {
        discoveryLimit: null,
        nextCategories: [],
        categories: [],
        matchCount: 0,
        digest: null,
        sectionID: 0,
        matches: [],
        start: 0,
    },
    
    initialize: function(){

        this.set("discoveryLimit", +Api.appSettings.discoveryLimit);


        var discoveryLimit = this.get('discoveryLimit'),
            sectionID = this.get('sectionID'),
            start = this.get('start');


        Api.getCategoryListPart3(1, 100, start, discoveryLimit, sectionID, function (response){

            this.set('categories', response.data.categories);

        }.bind(this));


        Api.getDigestLite(function (response) {

            this.set("digest", response.digestData.filter(this.filterDigest, this)[0]);

        }.bind(this));


        Api.getMatchDisplay(function (matches) {

            this.set("matches", matches);
        
        }.bind(this));


        Api.getMatchCount(function (count) {

            this.set('matchCount', count[0].MatchCount);

        }.bind(this));

    },

    filterDigest: function(item){

        return +item.section_id === this.get('sectionID');
    
    },

    lobby: function(){

        Backbone.history.navigate('movieLobby/null/'+ this.get('digest').object_id, true);
    
    },

    appToApp: function(e){
    
        Util.handleExternalUrl(e);
    
    },

    moreCategories: function(){
    
        var discoveryLimit = +this.get('discoveryLimit');

        
        // Bump up start first
        this.set('start', this.get('start') + discoveryLimit);

        var sectionID = this.get('sectionID'),
            start = this.get('start');


        Api.getCategoryListPart3(1, 100, start, discoveryLimit, sectionID, function (response){

            
            this.set('nextCategories', response.data.categories);

        }.bind(this));

    },

    getCategories: function(){

        var discoveryLimit = this.get('discoveryLimit'),
            sectionID = this.get('sectionID'),
            start = this.get('start');


        Api.getCategoryListPart3(1, 100, start, discoveryLimit, sectionID, function (response){

            this.set('categories', response.data.categories);

        }.bind(this));
        
    
    },

    
});

var Sections = Backbone.Collection.extend({

    model: Section,
    

});

var Pack = Backbone.Model.extend({

    defaults: {
        
    },
    
    goToSwipe: function() {

        Backbone.history.navigate("discovery?categoryID=" +  this.get('category_id') + "&listID=null&limiter=" + this.get('limiter') + "&onboard=null", true);
        
    },

});

var PackCollection = Backbone.Collection.extend({

    model: Pack,

});

var Person = Backbone.Model.extend({
    
    viewProfile: function() {

        Backbone.history.navigate('profile/'+ this.get('userID'), true);
        
    },


});

var People = Backbone.Collection.extend({

    model: Person,
    
});

var HomeModel = Backbone.Model.extend({

    defaults: {
        scrollPositions: [0,0,0],
        loadMore: false,
        currentTab: 0,
        sections: [],
    },
    
    initialize: function() {

        APP.refreshSettings(function() {
            User.fetchMinData(function(success) {

                if(!success) {
                    
                    Backbone.history.navigate("start/true", true);

                }

                else {

                    this.set('sections', [{sectionID: 1}, {sectionID: 2}, {sectionID: 4}]);

                }

            }.bind(this));

        }.bind(this));

        this.set("currentTab", +APP.sectionID);
        
        
    },

    changeSection: function(tab){
    
        if(tab === this.get('currentTab')) { return; }

        // set scroll position
        var pos = this.get('scrollPositions');
        var curTab = this.get("currentTab");

        pos[curTab] = UI.scroller.y;

        this.set('scrollPositions', pos);
        this.set("currentTab", +tab);
    
    },

    loadMore: function(){
    
        this.set('loadMore', !this.get('loadMore'));
    
    },

});

var HomeView = Backbone.View.extend({
    el: "#wrapper",

    initialize: function() {

        this.model = new HomeModel();

        this.sections = [];

        this.listenTo(this.model, 'change:currentTab', this.changeTab, this);
        this.listenTo(this.model, 'change:loadMore', this.progressiveLoad);
        this.listenTo(this.model, 'change:sections', this.build);
        
    },

    render: function(callback, update) {
        callback = callback || function() { };



        this.header = new HeaderView({ home: true });

        this.$el.html(this.header.el);

        if(APP.gameState.welcomeCompleted === "0") {
            
            this.$el.prepend( APP.load("welcomeScreen5") );

            $(".ack").fastClick(function () {
                
                $("article").remove();
            
                User.welcomeCompleted();

                if(Analytics) { Analytics.event("Welcome completed"); }
                mixpanel.track("Welcome completed");
            });
            

        }


        callback();

    },

    build: function(){
    
        this.collection   = new Sections(this.model.get('sections'));

        var tabController = new TabController({ model: this.model });
        var content       = new HomeContent({ model: this.model });
        var current       = this.model.get('currentTab');

        
        this.header.setFacebookID();

        this.$el
            .append(tabController.render().el)
            .append(content.render().el);


        this.collection.each(this.addSection, this);

        // Render selected tab
        this.sections[current].render();

    
    },

    addSection: function(section){
    

        var sectionView = new SectionView({ model: section });

        this.sections.push(sectionView);
    
    },

    changeTab: function(){
        
        var section = this.model.get('currentTab');


        this.sections[section].render();
    
    },

    progressiveLoad: function(){
    
        
        var section = this.model.get('currentTab');

        this.sections[section].model.moreCategories();

    },

    
    dealloc: function() {
        console.log( 'dealloc', this );
        
        // this.sections.empty();
		
    }
});

var HomeContent = Backbone.View.extend({
    id: 'home-content',

    events: {
        'touchstart' : 'refreshScroller'
    },
    

    initialize: function() {
        
        this.listenTo(this.model, 'change:currentTab', this.refresh);

    
    },
    
    render: function() {

        this.el.style.height = (document.height - 83) + "px";

        this.$el.append( '<div></div>' );

        UI.initScroller(this.$el[0]);

        return this;
    },

    refresh: function(){
        
        var pos = this.model.get('scrollPositions');
        var tab = this.model.get('currentTab');
        

        UI.scroller.scrollTo(0, pos[tab], 0);

        setTimeout(function() { UI.scroller.refresh(); }, 250);
    
    },

    refreshScroller: function() {
        
        UI.scroller.refresh();
        this.progressiveLoad();
    
    },

    progressiveLoad: function(){
    
        var s = UI.scroller;
        var scrollDiff = s.y - s.maxScrollY;


        if (scrollDiff < 800) {

            
            this.model.loadMore();

        }
    
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
        e.preventDefault(); e.stopPropagation();

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
    el: '#home-content div',
    people: null,
    packs: null,
    pick: null,
    
    
    render: function() {

        // Weird but if I don't put in a div the section content gets mixed up
        this.$el.html( "<div></div>" );


        this.people = this.people || new PeopleView({ model: this.model });
        this.pick   = this.pick || new PickView({ model: this.model });
        this.packs  = this.packs || new PacksView({ model: this.model });


        this.$el
            .append(this.pick.render().el)
            .append(this.people.render().el)
            .append(this.packs.render().el);


        return this;
    },

});

var PickView = Backbone.View.extend({
    id: "pick",

    events: {
        'click .purchase-links a': 'appToApp',
        'click': 'goToPick',
    },

    initialize: function(){

        if (this.model.get('digest')) {

            this.fillPick();

        }
    
        this.listenTo(this.model, 'change:digest', this.fillPick);
    
    },
    
    render: function() {

        this.delegateEvents();
        
        return this;

    },

    fillPick: function(){
    

        var digest = this.model.get('digest');
        var data = JSON.parse(digest.data);
        var pick = APP.load("picks", { data: data });

        this.$el
            .css({ "background-image": "url(" + data.objectImg + ")" })
            .html( pick );
    
    },

    appToApp: function(e){
        e.preventDefault(); e.stopPropagation();


        this.model.appToApp(e.currentTarget);
    
    },

    goToPick: function(){
    
        this.model.lobby();
    
    },

});

var PeopleView = Backbone.View.extend({
    personViews: [],
    id: "people",
    people: [],

    events: {
        'click .plus': 'viewMates'
    },

    initialize: function(){


        if(this.model.get('matches').length){

            this.addPeople();

        }

        if(this.model.get('matchCount').length){

            this.matchCount();

        }
    
        
        this.listenTo(this.model, 'change:matchCount', this.matchCount);
        this.listenTo(this.model, 'change:matches', this.addPeople);

    },
    
    render: function() {

        this.personViews.forEach(this.peopleEvents);

        this.delegateEvents();

        return this;

    },

    addPeople: function(){


        this.people = this.people.length ? this.people : new People(this.model.get('matches'));                


        this.people.each(this.addPerson, this);
            
    },

    addPerson: function(personModel){
    
        var personView = new PersonView({ model: personModel });

        this.$el.append( personView.render().el );

        this.personViews.push(personView);
    
    },

    matchCount: function(){

        var matchCount = this.model.get('matchCount');
        
        this.$el
            .prepend( "all picks ranked by your <span class='bold'> " + matchCount + " tastemates</span>" )
            .append( "<div class='match plus'>" + (matchCount - 5) + "+</div>" );
    
    },

    viewMates: function(){
        
        Backbone.history.navigate('friends/null/true', true);

    },

    peopleEvents: function(person){
    
        person.delegateEvents();
    
    },

});

var PersonView = Backbone.View.extend({
    className: 'match',
    tagName: 'img',

    events: {
        'click': 'viewProfile'
    },
    
    render: function() {

        this.el.src =  "https://graph.facebook.com/"+ this.model.get('facebook_id') +"/picture?height=170&width=170";

        return this;
    },

    viewProfile: function(){
    
        this.model.viewProfile();
    
    },

});

var PacksView = Backbone.View.extend({
    packViews: [],
    id: 'packs',
    packs: [],
    
    initialize: function(){

        this.packs = new PackCollection();
        this.listenTo(this.packs, 'add', this.addPack);

        // Incase we missed the categories set event 
        if(this.model.get('categories').length){

            this.renderPacks();

        }

        this.listenTo(this.model, 'change:nextCategories', this.addCategories);
        this.listenTo(this.model, 'change:categories', this.renderPacks);

        this.$el.prepend( "<p id='heading'>top ranking this week</p>" );

    },
    
    render: function() {
        
        // re-delegate pack events 
        this.packViews.forEach(this.packEvents);
        
        return this;

    },

    renderPacks: function(){

        var packList = this.model.get('categories');

        this.packs = this.packs.length ? this.packs : this.packs.add(packList);

    },

    addPack: function(packModel){
        
        var pack = new PackView({ model: packModel });

        this.$el.append( pack.render().el );

        this.packViews.push(pack);

    },

    packEvents: function(pack){
    
        pack.delegateEvents();
    
    },

    addCategories: function(){
        
        var nextCategories = this.model.get('nextCategories');

        this.packs.add(nextCategories);
    
    },

});

var PackView = Backbone.View.extend({
    className: 'pack',
    
    events: {
        'click': 'goToSwipe'
    },

    render: function() {

        var pack = APP.load('pack', this.model.toJSON());

        this.$el.append( pack );


        return this;
    },

    goToSwipe: function(){
    
        this.model.goToSwipe();
    
    },

});

