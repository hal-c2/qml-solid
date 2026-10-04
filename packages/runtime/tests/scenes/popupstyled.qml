import QtQuick
import QtQuick.Templates as T

// A popup of a style, which says what dims the window behind it, and one
// that says so itself as well.
Item {
    id: root
    width: 400
    height: 300

    DimmedPopup {
        id: styled
        x: 20; y: 20; width: 100; height: 80
        modal: true
    }
    DimmedPopup {
        id: own
        x: 200; y: 150; width: 100; height: 100
        modal: true
        T.Overlay.modal: Rectangle { objectName: "own"; color: "#80ff0000" }
    }

    function step(i) {
        switch (i) {
        case 0: styled.open(); break
        case 1: styled.close(); own.open(); break
        }
    }
    property int steps: 2
    function answers() {
        const overlay = T.Overlay.overlay
        const kids = []
        for (let i = 0; i < overlay.children.length; i++) {
            const kid = overlay.children[i]
            if (kid.visible && kid.color !== undefined) kids.push([kid.objectName, "" + kid.color, kid.width, kid.height])
        }
        return [styled.opened, own.opened, kids]
    }
}
