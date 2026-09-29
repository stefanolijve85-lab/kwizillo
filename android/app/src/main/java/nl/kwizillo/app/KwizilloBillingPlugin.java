package nl.kwizillo.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.ProductType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Kwizillo Premium on Google Play: the Android twin of KwizilloStoreKitPlugin.swift.
 * Same five calls, same shapes, so premium.js treats both stores alike:
 * products, purchase, restore, currentEntitlement, manageSubscriptions, plus the
 * "entitlementChanged" event when Play reports a change (renewal, approved
 * pending purchase, cancellation noticed on refresh).
 *
 * Play Console setup (owner): two subscriptions with the same ids as on iOS,
 * nl.kwizillo.app.premium.monthly and nl.kwizillo.app.premium.yearly, each with
 * one auto-renewing base plan; the yearly one with a 7-day free-trial offer.
 * Play only offers the trial to someone who has not had it, so "eligible" is
 * simply "the offer is there".
 */
@CapacitorPlugin(name = "KwizilloBilling")
public class KwizilloBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "KwizilloBilling";
    private BillingClient client;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private PluginCall pendingPurchase;

    @Override
    public void load() {
        client = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    // Runs `then` once the Play connection is up, or rejects the call.
    private void ready(PluginCall call, String what, Runnable then) {
        if (client.isReady()) { then.run(); return; }
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult r) {
                if (r.getResponseCode() == BillingResponseCode.OK) then.run();
                else call.reject("unavailable", what);
            }
            @Override public void onBillingServiceDisconnected() { /* auto reconnection */ }
        });
    }

    @PluginMethod
    public void products(PluginCall call) {
        JSArray ids = call.getArray("ids");
        List<QueryProductDetailsParams.Product> list = new ArrayList<>();
        try {
            for (String id : ids.<String>toList())
                list.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(ProductType.SUBS).build());
        } catch (Exception e) { call.reject("missing-ids", "products"); return; }
        ready(call, "products", () -> client.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(list).build(),
            (r, result) -> {
                if (r.getResponseCode() != BillingResponseCode.OK) { call.reject("unavailable", "products"); return; }
                JSArray out = new JSArray();
                for (ProductDetails p : result.getProductDetailsList()) {
                    details.put(p.getProductId(), p);
                    JSObject d = describe(p);
                    if (d != null) out.put(d);
                }
                JSObject res = new JSObject(); res.put("products", out); call.resolve(res);
            }));
    }

    // The offer a purchase uses: the free trial when Play offers one, else the base plan.
    private static ProductDetails.SubscriptionOfferDetails offer(ProductDetails p) {
        List<ProductDetails.SubscriptionOfferDetails> offers = p.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        for (ProductDetails.SubscriptionOfferDetails o : offers) if (trialDays(o) > 0) return o;
        for (ProductDetails.SubscriptionOfferDetails o : offers) if (o.getOfferId() == null) return o;
        return offers.get(0);
    }

    private static int trialDays(ProductDetails.SubscriptionOfferDetails o) {
        for (ProductDetails.PricingPhase ph : o.getPricingPhases().getPricingPhaseList())
            if (ph.getPriceAmountMicros() == 0) return days(ph.getBillingPeriod()) * Math.max(1, ph.getBillingCycleCount());
        return 0;
    }

    // ISO 8601 period (P7D, P1W, P1M, P1Y) in days, near enough for a label.
    private static int days(String iso) {
        if (iso == null) return 0;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)W)?(?:(\\d+)D)?").matcher(iso);
        if (!m.matches()) return 0;
        int y = m.group(1) == null ? 0 : Integer.parseInt(m.group(1)), mo = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        int w = m.group(3) == null ? 0 : Integer.parseInt(m.group(3)), d = m.group(4) == null ? 0 : Integer.parseInt(m.group(4));
        return y * 365 + mo * 30 + w * 7 + d;
    }

    private static JSObject describe(ProductDetails p) {
        ProductDetails.SubscriptionOfferDetails o = offer(p);
        if (o == null) return null;
        // The recurring price is the last phase (after any trial).
        List<ProductDetails.PricingPhase> phases = o.getPricingPhases().getPricingPhaseList();
        ProductDetails.PricingPhase base = phases.get(phases.size() - 1);
        boolean yearly = p.getProductId().endsWith(".yearly");
        int trial = trialDays(o);
        JSObject d = new JSObject();
        d.put("key", yearly ? "yearly" : "monthly");
        d.put("id", p.getProductId());
        d.put("displayPrice", base.getFormattedPrice());
        d.put("price", base.getPriceAmountMicros() / 1_000_000.0);
        d.put("currency", base.getPriceCurrencyCode());
        d.put("period", yearly ? "year" : "month");
        d.put("months", yearly ? 12 : 1);
        d.put("trialDays", trial);
        d.put("trialEligible", trial > 0);
        return d;
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("missing-id", "purchase"); return; }
        ready(call, "purchase", () -> {
            ProductDetails p = details.get(id);
            ProductDetails.SubscriptionOfferDetails o = p == null ? null : offer(p);
            if (p == null || o == null) { call.reject("unknown-product", "purchase"); return; }
            if (pendingPurchase != null) { call.reject("busy", "purchase"); return; }
            List<BillingFlowParams.ProductDetailsParams> list = new ArrayList<>();
            list.add(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(p).setOfferToken(o.getOfferToken()).build());
            pendingPurchase = call;
            call.setKeepAlive(true);
            getActivity().runOnUiThread(() -> {
                BillingResult r = client.launchBillingFlow(getActivity(), BillingFlowParams.newBuilder().setProductDetailsParamsList(list).build());
                if (r.getResponseCode() != BillingResponseCode.OK) finishPurchase(null, r.getResponseCode());
            });
        });
    }

    // Play's answer to launchBillingFlow, and every later change (a pending
    // purchase approved, a renewal) while the app runs.
    @Override
    public void onPurchasesUpdated(BillingResult r, List<Purchase> purchases) {
        Purchase done = null;
        if (r.getResponseCode() == BillingResponseCode.OK && purchases != null) {
            for (Purchase p : purchases) if (verified(p)) { acknowledge(p); if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED || done == null) done = p; }
        }
        if (pendingPurchase == null) { if (done != null) notifyChanged(); return; }
        finishPurchase(done, r.getResponseCode());
    }

    private void finishPurchase(Purchase p, int code) {
        PluginCall call = pendingPurchase; pendingPurchase = null;
        if (call == null) return;
        call.setKeepAlive(false);
        JSObject res = new JSObject();
        if (p != null && p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            res.put("result", "purchased"); res.put("entitlement", entitlement(p)); call.resolve(res);
        } else if (p != null && p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            res.put("result", "pending"); call.resolve(res);           // nothing granted until Play confirms
        } else if (code == BillingResponseCode.USER_CANCELED) {
            res.put("result", "cancelled"); call.resolve(res);         // not an error
        } else if (code == BillingResponseCode.ITEM_ALREADY_OWNED) {
            queryActive(e -> { JSObject o = new JSObject(); o.put("result", e != null ? "purchased" : "cancelled"); if (e != null) o.put("entitlement", e); call.resolve(o); });
        } else {
            call.reject("failed", "purchase");
        }
    }

    // A subscription that is not acknowledged within three days is refunded by Play.
    private void acknowledge(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || p.isAcknowledged()) return;
        client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(),
            r -> { if (r.getResponseCode() != BillingResponseCode.OK) Log.w(TAG, "acknowledge failed: " + r.getResponseCode()); });
    }

    // The signature Play puts on every purchase, checked against the app's licence
    // key. Without a key in the build (development) the check is skipped and logged.
    private static boolean verified(Purchase p) {
        String key = BuildConfig.PLAY_LICENSE_KEY;
        if (key == null || key.isEmpty()) { Log.w(TAG, "no PLAY_LICENSE_KEY in this build; purchase signature not checked"); return true; }
        try {
            PublicKey pub = KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(Base64.decode(key, Base64.DEFAULT)));
            Signature s = Signature.getInstance("SHA1withRSA");
            s.initVerify(pub);
            s.update(p.getOriginalJson().getBytes("UTF-8"));
            return s.verify(Base64.decode(p.getSignature(), Base64.DEFAULT));
        } catch (Exception e) { Log.w(TAG, "signature check failed", e); return false; }
    }

    private static JSObject entitlement(Purchase p) {
        String id = p.getProducts().isEmpty() ? "" : p.getProducts().get(0);
        JSObject e = new JSObject();
        e.put("status", "active");
        e.put("productId", id);
        e.put("type", id.endsWith(".yearly") ? "year" : "month");
        // Play does not tell the device when a subscription ends; it lists it only
        // while it is active. premium.js asks again on every start and resume.
        e.put("expiresAt", JSObject.NULL);
        e.put("store", "android");
        e.put("autoRenewing", p.isAutoRenewing());
        return e;
    }

    private interface Found { void run(JSObject entitlement); }

    private void queryActive(Found found) {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(ProductType.SUBS).build(), (r, list) -> {
            JSObject e = null;
            if (r.getResponseCode() == BillingResponseCode.OK && list != null)
                for (Purchase p : list)
                    if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED && verified(p)) { acknowledge(p); e = entitlement(p); break; }
            found.run(e);
        });
    }

    @PluginMethod
    public void restore(PluginCall call) {
        ready(call, "restore", () -> queryActive(e -> {
            JSObject res = new JSObject();
            if (e != null) { res.put("result", "restored"); res.put("entitlement", e); } else res.put("result", "none");
            call.resolve(res);
        }));
    }

    @PluginMethod
    public void currentEntitlement(PluginCall call) {
        ready(call, "currentEntitlement", () -> queryActive(e -> {
            JSObject res = new JSObject(); res.put("entitlement", e == null ? JSObject.NULL : e); call.resolve(res);
        }));
    }

    // Play's own subscription page for this app (cancel, change plan, payment).
    @PluginMethod
    public void manageSubscriptions(PluginCall call) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/account/subscriptions?package=" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject res = new JSObject(); res.put("result", "opened"); call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject(); res.put("result", "unavailable"); call.resolve(res);
        }
    }

    private void notifyChanged() {
        queryActive(e -> { JSObject d = new JSObject(); d.put("entitlement", e == null ? JSObject.NULL : e); notifyListeners("entitlementChanged", d); });
    }
}
