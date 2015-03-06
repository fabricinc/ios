//
//  StoreKitViewController.m
//  iTunesPlugin
//
//  Created by John Mead on 2/6/13.
//
//

#import "StoreKitViewController.h"

@interface StoreKitViewController ()

@end

@implementation StoreKitViewController
{
    SKStoreProductViewController *storeViewController;
    UIActivityIndicatorView *activityView;
}

@synthesize cordovaViewController, delegate, storeFailed;


-(id)initWithViewController:(UIViewController *)controller
{
    self = [super init];    
    if(self) {
        [self setCordovaViewController:controller];
    }
    
    return self;
}

- (void)showStoreView:(NSString *)productId
{
    
    NSNumberFormatter * f = [[NSNumberFormatter alloc] init];
    [f setNumberStyle:NSNumberFormatterDecimalStyle];
    NSNumber * ID = [f numberFromString:productId];
    storeViewController = [[SKStoreProductViewController alloc] init];
    storeViewController.delegate = self;
    NSDictionary *parameters = @{SKStoreProductParameterITunesItemIdentifier:ID};
    
    // this needs a waiting indicator - store can take forever to load
    activityView=[[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
    activityView.center = CGPointMake(self.view.bounds.size.width / 2.0f, self.view.bounds.size.height / 2.0f - (self.view.bounds.size.height * .15));
    activityView.autoresizingMask = (UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleLeftMargin |
                                     UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleTopMargin);
    [self.view addSubview:activityView];
    
    // The store sometimes takes forever to load. We will wait for ten seconds before calling the
    // fail method, which in turn calls the JS side with a failed message via the iTunesPlugin.    
    NSTimer *timer = [NSTimer scheduledTimerWithTimeInterval: 10.0
                                                      target: self
                                                    selector:@selector(storeFailedToOpen:)
                                                    userInfo: nil repeats:NO];
    @try {
        // the busy spinner
        [activityView startAnimating];
        
        [storeViewController loadProductWithParameters:parameters completionBlock:^(BOOL result, NSError *error) {
            if (result && ![self storeFailed]) {
                [activityView stopAnimating];
                [self presentViewController:storeViewController animated:YES completion:nil];
                [self storeOpened:timer];
            } else {
                [activityView stopAnimating];
                [self storeFailedToOpen:timer];
                NSLog(@"error caught in StoreKitViewController showStoreView: %@", error);
            }
        }];
    } @catch (NSException* exception) {
        [activityView stopAnimating];
        [self storeFailedToOpen:timer];
        NSLog(@"error caught in StoreKitViewController showStoreView %@", exception);
    }
}

// notify the plugin that the store opened so it can make the success callback to the JS side
- (void)storeOpened:(NSTimer*)timer
{
    [timer invalidate];
    [[self delegate] storeOpenedSuccessfully];
}

// notify the plugin that we failed so it can make the fail callback to the JS side
- (void)storeFailedToOpen:(NSTimer*)timer
{
    [timer invalidate];
    [self setStoreFailed:YES];
    [activityView stopAnimating];
    [[self delegate] storeFailedToOpen];
}

-(void)productViewControllerDidFinish:(SKStoreProductViewController *)viewController
{
    [cordovaViewController dismissViewControllerAnimated:YES completion:nil];
    [cordovaViewController.view setAlpha:0];
    [self viewDidDisappear:NO];
}

-(void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear: animated];
    [cordovaViewController.view setAlpha:1];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end
