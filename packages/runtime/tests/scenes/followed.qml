// What reads a property reads it again when that property changes, and for
// nothing else that happens to the object: a page's font is read by all that
// is on it.
import QtQuick

Item {
    id: root
    width: 100
    height: 100

    property var runs: []
    property int read: { runs.push("fixed"); return page.fixed }
    property string named: { runs.push("name"); return page.objectName }

    Item {
        id: page
        property int fixed: 3
        property int other: 0
        objectName: "page"
    }

    Component { id: child; Item {} }

    function step(index) {
        if (index === 0) child.createObject(page)
        else if (index === 1) page.other = 1
        else if (index === 2) page.fixed = 4
        else if (index === 3) page.other = 2
        else page.objectName = "leaf"
        return said()
    }

    function said() {
        const now = [read, named, page.children.length]
        return [runs.splice(0), ...now]
    }
}
