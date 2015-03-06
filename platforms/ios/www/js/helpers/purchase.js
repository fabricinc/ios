/**
 *
 * iOS test for url scheme: BOOL myAppInstalled = [[UIApplication sharedApplication] canOpenURL:[NSURL urlWithString:@"myapp:"]];
 *
 */


PurchaseController = {
    active: false,
    buyRent: function($this, callback) {
        if (!callback) callback = function() {};

        $this.addClass('active');

        var self = this,
            link = {},
            $thisTicket = $this,
            publishedID = $this.attr('rel'),
            $buyRentLinksHTML = '',
            ext = '',
            button = '',
            chunk = "";

		Sounds.standardButton();

        Api.getPurchaseLinks(publishedID, function(links){
            $buyRentLinksHTML =
                $('<div class="buy-rent-pop-up-wrapper">' +
                    '<div class="buy-rent-pop-up">' +
                    '<div id="buy-rent-links"></div>' +
                    '</div>' +
                    '</div>');

            for (var i=0; i<links.length; i++) {
                var desu = links[i],
                    link = desu.link,
                    vendor = desu.vendor.toLowerCase(),
                    webView = desu.webView,
                    appStoreUrl = desu.appStoreUrl,
                    $snippet;

                button = 'images/com/' + vendor + '.png';
                $snippet = $('<div class="purchase-link ' + vendor + '"><div class="commerce" target="_blank" href="' + link + '"><img src="' + button + '" /></div></div>');

                $snippet.find(".commerce").attr('vendor', vendor);
                $snippet.find(".commerce").attr('publishedid', publishedID);

                // Fandango is a special case...  Opens in web view if not installed.
                if (vendor === 'fandango') $snippet.find(".commerce").addClass("fandango");

                if (webView) $snippet.find(".commerce").attr('webview', webView);
                if (appStoreUrl) $snippet.find(".commerce").attr('appstoreurl', appStoreUrl);

                $snippet.appendTo($buyRentLinksHTML.find("#buy-rent-links"));

            }

            if ($buyRentLinksHTML.find(".purchase-link").length === 0) {
                $buyRentLinksHTML.html('<div class="purchase-link empty">Great choice but this movie is not available at this time. Check back soon!</div>');
            }

            self.launchPurchaseLinks($buyRentLinksHTML.html(), callback);

        });
    },
    getLinkUrlScheme: function(link) {

    },
    launchPurchaseLinks: function(html, callback) {
        var self = this,
            player = false;

        if (!callback) callback = function() {};

        if ($("#wrapper").hasClass("player")) {
            APP.Player.pause();
            player = true;
        }

        UI.launchPopUp(html,function(){
            self.active = false;
            if (player) {
                APP.Player.play();
            }
            callback();
        });

    }
}