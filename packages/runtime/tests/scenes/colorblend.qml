import QtQuick
import QtQuick.Controls.impl

// A blend is opaque, but for the colour at either end, which is as it was.
Item {
    function read() {
        return [
            Color.blend("transparent", "#bdbdbd", 0),
            Color.blend("transparent", "#bdbdbd", 0.5),
            Color.blend("#ff0000", "#800000ff", 1),
            Color.blend("#ff0000", "#800000ff", 2),
            Color.blend("#80ff0000", "#0000ff", -1),
            Color.blend("#80ff0000", "#80ff0000", 0.5),
            Color.blend("#e0e0e0", "#bdbdbd", 0.5),
            Color.blend("#010203", "#040506", 0.5),
            Color.blend("#101113", "#ffffff", 0.3),
            Color.blend("#ffffff", "#000000", 0.1),
            Color.blend("#353637", "#0066ff", 0.7)
        ].map(colour => "" + colour)
    }
}
