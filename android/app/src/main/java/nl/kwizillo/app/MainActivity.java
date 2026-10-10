package nl.kwizillo.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KwizilloBillingPlugin.class);   // before super: the bridge is built there
        registerPlugin(KwizilloSpeechPlugin.class);    // Talen, Spreken: on-device recognition
        super.onCreate(savedInstanceState);
        // Same as the iOS app: a phone plays upright, a tablet turns freely (the
        // web layer has a wide frame for landscape). 600 dp is Android's own
        // line between the two.
        if (getResources().getConfiguration().smallestScreenWidthDp < 600) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
        // The opening film and its theme start with sound as the app opens; an
        // app, unlike a web page, may play media without waiting for a tap.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
