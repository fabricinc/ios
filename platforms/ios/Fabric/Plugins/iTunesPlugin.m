//
//  iTunesPlugin.m
//  iTunesPlugin
//
//  Created by John Mead on 2/6/13.
//
//

#import "iTunesPlugin.h"
#import "StoreKitViewController.h"

@implementation iTunesPlugin
{
    StoreKitViewController *store;
}

@synthesize initializePluginCallback;
@synthesize storeHasBeenLoaded, storeFailure;

-(void)canOpenStoreInApp:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    if(NSClassFromString(@"SKStoreProductViewController")){
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

// This is called from the javascript side
-(void)openStoreWithProductId:(CDVInvokedUrlCommand *)command
{
    @try {
        // setting up the phonegap plugin connection
        [self setInitializePluginCallback:command.callbackId];
        // get the iTunes item id sent in the arguments object
        NSString *productId = command.arguments[0];
        // this is the view controller delegate for the StoreKit object
        store = [[StoreKitViewController alloc] initWithViewController:self.viewController];
        // setting self as delegate to store so we can get success, error, and timeout messages
        [store setDelegate:self];
        // modal dialog decoration
        self.viewController.view.backgroundColor = [UIColor blackColor];
        self.viewController.modalPresentationStyle = UIModalPresentationCurrentContext;
        [self.viewController presentViewController:store animated:YES completion:nil];
        // actually opening store view
        if(command.arguments != nil)
        {
            productId = command.arguments[0];
            // just trust me on the afterDelay nonsense
            [store performSelector:@selector(showStoreView:) withObject:productId afterDelay:0.3];
        }
    } @catch (NSException* exception) {
        // invoke JS failed callback
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    
}

- (void)storeOpenedSuccessfully
{
    if(![self storeFailure])
    {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.initializePluginCallback]];
    }
}

- (void)storeFailedToOpen
{
    [self setStoreFailure:YES];
    [self.viewController dismissViewControllerAnimated:NO completion:nil];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    [self writeJavascript: [pluginResult toErrorCallbackString:self.initializePluginCallback]];
}

@end
