import Foundation
import Capacitor
import Speech
import AVFoundation

// Talen, Spreken: speech recognition ON THE DEVICE ONLY (2026-10-10). The child's
// voice never leaves the iPhone/iPad: every request sets requiresOnDeviceRecognition,
// and a language whose model is not on the device reports itself unavailable, so the
// web layer falls back to "say it out loud" without a check. Nothing is recorded to a
// file or kept: the audio buffers go straight into the recogniser and are dropped.
//
//   available({lang})      → {available, onDevice, authorized}
//   requestPermission()    → {granted}   (microphone + speech recognition)
//   start({lang, maxMs})   → {heard, transcript}   events: "level" {value 0..1}
//   stop()                 → ends listening early (what was said counts)
//   cancel()               → ends listening, result {cancelled:true}
@objc(KwizilloSpeechPlugin)
public class KwizilloSpeechPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KwizilloSpeechPlugin"
    public let jsName = "KwizilloSpeech"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
    ]

    // The app's ten learning languages → the locale the recogniser knows.
    private static let locales: [String: String] = [
        "nl": "nl-NL", "en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES",
        "it": "it-IT", "pt": "pt-BR", "ptpt": "pt-PT", "da": "da-DK", "ru": "ru-RU", "ar": "ar-SA",
    ]

    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var call: CAPPluginCall?
    private var transcript = ""
    private var voicedMs = 0.0, silenceMs = 0.0, elapsedMs = 0.0, floorLevel = Double.infinity
    private var maxMs = 6000.0
    private var finishing = false, ending = false
    // The audio session as WebKit had it, restored when listening ends (the silent switch keeps working as before).
    private var saved: (AVAudioSession.Category, AVAudioSession.Mode, AVAudioSession.CategoryOptions)?

    private func recognizer(_ lang: String) -> SFSpeechRecognizer? {
        guard let id = Self.locales[lang] else { return nil }
        return SFSpeechRecognizer(locale: Locale(identifier: id))
    }

    @objc func available(_ call: CAPPluginCall) {
        let lang = call.getString("lang") ?? ""
        let r = recognizer(lang)
        let onDevice = r?.supportsOnDeviceRecognition ?? false
        let status = SFSpeechRecognizer.authorizationStatus()
        call.resolve(["available": onDevice && (r?.isAvailable ?? false), "onDevice": onDevice,
                      "authorized": status == .authorized, "denied": status == .denied || status == .restricted])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else { call.resolve(["granted": false]); return }
            AVAudioSession.sharedInstance().requestRecordPermission { ok in call.resolve(["granted": ok]) }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.begin(call) }
    }

    private func begin(_ call: CAPPluginCall) {
        finish(cancelled: true)
        let lang = call.getString("lang") ?? ""
        guard let r = recognizer(lang), r.supportsOnDeviceRecognition, r.isAvailable else {
            call.reject("unavailable"); return
        }
        maxMs = call.getDouble("maxMs") ?? 6000
        transcript = ""; voicedMs = 0; silenceMs = 0; elapsedMs = 0; floorLevel = .infinity; finishing = false; ending = false
        let session = AVAudioSession.sharedInstance()
        saved = (session.category, session.mode, session.categoryOptions)
        do {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .mixWithOthers, .allowBluetoothA2DP])
            try session.setActive(true)
        } catch { call.reject("audio session"); return }
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.requiresOnDeviceRecognition = true    // never to Apple's servers
        req.shouldReportPartialResults = true
        req.taskHint = .confirmation
        request = req
        self.call = call
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            guard let self = self else { return }
            self.request?.append(buffer)
            self.measure(buffer, rate: format.sampleRate)
        }
        task = r.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result { self.transcript = result.bestTranscription.formattedString }
            if error != nil || (result?.isFinal ?? false) { DispatchQueue.main.async { self.finish(cancelled: false) } }
        }
        engine.prepare()
        do { try engine.start() } catch { finish(cancelled: true); call.reject("engine"); return }
    }

    // The level for the waveform, and the end of the turn: a short silence after speech, or the time is up.
    private func measure(_ buffer: AVAudioPCMBuffer, rate: Double) {
        guard let data = buffer.floatChannelData?[0] else { return }
        let n = Int(buffer.frameLength); if n == 0 { return }
        var sum: Float = 0
        for i in 0..<n { sum += data[i] * data[i] }
        let rms = Double(sqrt(sum / Float(n)))
        let ms = Double(n) / rate * 1000
        elapsedMs += ms
        floorLevel = min(floorLevel == .infinity ? rms : floorLevel * 1.01 + 1e-5, rms)
        let thr = max(0.015, floorLevel * 3)
        if rms > thr { voicedMs += ms; silenceMs = 0 } else if voicedMs > 0 { silenceMs += ms }
        notifyListeners("level", data: ["value": min(1, rms / (thr * 4))])
        if !ending && ((voicedMs >= 300 && silenceMs >= 800) || elapsedMs >= maxMs) {
            ending = true
            DispatchQueue.main.async { self.request?.endAudio() }   // the recogniser then gives its final result
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { self.finish(cancelled: false) }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.request?.endAudio()
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { self.finish(cancelled: false) }
            call.resolve()
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.finish(cancelled: true); call.resolve() }
    }

    // Everything off: the tap, the engine, the task, the request; the session back to playback.
    private func finish(cancelled: Bool) {
        guard !finishing, call != nil || engine.isRunning || task != nil else { return }
        finishing = true
        if engine.isRunning { engine.stop() }
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio(); request = nil
        task?.cancel(); task = nil
        if let (cat, mode, opts) = saved { try? AVAudioSession.sharedInstance().setCategory(cat, mode: mode, options: opts); saved = nil }
        try? AVAudioSession.sharedInstance().setActive(true)
        if let c = call {
            call = nil
            if cancelled { c.resolve(["cancelled": true]) }
            else { c.resolve(["heard": voicedMs >= 300 || !transcript.isEmpty, "transcript": transcript]) }
        }
        transcript = ""
        finishing = false
    }
}
