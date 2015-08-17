var StartModel = Backbone.Model.extend({

    defaults: {
        emailLogin: false,
    },
    
    initialize: function(options) {
        login = options.login || false;

        this.set('emailLogin', login);
        
    },

    buttonClick: function( event ) {
    

        switch( event ){
            case 'facebook': 
                Backbone.history.navigate('fb-connect', true);
                break;
            case 'login-button':
                User.login();
                break;
            case 'register-button':
                UI.mask(true, function() {

                    User.register(function(success) {
                        Util.log("User.register success: " + success);
                        UI.unmask();
                        self.click = false;
                    });
                    
                });
                break;
        }
    
    },

});

var StartView = Backbone.View.extend({

    initialize: function(options){

        this.vent = _.extend({}, Backbone.Events);
        this.model = new StartModel(options);

    },
    

    render:function(callback) {
        callback = callback || function() {};


        var startContent = new StartContent({ model: this.model, vent: this.vent });
        startContent.render();


        callback();
        return this;
    },

    dealloc:function() {
        return this;
    }
});


var StartContent = Backbone.View.extend({
    el: "#wrapper",

    initialize: function(){
    
        this.vent = this.options.vent;


    },

    render: function() {

        this.$el
            .empty()
            .append('<div id="login-content"></div>');


        // LOGO (Move vertically)
        this.fabricLogo = new FabricLogo({ 
            model: this.model,
            vent: this.vent 
        });

        this.backButton = new BackButton({ vent: this.vent });

        loginContent = new LoginContent({ 
            model: this.model,
            vent: this.vent 
        });

        this.bottomLine = new BottomLine({
            model: this.model,
            vent: this.vent
        });


        this.$el
            .append( this.backButton.render().el )
            .append( this.fabricLogo.render().el )
            .append( loginContent.render().el )
            .append( this.bottomLine.render().el );
        
        return this;
    },

});


var FabricLogo = Backbone.View.extend({
    id: 'login-logo',
    tagName: 'h1',

    initialize: function(){
        
        this.vent = this.options.vent;

        this.vent.on('buttonClick', this.moveLogo, this);
        this.vent.on('back', this.lowerLogo, this);
    
    },

    lowerLogo: function(){
    
        this.el.style.top = '';
    
    },
    moveLogo: function(){

        this.el.style.top = '12%';
    
    },
    
    render: function() {



        return this;
    },

});

var BackButton = Backbone.View.extend({
    id: 'login-back',
    
    events: {
        'touchstart': 'back'
    },

    initialize: function(){
    
        this.vent = this.options.vent;

        this.vent.on('showBackButton', this.showButton, this);
        this.vent.on('back', this.hideButton, this);
    
    },

    hideButton: function(){
    
        this.$el.removeClass( 'visable' );
    
    },

    showButton: function(){
    
        this.$el.addClass( 'visable' );
    
    },

    render: function() {

        

        return this;
    },

    back: function(){
    
        this.vent.trigger('back', '');
    
    },

});

var LoginContent = Backbone.View.extend({
    
    el: '#login-content',

    initialize: function(){
    
        this.vent = this.options.vent;

        this.vent.on('buttonClick', this.showContent, this);
        this.vent.on('back', this.back, this);
    
    },

    showContent: function(route){
    
        switch (route) {
            case 'email':
                this.emailLogin.render();
        }

    
    },

    back: function(){

        this.facebookLogin.render();  
    
    },
    
    render: function() {

        // starting login screen
        this.facebookLogin = new FacebookLogin({
            model: this.model,
            vent: this.vent 
        });


        this.emailLogin = new EmailLogin({
            model: this.model,
            vent: this.vent 
        });

        this.chooseRender();

        return this;
    },

    chooseRender: function(){
    
        if( this.model.get('emailLogin') ){

            var recover = new PasswordRecover({ model: this.model });


            this.emailLogin.render();
            this.vent.trigger('buttonClick', 'email');
            recover.render();


        } else {

            this.facebookLogin.render();

        }
    
    },

});

var FacebookLogin  = Backbone.View.extend({
    el: "#login-content",

    initialize: function(){
    
        this.vent = this.options.vent;
    
    },

    render: function() {

        this.$el.empty();

        facebookButton = new ButtonView({
            vent: this.vent, id: "facebook",
            model: this.model
        });

        emailButton = new ButtonView({
            vent: this.vent, id: "email",
            model: this.model
        });

        this.$el.append("<div id='login-buttons'></div>");


        this.$el
            .prepend( "<p>Share your favorite movies, TV shows and music and see what your friends are into!</p>" );

        this.$('#login-buttons')
            .append( facebookButton.render().el )
            .append( emailButton.render().el );
        

        return this;
    },

});

