// Stands in for DesignEffect of Qt Design Studio's QtQuick.Studio.DesignEffects,
// which is not part of Qt: it blurs the item it is in, or what is behind it,
// and gives it shadows. This one has what the example sets and draws nothing.
import QtQuick

Item {
    property real layerBlurRadius: 0
    property bool layerBlurVisible: true
    property real backgroundBlurRadius: 0
    property bool backgroundBlurVisible: true
    property Item backgroundLayer
    property list<QtObject> effects
    visible: false
}
