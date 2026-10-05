import QtQuick
import QtQuick.Controls.impl

// Pictures chosen by the states that are so (`assets/makepatches.py` says
// which files there are to choose among): each image is given the name its
// files start with, and a selector on its source.
Item {
    id: root
    width: 200
    height: 200

    property bool a: true
    property bool b: true
    property bool c: false
    property bool d: false

    // A state each: the one given first counts for more.
    Image { id: oneAB; source: "../assets/chosen/one"; ImageSelector on source { id: selector; states: [{"a": root.a}, {"b": root.b}] } }
    Image { id: oneBA; source: "../assets/chosen/one"; ImageSelector on source { states: [{"b": root.b}, {"a": root.a}] } }
    // Both at once, in the order of their names.
    Image { id: twoAB; source: "../assets/chosen/two"; ImageSelector on source { states: [{"a": root.a}, {"b": root.b}] } }
    Image { id: twoBA; source: "../assets/chosen/two"; ImageSelector on source { states: [{"b": root.b}, {"a": root.a}] } }
    // Four states, and files for some of them together.
    Image { id: skip; source: "../assets/chosen/skip"; ImageSelector on source { states: [{"a": root.a}, {"b": root.b}, {"c": root.c}, {"d": root.d}] } }
    Image { id: gap; source: "../assets/chosen/gap"; ImageSelector on source { states: [{"a": root.a}, {"b": root.b}, {"c": root.c}, {"d": root.d}] } }
    Image { id: wrap; source: "../assets/chosen/wrap"; ImageSelector on source { states: [{"a": root.a}, {"b": root.b}, {"c": root.c}, {"d": root.d}] } }
    // No file by the name, and none but for a state.
    Image { id: none; source: "../assets/chosen/missing"; ImageSelector on source { states: [{"a": root.a}] } }
    Image { id: only; source: "../assets/chosen/only"; ImageSelector on source { states: [{"a": root.c}] } }
    // What the file's name ends in, by the kind of selector.
    NinePatchImage { id: ext; source: "../assets/chosen/ext"; NinePatchImageSelector on source { states: [{"a": root.c}] } }
    Image { id: flat; source: "../assets/chosen/flat"; ImageSelector on source {} }
    NinePatchImage { id: late; source: "../assets/chosen/late"; NinePatchImageSelector on source {} }
    Image { id: spin; source: "../assets/chosen/spin"; AnimatedImageSelector on source {} }
    Image { id: turn; source: "../assets/chosen/turn"; AnimatedImageSelector on source {} }
    Image { id: sep; source: "../assets/chosen/sep"; ImageSelector on source { id: separated; separator: "_"; states: [{"a": root.a}, {"b": root.b}] } }
    Image { id: uncached; source: "../assets/chosen/one"; ImageSelector on source { cache: false; states: [{"a": root.a}, {"b": root.b}] } }
    // A state of several names is its first, as they are sorted.
    Image { id: sorted; source: "../assets/chosen/one"; ImageSelector on source { states: [{"b": true, "a": false}] } }
    Image { id: sortedToo; source: "../assets/chosen/one"; ImageSelector on source { states: [{"a": true, "b": false}] } }
    // What is so, of values that are not true or false.
    Repeater {
        id: values
        model: ["false", "0", "no", "", "False", 2, 0, -0.5, null, undefined, root, [1], {"b": 1}]
        Image {
            required property var modelData
            source: "../assets/chosen/one"
            ImageSelector on source { states: [{"a": modelData}] }
        }
    }
    Image { id: unnumbered; source: "../assets/chosen/one"; ImageSelector on source { states: [{"a": 0 / 0}] } }

    readonly property var all: [oneAB, oneBA, twoAB, twoBA, skip, gap, wrap, none, only, ext, flat, late, spin, turn, sep, uncached, sorted, sortedToo]

    function ready() {
        return all.every((image) => image.status !== Image.Loading)
    }

    readonly property int steps: 7
    function step(index) {
        [() => { c = true; d = true },
         () => { b = false },
         () => { a = false },
         () => { a = true; b = true; oneAB.source = Qt.resolvedUrl("../assets/chosen/two") },
         () => { separated.states = [{"a": true}] },
         () => { separated.separator = "-" },
         () => { oneAB.source = "" }][index]()
    }

    function file(url) {
        return String(url).split("/").pop()
    }

    function answers() {
        const truths = []
        for (let index = 0; index < values.count; index++)
            truths.push(file(values.itemAt(index).source))
        truths.push(file(unnumbered.source))
        return [all.map((image) => file(image.source)), all.map((image) => image.status), truths,
            [selector.name, file(selector.source), file(selector.path), selector.separator, selector.cache]]
    }
}
