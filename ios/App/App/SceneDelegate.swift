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
        NotificationCenter.default.addObserver(self, selector: #selector(audioInterrupted(_:)), name: AVAudioSession.interruptionNotification, object: nil)
    }

    // Back from the background (the app was swiped away to the home screen, not
    // closed): iOS deactivated the app's audio session meanwhile, and the web
    // view does not always ask for it again, so every sound stayed silent even
    // though Web Audio reported itself running (seen on build 1.0 (9), 2026-10-01).
    // Asking for the session again here brings music, effects and the voice back;
    // the category is left to WebKit, so the silent switch behaves as before.
    func sceneDidBecomeActive(_ scene: UIScene) {
        try? AVAudioSession.sharedInstance().setActive(true)
        wakeWebAudio()
    }

    // The page wakes its own audio on visibilitychange, but that can arrive
    // before the session above is active again (iPad, build 1.0 (16)): the
    // contexts it builds then stay silent. So once the session is back, the page
    // is told to throw its contexts away and build them again — and the same
    // when an interruption (a call, Siri, another app's audio) has ended.
    private func wakeWebAudio() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
            guard let vc = self?.window?.rootViewController as? CAPBridgeViewController else { return }
            vc.webView?.evaluateJavaScript("window.KWIZILLO_M1&&window.KWIZILLO_M1.audio&&window.KWIZILLO_M1.audio.wake(true,true)", completionHandler: nil)
        }
    }

    @objc private func audioInterrupted(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              AVAudioSession.InterruptionType(rawValue: raw) == .ended else { return }
        try? AVAudioSession.sharedInstance().setActive(true)
        wakeWebAudio()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
