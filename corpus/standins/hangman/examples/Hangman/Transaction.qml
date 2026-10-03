// Stands in for InAppTransaction: what a store answers a purchase with.
// Only the store makes one.
import QtQml

QtObject {
    enum TransactionStatus { Unknown, PurchaseApproved, PurchaseFailed, PurchaseRestored }
    enum FailureReason { NoFailure, CanceledByUser, ErrorOccurred }

    property int status: Transaction.Unknown
    // What was bought: identifier, productType, price, title, description.
    property var product: null
    property string orderId
    property int failureReason: Transaction.NoFailure
    property string errorString
    property date timestamp

    function finalize() {
    }

    function platformProperty(propertyName) {
        return ""
    }
}
