import Foundation
import Capacitor
import StoreKit

// Kwizillo Premium on iOS: the StoreKit 2 side of the contract the web layer
// expects (`window.KwizilloStoreKit`, see premium.js → storeKitProvider).
//
//   products(ids)          → [{key,id,displayPrice,price,currency,period,months,trialDays,trialEligible}]
//   purchase(id)           → {result:'purchased'|'pending'|'cancelled', entitlement?}
//   restore()              → {result:'restored'|'none', entitlement?}
//   currentEntitlement()   → {entitlement: {...} | null}
//   manageSubscriptions()  → {result:'opened'|'unavailable'}
//
// Only *verified* transactions ever become an entitlement. Prices are Apple's
// localized strings. Nothing about the child is sent anywhere: StoreKit only
// sees the product id.
@objc(KwizilloStoreKitPlugin)
public class KwizilloStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KwizilloStoreKitPlugin"
    public let jsName = "KwizilloStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentEntitlement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
    ]

    private static let productIds = ["nl.kwizillo.app.premium.monthly", "nl.kwizillo.app.premium.yearly"]
    private var updatesTask: Task<Void, Never>?

    public override func load() {
        // Renewals, revocations and Ask-to-Buy approvals arrive here whenever the
        // app runs; the web layer refreshes on the event.
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    let entitlement = await Self.currentEntitlement()
                    self?.notifyListeners("entitlementChanged", data: ["entitlement": entitlement ?? NSNull()])
                }
            }
        }
    }
    deinit { updatesTask?.cancel() }

    // MARK: products

    @objc func products(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? Self.productIds
        Task {
            do {
                let products = try await Product.products(for: ids)
                var list: [[String: Any]] = []
                for p in products { list.append(await Self.describe(p)) }
                call.resolve(["products": list])
            } catch {
                call.reject("products", "unavailable", error)
            }
        }
    }

    private static func describe(_ p: Product) async -> [String: Any] {
        var months = 1, period = "month", trialDays = 0, eligible = false
        if let sub = p.subscription {
            switch sub.subscriptionPeriod.unit {
            case .year: period = "year"; months = 12 * sub.subscriptionPeriod.value
            case .month: period = "month"; months = sub.subscriptionPeriod.value
            case .week: period = "week"; months = 0
            case .day: period = "day"; months = 0
            @unknown default: break
            }
            if let intro = sub.introductoryOffer, intro.paymentMode == .freeTrial {
                switch intro.period.unit {
                case .day: trialDays = intro.period.value
                case .week: trialDays = intro.period.value * 7
                case .month: trialDays = intro.period.value * 30
                case .year: trialDays = intro.period.value * 365
                @unknown default: trialDays = 0
                }
                eligible = await sub.isEligibleForIntroOffer
            }
        }
        return [
            "key": p.id.hasSuffix(".yearly") ? "yearly" : "monthly",
            "id": p.id,
            "displayPrice": p.displayPrice,
            "price": NSDecimalNumber(decimal: p.price).doubleValue,
            "currency": p.priceFormatStyle.currencyCode,
            "period": period,
            "months": months,
            "trialDays": trialDays,
            "trialEligible": eligible,
        ]
    }

    // MARK: purchase

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("purchase", "missing-id"); return }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else { call.reject("purchase", "unknown-product"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else { call.reject("purchase", "unverified"); return }
                    await transaction.finish()
                    let entitlement = Self.entitlement(from: transaction)
                    call.resolve(["result": "purchased", "entitlement": entitlement])
                case .pending:
                    call.resolve(["result": "pending"])          // Ask to Buy: nothing granted until approved
                case .userCancelled:
                    call.resolve(["result": "cancelled"])        // not an error
                @unknown default:
                    call.resolve(["result": "cancelled"])
                }
            } catch {
                call.reject("purchase", "failed", error)
            }
        }
    }

    // MARK: restore / current

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                if let e = await Self.currentEntitlement() { call.resolve(["result": "restored", "entitlement": e]) }
                else { call.resolve(["result": "none"]) }
            } catch {
                call.reject("restore", "failed", error)
            }
        }
    }

    @objc func currentEntitlement(_ call: CAPPluginCall) {
        Task {
            let e = await Self.currentEntitlement()
            call.resolve(["entitlement": e ?? NSNull()])
        }
    }

    // The newest verified, unrevoked, unexpired subscription transaction for our group.
    private static func currentEntitlement() async -> [String: Any]? {
        var best: Transaction?
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result, productIds.contains(t.productID), t.revocationDate == nil else { continue }
            if let exp = t.expirationDate, exp < Date() { continue }
            if best == nil || (t.expirationDate ?? .distantFuture) > (best!.expirationDate ?? .distantFuture) { best = t }
        }
        return best.map { entitlement(from: $0) }
    }

    private static func entitlement(from t: Transaction) -> [String: Any] {
        let iso = ISO8601DateFormatter()
        var trial = false
        if #available(iOS 17.2, *) { trial = t.offer?.type == .introductory } else { trial = t.offerType == .introductory }
        return [
            "status": "active",
            "productId": t.productID,
            "type": t.productID.hasSuffix(".yearly") ? "year" : "month",
            "expiresAt": t.expirationDate.map { iso.string(from: $0) } ?? NSNull(),
            "store": "ios",
            "trial": trial,
        ]
    }

    // MARK: manage

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = self.bridge?.viewController?.view.window?.windowScene else { call.resolve(["result": "unavailable"]); return }
            do { try await AppStore.showManageSubscriptions(in: scene); call.resolve(["result": "opened"]) }
            catch { call.resolve(["result": "unavailable"]) }
        }
    }
}
