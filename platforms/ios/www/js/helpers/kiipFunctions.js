// functions for use with Kiip
// JFP 11/15/2012

//TODO: Replace Kiip key and secret
// Kiip key and secret - make sure you update these to Fabric production values
// kiipEligible == true means to saveMoment at next appropriate event. Initialize as false.
// This is a test account: must be updated before app is submitted. Otherwise, I will get all the revenue -JFP
APP.Kiip = {
    kiip_key: "fc2d09703e6b05d8fc11ad178a29ad63",
    kiip_secret: "50296f5c681fcfe893ce00a32c0db4be",
    kiipEligible: false

}

APP.Kiip.saveKiipMoment = function(momentName, kiipEligible) {
    Util.log("Saving Kiip Moment " + momentName + " and setting App.kiipEligible to " + kiipEligible);
    APP.kiipEligible = kiipEligible;
    kiip.saveMoment(momentName, APP.Kiip.momentSuccessCallback, APP.Kiip.momentFailureCallback);
}

APP.Kiip.kiipInitSuccessCallback = function() {
    Util.log("kiip init success: " + arguments[0]);
}

APP.Kiip.kiipInitFailureCallback = function() {
    Util.log("kiip init failed: " + arguments[0]);
}

APP.Kiip.momentSuccessCallback = function() {
    Util.log("moment successfully called: " + arguments[0]);
    //kiip.listenContent(onContentSuccess,onContentFailure);
}

APP.Kiip.momentFailureCallback = function() {
    Util.log("moment failed: " + arguments.length);
}

APP.Kiip.onContentSuccess = function() {
    Util.log("virtual currency success: " + arguments[0]);
}

APP.Kiip.onContentFailure = function() {
    Util.log("virtual currency failure: " + arguments.length);
}

APP.Kiip.setPropertySuccess = function() {
    Util.log("set property success: " + arguments[0]);
}

APP.Kiip.setPropertyFailure = function() {
    Util.log("set property failure: " + arguments.length);
}