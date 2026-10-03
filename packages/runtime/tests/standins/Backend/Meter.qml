import QtQml

QtObject {
    property int level: 0
    readonly property string reading: level + " of " + Engine.limit
    signal peaked(int level)

    function raise(by) {
        level = Math.min(level + by, Engine.limit)
        if (level === Engine.limit)
            peaked(level)
    }
}
