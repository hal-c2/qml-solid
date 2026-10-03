import OpenTUI

// What QML lets one file ask of another: an instance sets the component's
// properties and its root object's, handles its signals and gives it children.
Item {
    id: features
    objectName: "features"
    property int count: 0

    flexDirection: "column"
    marginTop: 1

    // A component of this file alone.
    component Pill: Text {
        property string label: "?"
        text: "[" + label + "]"
        color: Theme.colors.dim
    }

    Card {
        objectName: "counterCard"
        title: "Picked " + features.count
        note: features.count > 2 ? "enough" : "keep going"
        border.color: Theme.colors.accent
        onPicked: features.count += step

        Pill { objectName: "pill"; label: "inline"; color: Theme.colors.success }
        Text { objectName: "cardChild"; text: "a child of the instance" }
    }
    Card { objectName: "plainCard" }
}
