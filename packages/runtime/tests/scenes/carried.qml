import QtQuick

// What a handler is given: what Qt's signal carries, which for the change of
// a property is its new value for some (`textChanged(text)`) and nothing for
// most (`widthChanged()`, and every property QML declares).
Item {
    id: root
    width: 400; height: 300
    property var notes: []
    function note(...parts) { notes.push(parts.map(part => part === undefined ? "undefined" : part).join(" ")) }

    // A property QML declares tells of its change and of nothing more.
    property int count: 0
    onCountChanged: (value) => root.note("count", value)
    QtObject {
        id: declared
        property string label: "a"
        property real size: 1
        onLabelChanged: function(value) { root.note("label", value) }
        // The name is the property's own.
        onSizeChanged: root.note("size", size)
    }

    // Qt's own: the name of an object is carried, by an argument the handler
    // names or by the name Qt gives it.
    QtObject {
        id: named
        onObjectNameChanged: (name) => root.note("objectName", name)
    }
    QtObject {
        id: injected
        onObjectNameChanged: root.note("objectName injected", objectName)
    }
    Item {
        id: item
        onWidthChanged: (width) => root.note("width", width)
        onVisibleChanged: (visible) => root.note("visible", visible)
        onFocusChanged: (focus) => root.note("focus", focus)
        onStateChanged: function(state) { root.note("state", state) }
    }
    Text {
        id: words
        onTextChanged: (text) => root.note("text", text)
        onFontChanged: (font) => root.note("font", font.pixelSize, font.bold)
        onLineHeightChanged: (height) => root.note("lineHeight", height)
        onStyleChanged: (style) => root.note("style", style === Text.Raised)
        onColorChanged: (color) => root.note("color", color)
    }
    NumberAnimation {
        id: animation
        onDurationChanged: (duration) => root.note("duration", duration)
    }
    Timer {
        id: timer
        onIntervalChanged: (interval) => root.note("interval", interval)
    }

    // A handler written from outside is given the same.
    Item { id: watched }
    Connections {
        target: watched
        function onFocusChanged(focus) { root.note("connections focus", focus) }
        function onStateChanged(state) { root.note("connections state", state) }
        function onWidthChanged(width) { root.note("connections width", width) }
    }

    // A signal QML declares carries what it is emitted with.
    signal moved(real x, real y)
    signal titled(string title)
    signal bare()
    onMoved: (a, b) => root.note("moved", a, b)
    onTitled: function(title) { root.note("titled", title, arguments.length) }
    onBare: (nothing) => root.note("bare", nothing)
    Connections {
        target: root
        function onMoved(first) { root.note("connections moved", first, arguments.length) }
        function onCountChanged(value) { root.note("connections count", value) }
    }
    Item {
        id: byName
        x: 7; width: 3
        signal moved(real x, real y)
        signal sized(real width)
        // The names the signal gives its arguments come before the object's.
        onMoved: root.note("moved by name", x, y)
        onSized: { root.note("sized by name", width) }
    }
    Item {
        id: fewer
        x: 7; y: 8
        signal moved(real x, real y)
        // A function says what its arguments are: the rest are the object's.
        onMoved: (first) => root.note("moved fewer", first, x, y)
    }

    function step(i) {
        switch (i) {
        case 0: count = 3; declared.label = "b"; declared.size = 2.5; break
        case 1: named.objectName = "see"; injected.objectName = "two"; break
        case 2: item.width = 40; item.visible = false; item.focus = true; item.state = "on"; break
        case 3: words.text = "hi"; words.font.pixelSize = 20; words.lineHeight = 2; words.style = Text.Raised; words.color = "red"; break
        case 4: animation.duration = 10; timer.interval = 50; break
        case 5: watched.focus = true; watched.state = "on"; watched.width = 5; break
        case 6: moved(1, 2); titled("t"); bare(); break
        case 7: byName.moved(5, 6); byName.sized(9); fewer.moved(5, 6); break
        }
    }
    function read() { const seen = notes; notes = []; return seen }
}
