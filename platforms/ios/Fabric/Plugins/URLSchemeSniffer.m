
#import "URLSchemeSniffer.h"
#import <Cordova/CDV.h>

@implementation URLSchemeSniffer

- (void)urlSchemeSupported:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* urlScheme = [command.arguments objectAtIndex:0];
    NSString* javaScript;
    BOOL appInstalled;
        
    if (urlScheme != nil && [urlScheme length] > 0) {
        appInstalled = [[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:urlScheme]];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:appInstalled];
        
        javaScript = [pluginResult toSuccessCallbackString:command.callbackId];
        
        NSLog(@"Scheme %@ installed: %i", urlScheme, appInstalled);
        
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        javaScript = [pluginResult toErrorCallbackString:command.callbackId];
    }
    
    [self writeJavascript:javaScript];

}

@end
    