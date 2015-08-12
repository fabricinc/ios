StartView = Backbone.View.extend({
    render:function(callback) {
        callback = callback || function() {};
        

        var self = this,

            html = APP.load("start");

        console.log( 'start' );
        $("#wrapper").html(html);

        self.bindLoginEvents();
        callback();
        return this;
    },


    bindLoginEvents:function() {
        
        $("#facebook").fastClick(function() {
            Backbone.history.navigate("fb-connect", true);
        });

        $("#sign-up").fastClick(function() {
            Backbone.history.navigate("login", true);
        });

    },

    dealloc:function() {
        return this;
    }
});
