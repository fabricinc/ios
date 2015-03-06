//
//  StoreKitViewController.h
//  iTunesPlugin
//
//  Created by John Mead on 2/6/13.
//
//

#import <UIKit/UIKit.h>
#import <StoreKit/StoreKit.h>

@protocol ProcessDataDelegate <NSObject>

@required
- (void) storeOpenedSuccessfully;
- (void) storeFailedToOpen;
@end

@interface StoreKitViewController : UIViewController <SKStoreProductViewControllerDelegate>
{
    id <ProcessDataDelegate> delegate;
}

@property(nonatomic, strong) UIViewController *cordovaViewController;
@property(retain) id delegate;
@property(nonatomic) BOOL storeFailed;

- (void)showStoreView:(NSString *)productId;
- (id)initWithViewController:(UIViewController *)controller;

@end