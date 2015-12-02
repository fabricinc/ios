var APP = {
    $wrapper: $("#wrapper"),
    strings: Api.getLocalizedStrings(),
    prevTotalScore: 0,
    score: 0,
    totalScore: 0,
    gameState: null,
    url: {
        set: false,
        route: null
    },
    currentCategory: 0,
    currentCategoryName: false,
    fbTry: 1,
    screenRmAccessLvl: 2, // 4th rank is 'Lead Actor', hit at the 3rd point threshold.
    models: {},
    templates: {},
    view: {
        previous: null,
        current: null
    },
	kiipEligible: false,
    kiipInit: false,
	click: false,
	Player: null,
    welcome: null,
    welcomeEnd: null,
    tapPosters: null,
    movieCatWelcome: true,
    wantToSortFilter: "Count",
    listWelcome: true,
    feedPos: 0,
    sectionID: 0,
    firstRate: false,
    msPop: {
        userID: 252990,
        uName: "Ms. Pop",
        city: "San Francisco",
        state: "CA",
        avatar: "https://s3.amazonaws.com/trailerpop/images/MsPop/fakeMsPop.png",
        profileImg: "https://s3.amazonaws.com/trailerpop/images/MsPop/fakeMsPop_large.png"
    },
    userPassion: null,
    scrollerEle: null,
    working: false,

    init: function() {
        var self = this;
        if (!this.init.done) {
			Facebook.init();

			setTimeout(function() {
				if(Analytics) { Analytics.init(); }
			}, 200);
			
            Player.initialize();

            // Default settings
            if (localStorage.soundEffects === undefined) { localStorage.soundEffects = false; }
            if (localStorage.highDef === undefined) { localStorage.highDef = false; }
            this.init.done = true;
        }

        APP.refreshSettings();
        User.fetchData(function(success) {

            if (!self.router) {
                self.router = initializeRouter({ bindAppRoutes: success });
            }
        });

        return this;
    },
    dispatcher: function(view) {
        this.router.navigate(view, { trigger: true });
    },
    playerDispatcher: function(options) {
        Backbone.history.navigate("player", false);
        this.router.loadView(new PlayerView(options), function() {
            // Stub for callback
        }, {
            scroller: false
        }, "player");
    },
    dealloc: function() {
        this.click = false;
        return this;
    },
    load: function(view, options) {
        options = options || {};
        if(this.templates[view]) {
            return this.templates[view](options);
        } else {
            Util.log("templates['" + view + "'] does not exist");
            return "";
        }
    },
    refreshSettings: function(cb) {
        Api.getAppSettings(function(response) {
            if(response) {
                Api.loadSettings(response, cb);
            } else {
                cb();
            }
        });
    },
    loadTemplates: function() {
        // This function loads all the HTML templates via ajax and stores them into the APP.templates JS array for instant use.
        templateLoader.load([
            "home",
            "rate",
            "start",
            "discovery",
            "coach",
            "movieLobby",
            "listSummary",
            "listSummaryJF",
            "listSummaryItems",
            "messages",
            "conversation",
            "movieLobby",
            "movieLobbySeen",
            "movieListSeen",
            "searchUserList",
            "profile",
            "search",
            "lists",
            "listRow",
            "picks",
            "pack",
            "otherListRow",
            "moreMovies",
            "newSearch",
            "result",
            "userLists",
            "login",
            "inviteUserList",
            "register",
            "welcomeScreen1",
            "welcomeScreen2",
            "welcomeScreen3",
            "welcomeScreen4",
            "movieServices",
            "discussion",
            "discussionMessage",
            "passwordRecovery",
            "profileContent", 
            "profileInfo",
            "rightMenu",
            "feedItem",
            "notifications",
            "likes",
            "matches",
            "matchesList",
            "matchTopThree",
            "matchBack",
            "settings",
            "settingsNotifications",
            "recommendationsUserList",
            "recommendedPeople",
            "recommendedPerson",
            "activityFeed",
            "categoryFeed",
            "userRecs",
            "settingsSocial",
            "whosGoing",
            "events",
            "event",
            "createEvent",
            "userMatches",
            "recFeedItems",
            "greeting",
            "homeHeader",
            "header",
            "homeQ",
            "wantToItem",
            "wantToSort",
            "welcomeCategories", 
            "concierge",
            "statusUpdateMovie",
            "upNext",
            "userFeed",
            "searchStatusUpdate",
            "feedSearchResults",
            "recommendations",
            "recItems",
            "recommendedList",
            "recommendedListPart",
            "favoriteDelta",
            "soloPassion",
            "dualPassion",
            "reportUserPopup",
            "kceDrop",
            "kce",
            "listRowItem",
            "noConnection",
            "editAccount",
            "inactiveAccount",
            "fabricPlayer",
            "levelUp",
            "fabricMenu",
            "lastStatus"
        ], function() {
            window.APP.init();
        });
    }
};