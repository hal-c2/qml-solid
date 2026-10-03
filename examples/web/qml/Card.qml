import OpenTUI

// A titled box: what a component offers the files that use it.
Rectangle {
    id: card
    objectName: "card"

    property string title: "Untitled"
    // Another name for a property of an object inside.
    property alias note: footer.text
    // The children of an instance go into the body, not into the root.
    default property alias content: body.data
    signal picked(int step)

    onTitleChanged: Shell.dispatch("card.retitled", { title: title })
    Component.onCompleted: Shell.dispatch("card.completed", { title: title })

    flexDirection: "column"
    flexShrink: 0
    border.width: 1
    border.style: "rounded"
    border.color: Theme.colors.faint
    paddingX: 1

    Text {
        objectName: "cardTitle"
        text: card.title
        font.bold: true
        onMouseDown: card.picked(1)
    }
    Item {
        id: body
        objectName: "cardBody"
        flexDirection: "column"
    }
    Text {
        id: footer
        objectName: "cardNote"
        text: "no note"
        color: Theme.colors.dim
    }
}
