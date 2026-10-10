package nl.kwizillo.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Talen, Spreken: the Android twin of KwizilloSpeechPlugin.swift. Recognition ON THE
 * DEVICE ONLY: SpeechRecognizer.createOnDeviceSpeechRecognizer (Android 12+), never the
 * networked recogniser. Older Android, or no on-device model for the language, reports
 * itself unavailable and the web layer lets the child say it out loud without a check.
 * Nothing is recorded or kept. Same calls and shapes as on iOS:
 *   available({lang}) → {available, onDevice, authorized, denied}
 *   requestPermission() → {granted}
 *   start({lang, maxMs}) → {heard, transcript}   event "level" {value 0..1}
 *   stop(), cancel()
 */
@CapacitorPlugin(name = "KwizilloSpeech", permissions = {
    @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
})
public class KwizilloSpeechPlugin extends Plugin {
    private static final Map<String, String> LOCALES = new HashMap<>();
    static {
        LOCALES.put("nl", "nl-NL"); LOCALES.put("en", "en-US"); LOCALES.put("de", "de-DE"); LOCALES.put("fr", "fr-FR");
        LOCALES.put("es", "es-ES"); LOCALES.put("it", "it-IT"); LOCALES.put("pt", "pt-BR"); LOCALES.put("ptpt", "pt-PT");
        LOCALES.put("da", "da-DK"); LOCALES.put("ru", "ru-RU"); LOCALES.put("ar", "ar-SA");
    }
    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private PluginCall current;
    private String transcript = "";
    private boolean voiced = false;

    private boolean onDeviceSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
    }

    @PluginMethod
    public void available(PluginCall call) {
        String lang = call.getString("lang", "");
        boolean on = LOCALES.containsKey(lang) && onDeviceSupported();
        PermissionState st = getPermissionState("microphone");
        JSObject r = new JSObject();
        r.put("available", on); r.put("onDevice", on);
        r.put("authorized", st == PermissionState.GRANTED); r.put("denied", st == PermissionState.DENIED);
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) { JSObject r = new JSObject(); r.put("granted", true); call.resolve(r); return; }
        requestPermissionForAlias("microphone", call, "permissionDone");
    }

    @PermissionCallback
    private void permissionDone(PluginCall call) {
        JSObject r = new JSObject(); r.put("granted", getPermissionState("microphone") == PermissionState.GRANTED); call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        String lang = call.getString("lang", "");
        if (!LOCALES.containsKey(lang) || !onDeviceSupported() || getPermissionState("microphone") != PermissionState.GRANTED) { call.reject("unavailable"); return; }
        call.setKeepAlive(true);
        main.post(() -> begin(call, LOCALES.get(lang), call.getInt("maxMs", 6000)));
    }

    private void begin(PluginCall call, String locale, int maxMs) {
        finish(true);
        current = call; transcript = ""; voiced = false;
        recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle b) {}
            @Override public void onBeginningOfSpeech() { voiced = true; }
            @Override public void onRmsChanged(float db) {
                JSObject e = new JSObject(); e.put("value", Math.max(0, Math.min(1, (db + 2) / 12.0))); notifyListeners("level", e);
            }
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onError(int error) { finish(false); }
            @Override public void onResults(Bundle results) { take(results); finish(false); }
            @Override public void onPartialResults(Bundle partial) { take(partial); }
            @Override public void onEvent(int type, Bundle params) {}
        });
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 900);
        recognizer.startListening(intent);
        main.postDelayed(() -> { if (current == call && recognizer != null) recognizer.stopListening(); }, maxMs);
    }

    private void take(Bundle b) {
        ArrayList<String> list = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (list != null && !list.isEmpty() && list.get(0) != null && !list.get(0).isEmpty()) transcript = list.get(0);
    }

    @PluginMethod
    public void stop(PluginCall call) { main.post(() -> { if (recognizer != null) recognizer.stopListening(); call.resolve(); }); }

    @PluginMethod
    public void cancel(PluginCall call) { main.post(() -> { finish(true); call.resolve(); }); }

    private void finish(boolean cancelled) {
        if (recognizer != null) { try { recognizer.cancel(); recognizer.destroy(); } catch (Exception ignored) {} recognizer = null; }
        PluginCall c = current; current = null;
        if (c != null) {
            JSObject r = new JSObject();
            if (cancelled) r.put("cancelled", true); else { r.put("heard", voiced || !transcript.isEmpty()); r.put("transcript", transcript); }
            c.resolve(r);
            c.setKeepAlive(false);
            getBridge().releaseCall(c);
        }
        transcript = "";
    }

    @Override
    protected void handleOnPause() { main.post(() -> finish(true)); }
}
