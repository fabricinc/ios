RegisterView = Backbone.View.extend({
    click: false,

    render: function(callback) {
        callback = callback || function() { };

        $("#wrapper").html(APP.load("register"));
        this.bindEvents();

        callback();
    },

    bindEvents: function() {
        var self = this;
        console.log('register');

        $("#registration").submit(function(e) {
            e.preventDefault();
            if(!self.click) {
                self.click = true;

                UI.mask(true, function() {

                    User.register(function(success) {
                        Util.log("User.register success: " + success);
                        UI.unmask();
                        self.click = false;
                    });
                    
                });
            }

            return false;
        });

        $("#tos").fastClick(function(){
            window.open("http://www.tryfabric.com/TOS/", '_blank', 'location=yes');
        });
        $("#register-back").fastClick(function() {
            Backbone.history.navigate("login", true);

            return false;
        });

        $("#login-back").fastClick(function() {
            Backbone.history.navigate("start/true", true);

            return false;
        });

        $("#male, #female").fastClick(function() {
            if($(this).hasClass("active")) {
                return false;
            } else {
                $(".gender-buttons .active").removeClass("active");
                $(this).addClass("active");
            }
        });
    },

    dealloc: function() {
        this.click = false;
        return this;
    }
});
