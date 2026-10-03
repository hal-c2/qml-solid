// Stands in for InAppStoreQmlType. The C++ asks the store of the platform
// (Google Play, the App Store), and a browser has none: this one knows the
// two things the game sells, charges nothing for them, and approves every
// purchase. What is unlocked is remembered as long as the store is there.
import QtQml

QtObject {
    id: store

    function restorePurchases() {
        for (const identifier of owned)
            Qt.callLater(() => answer(Transaction.PurchaseRestored, identifier))
    }

    // The rest is InAppStore, which the C++ Product reaches through store().
    signal productRegistered(var product)
    signal productUnknown(int productType, string identifier)
    signal transactionReady(Transaction transaction)

    // As the stores name and describe them in the example's documentation.
    readonly property var catalogue: ({
        "qt.io.demo.hangman.100vowels": {
            title: "100 Vowels",
            description: "Adds 100 Vowels to the Vowel Pool for use when guessing words.",
        },
        "qt.io.demo.hangman.unlockvowels": {
            title: "Unlock Vowels",
            description: "Grants unlimited use of vowels.",
        },
    })
    property var registeredProducts: ({})
    property var owned: []
    property int orders: 0
    readonly property Component transaction: Component {
        Transaction {}
    }

    function registeredProduct(identifier) {
        return registeredProducts[identifier] ?? null
    }

    // A store answers later.
    function registerProduct(productType, identifier) {
        Qt.callLater(() => {
            const listed = catalogue[identifier]
            if (!listed) {
                productUnknown(productType, identifier)
                return
            }
            const product = { identifier, productType, price: "Free", title: listed.title, description: listed.description }
            registeredProducts[identifier] = product
            productRegistered(product)
        })
    }

    function purchase(identifier) {
        Qt.callLater(() => answer(Transaction.PurchaseApproved, identifier))
    }

    function answer(status, identifier) {
        const product = registeredProduct(identifier)
        // Bought once and kept.
        if (status === Transaction.PurchaseApproved && product.productType === Product.Unlockable && !owned.includes(identifier))
            owned = owned.concat([identifier])
        transactionReady(transaction.createObject(store, {
            status: status,
            product: product,
            orderId: "standin-" + ++orders,
            timestamp: new Date(),
        }))
    }
}
