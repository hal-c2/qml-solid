import QtQuick

Text {
    enum Shade { Pale, Mid, Deep = 9 }

    property int shade: Swatch.Shade.Mid
    property int deepest: Swatch.Deep
}
