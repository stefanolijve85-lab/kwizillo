import UIKit
import AVFoundation
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = KwizilloViewController()   // registers the StoreKit plugin
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    // Back from the background (the app was swiped away to the home screen, not
    // closed): iOS deactivated the app's audio session meanwhile, and the web
    // view does not always ask for it again, so every sound stayed silent even
    // though Web Audio reported itself running (seen on build 1.0 (9), 2026-10-01).
    // Asking for the session again here brings music, effects and the voice back;
    // the category is left to WebKit, so the silent switch behaves as before.
    func sceneDidBecomeActive(_ scene: UIScene) {
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
