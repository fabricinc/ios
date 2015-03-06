//
//  iTunesPlugin.h
//  iTunesPlugin
//
//  Created by John Mead on 2/6/13.
//
//

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h> //CDVPlugin
#import "StoreKitViewController.h"

@interface iTunesPlugin : CDVPlugin <ProcessDataDelegate>

@property (nonatomic, strong) NSString* initializePluginCallback;
@property (nonatomic) BOOL storeHasBeenLoaded;
@property (nonatomic) BOOL storeFailure;

-(void)canOpenStoreInApp:(CDVInvokedUrlCommand *)command;
-(void)openStoreWithProductId:(CDVInvokedUrlCommand*)command;

@end