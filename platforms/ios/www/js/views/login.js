LoginView = Backbone.View.extend({
    render: function(callback) {
        callback = callback || function() {};

	    $("#wrapper").html(APP.load("login"));
	    this.bindEvents();

        callback();
    },

    bindEvents: function() {
        $('#user-login').submit(function(e) {
            User.login();
            return false;
        });

        $("#forgot-password").fastClick(function(){
            $("input").blur();
            setTimeout(function() {
                var html = APP.load("passwordRecovery", { message: "recover" });
                $("#pop-up-wrapper").html(html);
                $("#pop-up-wrapper").show();

                $('#recover').submit(function(e) {
                    User.recover();
                    return false;
                });

                $(".close").fastClick(function() {
                    $("#pop-up-wrapper").hide();
                    return false;
                });
            }, 200);
        });

        $("#create-account span").fastClick(function(){
            Backbone.history.navigate("register", true);
        });

        $("#login-back").fastClick(function(){
            var slid = true;
            Backbone.history.navigate("start/" + slid, true);
        });

        return this;
    },

    dealloc: function() {
        return this;
    }
});