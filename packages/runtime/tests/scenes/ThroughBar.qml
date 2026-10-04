import QtQuick

Item {
    property alias button: button
    property alias label: label
    signal backClicked(int times)
    Item { id: button; width: 10; height: 10 }
    Text { id: label; text: "bar" }
}
