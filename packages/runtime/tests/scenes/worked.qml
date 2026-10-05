// A source a block works out names a file beside this one, as one that is
// written does.
import QtQuick

Item {
    id: root
    width: 200
    height: 200
    property int kind: 0

    Image {
        id: picture
        source: {
            if (root.kind == 0) {
                "pictures/flag.png";
            } else {
                "pictures/none.png";
            }
        }
    }

    function read() { return [picture.status, picture.implicitWidth > 0, ("" + picture.source).endsWith("/scenes/pictures/flag.png")] }
}
