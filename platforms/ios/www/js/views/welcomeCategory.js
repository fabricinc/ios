var WelcomeCategoryModel = Backbone.Model.extend({

    initialize: function() {
        var self = this;

    },
    getCategories: function(callback) {
        callback = callback || function() { };
        var self = this; 

        Api.getWelcomeCategories(function(categories){
            
            callback(categories);
        });

    }
});

var WelcomeCategoryView = Backbone.View.extend({
    id: "welcome",
    model: null,
    header: null,

    initialize: function(callback) {
        callback = callback || function() { };
        this.model = new WelcomeCategoryModel();
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() { };

        if(APP.gameState.welcomeComplete == 1) {
            Backbone.history.navigate("rate", true);
        } else {

            // if(Analytics) { Analytics.event("Welcome round start"); }
            this.model.getCategories(function(categories) {
                

                var html = APP.load("welcomeCategories", { categories : categories }),
                    header = new HeaderView({ title: "Select a pack below" }),
                    coach = APP.load("coach", { section : 'categorySelect' });

                this.$el
                    .html(html)
                    .prepend(header.el);

                $("#wrapper").html(this.$el);
                $('#coach-overlay').html(coach); 


                this.bindEvents.call(this);
                UI.bindCoachEvents();

                UI.initScroller($("#welcome-categories")[0]);


                setTimeout(function() { UI.scroller.refresh(); }, 1000);


                // Send callback to remove loading swipe
                callback();


            }.bind(this));
        }
    },
    bindEvents: function() {
        var self = this;
        // go to specivit category
        $("#welcome-categories div.catItem").unbind("click").click(function() {
            var categoryID = this.getAttribute("data-catid") || null;
            var listID = this.getAttribute("data-listid") || null;

            if(listID || categoryID) {
                Backbone.history.navigate("discovery?categoryID=" + categoryID + "&listID=" + listID, true);
            }
        });
    },

    dealloc: function() {
        APP.welcome = false;
    }
});