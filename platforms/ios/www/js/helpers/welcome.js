var WelcomeHelper = {
        showWelcomeEnd: function() {
            $.get('templates/welcomeEndPopUp.html', function(html) {
                UI.launchPopUp(html);
            });
            return this;
        },

        showWelcomeMessaging: function(view, callback) {
            var property = "",
                template = "",
                self = this;

            callback = callback || function() {};

            if (view === "selectMovie") {
                $.get('templates/introSelectMovie.html', function(html) {
                    property = "selectMovieIntro";
                    template = html;

                    self.loadTemplate(view, template, property, callback);
                });
            } else if (view === "lists") {
                $.get('templates/introLists.html', function(html) {
                    property = "listsIntro";
                    template = html;

                    self.loadTemplate(view, template, property, callback);
                });
            } else if (view === "roundComplete") {
                $.get('templates/tapNotification.html', function(html) {
                    property = "tapPostersIntro";
                    template = html;

                    self.loadTemplate(view, template, property, callback);
                });
            } else {
                this.false = false;
                return this.false;
            }

            return this;
        },

        loadTemplate: function(view, template, property, callback) {
            if (APP.models.currentUser.get(property)) {
                // Message
                var popUpHtml = template; //APP.load(template, false, true);

                $(popUpHtml).addClass(view);

                UI.launchPopUp(popUpHtml, callback);

                // Set intro message as completed.
                var options = {
                    "action": "setIntroComplete",
                    "view": view
                };

                Api.dispatcher(options);

                // Unset the property for flows that hit these views without a server refresh of gameState.
                APP.gameState[property] = false;

                callback();
            }
        }
    }