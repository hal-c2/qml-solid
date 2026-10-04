import QtQuick
import QtQuick.Templates as T

// A popup as a style has it: it says what dims the window behind it.
T.Popup {
    T.Overlay.modal: Rectangle { color: "#12000000" }
}
