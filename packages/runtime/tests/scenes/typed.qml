import QtQuick

// A property of a type holds a value of that type, whatever it is given.
Item {
    id: root

    width: 200
    height: 200

    function same(x) { return x }

    property real w: 2.7
    property int a: w
    property int b: -w
    property int c: same("12")
    property int d: 7 / 2
    property int big: same(3e10)
    property string s: w
    property string t: same(3)
    property bool f: w
    property real r: same("2.5")
    property double dd: same(true)
    property color col: "red"
    property color unset
    property var v: 2.7
    property int e
    property int changes: 0

    onBChanged: changes += 1

    Text { id: label; text: "x" }

    function said(...values) {
        return values.map(value => typeof value + ":" + value).join(" | ")
    }

    function attempt(target, name, value) {
        let refused = ""
        try {
            target[name] = value
        } catch (error) {
            refused = error + " "
        }
        return refused + said(target[name])
    }

    function read() {
        const lines = [said(a, b, c, d, big, s, t, f, r, dd, col, unset, unset.valid, v, e, label.color)]
        for (const x of ["abc", NaN, undefined, null, 2.5, 3.5, -0.5, "0x10", " 7 ", [], {}, "2.7", "1e2", "", "+5", "-2.5",
                         "12abc", "012", ".5", "5.", 1e400, 2147483648, -2147483649, 4294967297, true, col, label])
            lines.push("int " + attempt(root, "a", x))
        for (const x of ["abc", undefined, null, true, " 7 ", "0x10", "", "1,5", {}, [], [3], col, root])
            lines.push("real " + attempt(root, "r", x))
        for (const x of [undefined, null, "false", 0, {}, "", NaN])
            lines.push("bool " + attempt(root, "f", x))
        for (const x of [{}, 1e21, 0.1 + 0.2, root, "red", col, [], ["a"], [1, 2], [65.7, "bc", [8364], true], () => 1, 1 / 3, -0, 1e-7, 0.0001, 0.00015,
                         0.001, 1e-5, 123456.789, 1e15, 1e10, 15000000000, 123456789012, 2 ** 53, NaN, Infinity, -Infinity,
                         Qt.rgba(1, 0, 0, 0.5), 100, true, null, undefined])
            lines.push("string " + attempt(root, "s", x))
        for (const x of [5, 1.5, true, undefined, null, 1e-7])
            lines.push("text " + attempt(label, "text", x))
        for (const x of ["red", "#80ff0000", "transparent", "", "nope", Qt.rgba(0, 1, 0, 1), null, 5, "#abc", [1, 2, 3], undefined])
            lines.push("color " + attempt(root, "col", x))
        for (const x of ["blue", undefined, null])
            lines.push("text color " + attempt(label, "color", x))
        // An assignment took `a` from its binding; `b` still follows, and
        // says so only when what it holds has changed.
        w = 3.9
        w = 3.95
        lines.push(said(a, b, changes))
        return lines
    }
}
