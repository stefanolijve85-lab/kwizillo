import UIKit
import Capacitor

// The app's bridge controller: registers the local StoreKit plugin (it lives in
// this target, not in a package), then Capacitor takes over.
class KwizilloViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(KwizilloStoreKitPlugin())
    }
}
