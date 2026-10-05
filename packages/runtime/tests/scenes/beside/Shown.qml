// Pictures named as files beside the program, which says for itself where
// those are.
import QtQuick

Item {
    width: 300
    height: 100

    function sizes() {
        return [flag, mark, inner].map(image => [image.status, image.implicitWidth, image.implicitHeight]);
    }
    function names() {
        return [flag, mark, inner].map(image => String(image.source));
    }

    Image { id: flag; source: "file:store/flag.png" }
    Image { id: mark; x: 100; source: "file:store/marks/mark.svg" }
    Image { id: inner; x: 200; source: "file:store/deep/alone.png" }
}
