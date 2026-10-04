// Stands in for InAppProductQmlType: one thing a Store sells, registered
// with it by its identifier, and the purchases of it.
import QtQml

QtObject {
    id: product

    enum Status { Uninitialized, PendingRegistration, Registered, Unknown }
    enum ProductType { Consumable, Unlockable }

    property string identifier
    property int type: -1
    readonly property string price: registered?.price ?? ""
    readonly property string title: registered?.title ?? ""
    readonly property string description: registered?.description ?? ""
    // The product's own to set: in C++ nothing else can.
    property int status: Product.Uninitialized
    property Store store: null

    signal purchaseSucceeded(Transaction transaction)
    signal purchaseFailed(Transaction transaction)
    signal purchaseRestored(Transaction transaction)

    function purchase() {
        if (registered && status === Product.Registered)
            store.purchase(identifier)
        else
            console.warn("Attempted to purchase unregistered product")
    }

    function resetStatus() {
        updateProduct()
    }

    // The rest is private in C++.
    property var registered: null
    property Store connected: null
    property bool complete: false

    onStoreChanged: setStore()
    onIdentifierChanged: updateProduct()
    onTypeChanged: updateProduct()
    Component.onCompleted: {
        complete = true
        setStore()
    }

    // The store's signals are the product's to hear.
    function setStore() {
        if (connected !== store) {
            if (connected) {
                connected.productRegistered.disconnect(handleProductRegistered)
                connected.productUnknown.disconnect(handleProductUnknown)
                connected.transactionReady.disconnect(handleTransaction)
            }
            connected = store
            if (connected) {
                connected.productRegistered.connect(handleProductRegistered)
                connected.productUnknown.connect(handleProductUnknown)
                connected.transactionReady.connect(handleTransaction)
            }
        }
        updateProduct()
    }

    function updateProduct() {
        if (!complete || !store)
            return
        let found = null
        if (identifier === "" || type === -1) {
            status = Product.Uninitialized
        } else {
            found = store.registeredProduct(identifier)
            if (found && found === registered)
                return
            if (!found) {
                status = Product.PendingRegistration
                store.registerProduct(type, identifier)
            } else if (found.productType !== type) {
                console.warn("Product registered multiple times with different product types.")
                found = null
                status = Product.Uninitialized
            } else {
                status = Product.Registered
            }
        }
        registered = found
    }

    function handleProductRegistered(found) {
        if (found.identifier === identifier) {
            registered = found
            status = Product.Registered
        }
    }

    function handleProductUnknown(productType, unknown) {
        if (unknown === identifier) {
            registered = null
            status = Product.Unknown
        }
    }

    function handleTransaction(transaction) {
        if (transaction.product.identifier !== identifier)
            return
        if (transaction.status === Transaction.PurchaseApproved)
            purchaseSucceeded(transaction)
        else if (transaction.status === Transaction.PurchaseRestored)
            purchaseRestored(transaction)
        else
            purchaseFailed(transaction)
    }
}
