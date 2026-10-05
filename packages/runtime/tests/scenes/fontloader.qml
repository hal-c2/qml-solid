import QtQuick

// A font file that is not there.
Item {
    width: 400
    height: 300

    property alias missing: missing

    FontLoader { id: missing; source: "fonts/nowhere,at all.ttf" }
}
