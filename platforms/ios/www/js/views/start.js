StartView = Backbone.View.extend({
    introSlider:null,
    render:function(callback) {
        callback = callback || function() {};
        var self = this,
            slid = self.options.slid || null,
            html = APP.load("start", { slid:slid });

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
        setTimeout(function() {
            UI.initScrollerOpts($("#slider")[0], {
                snap:true,
                momentum:false,
                hScrollbar:false,
                scrollX:true,
                scrollY:false,
                indicators:{
                    el:document.getElementById("indicator"),
                    resize:false
                }
            });
        }, 250);
    },
    dealloc:function() {
        return this;
    }
});
