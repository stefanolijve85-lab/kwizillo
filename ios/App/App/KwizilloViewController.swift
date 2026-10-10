import UIKit
import WebKit
import Capacitor

// The app's bridge controller: registers the local StoreKit plugin (it lives in
// this target, not in a package), then Capacitor takes over.
class KwizilloViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(KwizilloStoreKitPlugin())
        bridge?.registerPluginInstance(KwizilloSpeechPlugin())   // Talen, Spreken: on-device recognition
    }

    // The opening film and its theme start the moment the app opens, with sound.
    // A web page must wait for a tap before it may play sound; an app may decide
    // for itself. Without this the iPhone showed a play button and "tap to start"
    // after a few seconds, and the iPad "tap for sound".
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        return config
    }
}