var EmailLogin = Backbone.View.extend({
    el: "#login-content",

    events: {
        'touchstart .gender-buttons div' : 'genderButton',
        'touchstart #forgot-password': 'passwordRecovery',
        'touchstart #create-account': 'createAccount',
        'keypress': 'submitLogin',
    },

    initialize: function(){
    
        this.vent = this.options.vent;

        this.vent.on('showRegister', this.showRegister, this);

        
    },

    
    render: function() {

        this.passwordRecover = new PasswordRecover({ model: this.model });

        var loginButton = new ButtonView({ 
            id: 'login-button',
            model: this.model, 
            vent: this.vent, 
        });

        var registerButton = new ButtonView({
            id: 'register-button',
            model: this.model,
            vent: this.vent,
        });
        
        var register = APP.load('register');
        var login = APP.load('login');


        this.$el
            .html( login );

        this.$('#login-section')
            .append( loginButton.render().el );

        this.$('#register-section')
            .html( register )
            .append( registerButton.render().el );

            this.vent.trigger( 'showBackButton' );


        return this;


    },
    submitLogin: function(e){

        if(e.keyCode === 13){
            this.model.buttonClick('login-button');
        }
    
    },

    createAccount: function(e){
        e.preventDefault();     e.stopPropagation();

        this.vent.trigger('showRegister', e.currentTarget.id);
    
    },

    showRegister: function(){
        this.$('#register-firstname').blur();
        this.$('section').css({ top: '-105%'});
    
    },

    genderButton: function(e){
        
        $('.active').removeClass('active');
        e.currentTarget.className = 'active';
        
    
    },
    passwordRecovery: function(){
        this.$(':focus').blur();
        this.passwordRecover.render();
    
    },

});

var ButtonView = Backbone.View.extend({
    
    className: 'login-button', 

    events: {
        "touchstart": 'buttonClick',
    },

    initialize: function(){
    
        this.vent = this.options.vent;
        this.el.id = this.options.id;
    
    },
    
    render: function() {
        

        return this;
    },

    login: function(){
    
    
    },

    buttonClick: function(e){


        this.model.buttonClick( e.currentTarget.id );

        this.vent.trigger('buttonClick', this.el.id);
    
    },

});

var BottomLine = Backbone.View.extend({

    id: 'bottom-line',

    tagName: 'p',

    events: {
        'click #tos' : 'tos',
        'click span' : 'signUp'
    },

    initialize: function(){
        
        this.vent = this.options.vent;
        this.el.className = this.model.get('emailLogin') ? 'email' : '';

        this.vent.on('showRegister buttonClick back', this.changeLine, this);
    
    },
    
    render: function() {

        this.$el.html( this.setLine() );

        return this;
    },

    changeLine: function( route ){
        console.log( 'change line' );

        if(route === 'login-button') { return; }

        this.el.className = route;
        this.render();
    
    },

    setLine: function( stuff ){
        stuff = stuff || null;
        var text;

        console.log( 'set line' );
        console.log( this.el.className );
        switch( this.el.className ){


            case 'email':
                text = "";
                break;
            case 'create-account':
                text = "By pressing sign up, you acknowledge that you've read &amp; agree to the <a id='tos'>Terms of Service.</a>";
                break;
            case '':
                text = "Don't have an account? <span>Sign Up</span>";

        }    

        return text;
    
    },

    tos: function(){
    
        window.open("http://www.tryfabric.com/TOS/", '_blank', 'location=yes');
    
    },

    signUp: function(){

        this.vent.trigger('buttonClick', 'email');
        this.vent.trigger('showRegister', 'create-account');
    
    },

});

var PasswordRecover = Backbone.View.extend({

    el: '.modal-overlay',

    events: {
        'touchstart #recover-password': 'submitRecover',
        'touchstart .close': 'closeRecovery',
    },
    
    render: function() {


        this.$el
            .empty()
            .addClass('active');

        var message = this.model.get('emailLogin') ? '' : 'recover';

        var html = APP.load("passwordRecovery", { message: message });

        this.$el.html( html );


        return this;

    },

    submitRecover: function(){

        User.recover();
    
    },

    closeRecovery: function(){
        
        this.$el
            .removeClass('active')
            .empty();
    
    },

});


