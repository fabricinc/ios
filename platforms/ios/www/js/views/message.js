var MessageModel = Backbone.Model.extend({
    conversations: null,
    conversationsUserData: null,
    messages: null,
    userID: null,
    otherID: null,
    newMessagesInterval: null,
    otherName: null,
    messageTimeout: false,

    initialize: function(opts) {
        this.otherID = opts.otherID || null;
    },

    init: function(callback) {
        var self = this;
        callback = callback || function() {};

        if(this.otherID) {
            Api.seenConversation(this.otherID);
            Api.getConversation(this.otherID, function(data) {
                self.messages = data.messages;
                self.userID = data.userID;
                self.userData = data.userInfo;
                callback(data.messages);
            });
        } else {
            Api.getConversations(function(data) {
                self.conversations = data.conversations ||  [];
                self.conversationsUserData = data.userData || [];
                self.userID = data.userID;
                callback(data.conversations);
            });
        }
    },

    bindMessageEvents: function() {
        var self = this;

        $(".message").click(function() {
            var senderID = $(this).data("senderid");
            var receiverID = $(this).data("receiverid");

            if(self.userID == senderID) {
                Backbone.history.navigate("messages/" + receiverID, true);
            } else {
                Backbone.history.navigate("messages/" + senderID, true);
            }
        });

        UI.initScroller($("#messages-container").parent()[0]);
    },

    bindConversationEvents: function() {
        var self = this;

        // only init the slider with a startY if the height of the conversations (#conversations-container) is taller than the containing slider div (#conversation-slider)
        if( ($("#conversation-container").height() - $("#conversation-slider").height()) > 0) {
            UI.initScrollerOpts($("#conversation-container").parent()[0], {
                vScrollbar: false,
                hScroll: false,
                bounce: true,
                click: true,
                startY: (-($("#conversation-container").height() - $("#conversation-slider").height()) - 10) // the - 10 is to account for the 5 px padding on top and bottom.
            });
        } else {
            UI.initScroller($("#conversation-container").parent()[0]);
        }

        $("#message-form").submit(function(e) {
            e.preventDefault();
            var msg = $("#message").val();

            if(msg != "" && !self.messageTimeout) {
                self.messageTimeout = true;
                setTimeout(function() { self.messageTimeout = false; }, 1000);

                Api.sendMessage(self.otherID, msg, function(response) {
                    $("#message").blur();

                    if(response.success) {
                        // we successfully added the message to the DB, so show it.
                        $("#message").val("");
                        $.get('templates/message.html', function(html) {
                            var html = _.template(html, { message: msg, sender: true });
                            $("#conversation-container").append(html);

                            setTimeout(function () {
                                UI.scroller.refresh();
                                if(($("#conversation-container").height() - $("#conversation-slider").height()) > 0) {
                                    UI.scroller.scrollTo(0, -($("#conversation-container").height() - $("#conversation-slider").height()) - 10);
                                }
                            }, 10);
                        });
                    } else {
                        alert("Sorry, your message did not go through!");
                    }
                });
            }

            return true;
        });

        $("#chat-menu").fastClick(function() {
            if(APP.working) { return false; }
            Backbone.history.navigate("profile/" + self.otherID, true);
            if(Analytics) Analytics.eventAndParams("Profile (other) viewed",{ from: "Chat" });
        });

        window.newMessagesInterval = setInterval(function() {
            Api.getConversation(self.otherID, function(data) {
                if(data.messages.length > self.messages.length) {
                    var diff = data.messages.length - self.messages.length;

                    for(var i = 0; i < diff; i++) {
                        var message = data.messages[i];
                        if(self.otherID == message.sender) {
                            $.get('templates/message.html', function(html) {
                                var html = _.template(html, { message: message.msg, sender: false });
                                $("#conversation-container").append(html);
                                Api.seenConversation(this.otherID);
                            });
                        }
                    }

                    setTimeout(function () {
                        UI.scroller.refresh();
                        // only scrollTo() if the height of the conversations (#conversations-container) is taller than the containing slider div (#conversation-slider)
                        if(($("#conversation-container").height() - $("#conversation-slider").height()) > 0) {
                            // the - 10 is to account for the 5 px padding on top and bottom.
                            UI.scroller.scrollTo(0, -($("#conversation-container").height() - $("#conversation-slider").height()) - 10);
                        }
                    }, 500);

                    self.messages = data.messages;
                }
            });
        }, 5000);
    }
});

var MessageView = Backbone.View.extend({
    model : null,
    id : 'messages',

    initialize: function(options, callback) {
        options = options || {};
        callback = callback || function() {};

        this.model = new MessageModel(options);

        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};

        APP.models.messages = self.model;

        self.model.init(function(result) {
            if(self.model.otherID) {
                
                console.log('otherID');

                var html = APP.load("conversation", { 
                    messages: result.reverse(), 
                    otherID: self.model.otherID, 
                    totalSeen: self.model.totalSeen, 
                    totalMovies: self.model.totalMovies 
                });

                self.$el.html(html);

                self.header = new HeaderView({ title: self.model.userData.userName.split(" ")[0] });
                self.$el.prepend(self.header.el);

                $("#wrapper").html(self.$el);
                $("#notifications-menu").hide();

                if(self.model.userData.facebookID) {
                    $("#chat-menu .rel").css("background-image", "url(https://graph.facebook.com/" + self.model.userData.facebookID + "/picture?height=100&width=100)");
                }

                if(self.model.userData.userName == "Ms. Pop") {
                    $("#chat-menu .rel").addClass("msPop");
                }
                var gS = APP.gameState,
                    params = {
                        "Message Count": $(".message").length,
                        "Facebook Account": gS.isFacebook,
                        "Location": gS.city,
                        "Age": gS.age
                    };
                mixpanel.track("Messages accessed", params);

                self.model.bindConversationEvents();

            } else {


                self.header = new HeaderView({ title: "Messages", home: false, leftButton: { class: "back" } });
                
                var html = APP.load("messages", { 
                    conversations: result.reverse(),
                    userData: self.model.conversationsUserData.reverse(),
                    userID: self.model.userID 
                });

                self.$el
                    .prepend(self.header.el)
                    .append(html);
                

                $("#wrapper").html(self.$el.html());
                $("#chat-menu").hide();
                $("#notifications-menu").hide();
                self.model.bindMessageEvents();
                if(Analytics) { Analytics.event("Messages viewed"); }
            }

            callback();
        });
    },

    dealloc: function() {
        if(window.newMessagesInterval) {
            clearInterval(window.newMessagesInterval);
        }
    }
});