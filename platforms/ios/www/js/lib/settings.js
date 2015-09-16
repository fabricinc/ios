// Useful settings for testing.
var TESTING_SETTINGS = false;
var STAGE_API = false,
    LOGGING = false;

// Set API location
var API_URL = "http://dev.api.tryfabric.com/";
var API_SURL = "http://dev.api.tryfabric.com/";

// Stage API
if (STAGE_API) {
    API_URL = "http://staging.api.tryfabric.com/";
    API_SURL = "http://staging.api.tryfabric.com/";
}

// Set production API
if (!TESTING_SETTINGS) {
    STAGE_API = false;
    API_URL = "https://api.tryfabric.com/";
    API_SURL = "https://api.tryfabric.com/";
}

// Constants from User.
var FB_GRAPH_URL = 'https://graph.facebook.com/';
