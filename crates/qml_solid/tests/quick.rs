//! QtQuick: a file whose imports are Qt's becomes a module of the runtime's
//! components, its names settled when it is compiled.

use qml_solid::{Options, Project, compile, lowered_source};

/// The lowering of `name`, compiled with all of `files`.
fn lowered_in(files: &[(&str, &str)], name: &str) -> Result<String, Vec<String>> {
    let mut project = Project::new();
    for (file, source) in files {
        project.add(file, source).unwrap_or_else(|errors| panic!("{file}: {errors:?}"));
    }
    let options = Options { name: name.to_string(), project: Some(project), ..Options::default() };
    let source = files.iter().find(|(file, _)| *file == name).expect("a file of the project").1;
    // What does not lower would not compile either; what lowers, Solid takes.
    lowered_source(source, &options)
        .and_then(|lowered| compile(source, &options).map(|_| lowered))
        .map_err(|errors| errors.into_iter().map(|error| error.message).collect())
}

fn lowered(source: &str) -> String {
    lowered_in(&[("Sample", source)], "Sample").unwrap_or_else(|errors| panic!("{errors:?}"))
}

fn errors(source: &str) -> Vec<String> {
    lowered_in(&[("Sample", source)], "Sample").unwrap_err()
}

#[track_caller]
fn assert_contains(haystack: &str, needle: &str) {
    assert!(haystack.contains(needle), "expected to find\n  {needle}\nin\n{haystack}");
}

#[track_caller]
fn assert_lacks(haystack: &str, needle: &str) {
    assert!(!haystack.contains(needle), "expected not to find\n  {needle}\nin\n{haystack}");
}

#[test]
fn an_object_is_a_component_of_the_runtime() {
    let code = lowered(
        r#"import QtQuick
Rectangle {
    id: root
    width: 200; color: "red"
    border { width: 2; color: "black" }
    Text { text: root.width; font.bold: true; anchors.fill: parent }
}"#,
    );
    assert_contains(&code, r#"import { $object } from "qml-solid/object";"#);
    assert_contains(&code, r#"import { Rectangle, Text } from "qml-solid/QtQuick";"#);
    assert_contains(&code, "export default function Sample($props) {");
    // An instance that has an id made the object already.
    assert_contains(&code, "const root = $props.$self ?? $object();");
    assert_contains(
        &code,
        r#"<Rectangle $self={root} $given={$props} width={200} color={"red"} border$width={2} border$color={"black"}>"#,
    );
    // `parent` is the Text's: an object nothing else names gets a name of ours.
    assert_contains(&code, "const $1 = $object();");
    assert_contains(&code, "<Text $self={$1} text={root.width} font$bold={true} anchors$fill={$1.parent}>");
    // An instance's children go where the root's own do.
    assert_contains(&code, "</Text>{$props.children}</Rectangle>");
}

#[test]
fn only_an_object_something_names_has_a_binding() {
    let code = lowered("import QtQuick\nItem { Rectangle { width: 10 } Rectangle { width: height } }");
    assert_contains(&code, "<Rectangle width={10}></Rectangle>");
    assert_contains(&code, "<Rectangle $self={$3} width={$3.height}>");
    assert_lacks(&code, "const $2");
}

#[test]
fn what_an_object_declares_is_its_type() {
    let code = lowered(
        r#"import QtQuick
Item {
    id: clock
    property int hours
    property string city: "Oslo"
    property var anything
    property Item face
    property list<Item> hands
    property bool night: hours > 19
    signal ticked(int count)
    function tick() { hours = hours + 1; ticked(hours) }
    onTicked: (count) => console.log(count, city)
    onHoursChanged: tick()
}"#,
    );
    assert_contains(&code, "const Sample$ = {");
    for property in ["hours: 0", r#"city: """#, "anything: void 0", "face: null", "hands: []", "night: false"] {
        assert_contains(&code, property);
    }
    assert_contains(&code, r#"signals: ["ticked"]"#);
    assert_contains(&code, "$declare={Sample$}");
    assert_contains(&code, r#"city={"Oslo"} night={clock.hours > 19}"#);
    // A function's names are the object's, and so is what it assigns to.
    assert_contains(&code, "clock.hours = clock.hours + 1;");
    assert_contains(&code, "clock.ticked(clock.hours);");
    assert_contains(&code, "onTicked={(count) => console.log(count, clock.city)}");
    assert_contains(&code, "onHoursChanged={() => clock.tick()}");
}

#[test]
fn a_handler_takes_what_its_signal_gives() {
    let code = lowered(
        r#"import QtQuick
MouseArea {
    onClicked: console.log(mouse.x)
    onPressed: { pressAndHoldInterval = mouse.y }
    onWheel: (wheel) => wheel.accepted = true
    onReleased: function(event) { console.log(event) }
    Keys.onPressed: (event) => event.accepted = true
    Keys.onReturnPressed: console.log(event.key)
    Component.onCompleted: console.log("made")
}"#,
    );
    assert_contains(&code, "onClicked={(mouse) => console.log(mouse.x)}");
    // `pressed` is a property too; the handler is the signal's.
    assert_contains(&code, "onPressed={(mouse) => {");
    assert_contains(&code, "$1.pressAndHoldInterval = mouse.y;");
    assert_contains(&code, "onWheel={(wheel) => wheel.accepted = true}");
    assert_contains(&code, "onReleased={function(event) {");
    assert_contains(&code, "Keys$onPressed={(event) => event.accepted = true}");
    assert_contains(&code, "Keys$onReturnPressed={(event) => console.log(event.key)}");
    assert_contains(&code, r#"Component$onCompleted={() => console.log("made")}"#);
    assert_contains(&code, "$attach={[Keys]}");
    assert_contains(&code, r#"import { Keys, MouseArea } from "qml-solid/QtQuick";"#);
}

#[test]
fn a_type_is_read_for_its_enums_and_for_what_it_attaches() {
    let code = lowered(
        r#"import QtQuick
import QtQuick.Layouts
Item {
    id: cell
    Layout.fillWidth: true
    width: ListView.view ? ListView.view.width : 0
    Text { style: Text.Raised; horizontalAlignment: Text.AlignHCenter; elide: Qt.ElideRight }
    ListView { orientation: ListView.Horizontal; snapMode: ListView.SnapMode.SnapOneItem }
}"#,
    );
    assert_contains(&code, "Layout$fillWidth={true}");
    assert_contains(&code, "$attach={[Layout]}");
    assert_contains(&code, r#"import { Layout } from "qml-solid/QtQuick/Layouts";"#);
    assert_contains(&code, "width={ListView.attached(cell).view ? ListView.attached(cell).view.width : 0}");
    assert_contains(&code, "style={Text.Raised} horizontalAlignment={Text.AlignHCenter} elide={Qt.ElideRight}");
    assert_contains(&code, "orientation={ListView.Horizontal} snapMode={ListView.SnapOneItem}");
    assert_contains(&code, r#"import { Qt } from "qml-solid/QtQml";"#);
}

#[test]
fn a_delegate_is_a_function_of_what_it_is_given() {
    let code = lowered(
        r#"import QtQuick
Item {
    id: root
    property int spacing: 4
    Component { id: dot; Rectangle { width: 4; radius: spacing } }
    Repeater {
        model: 3
        Rectangle {
            required property int index
            x: index * root.spacing; y: modelData + spacing; z: model.index
            Repeater { model: 2; delegate: Text { text: index + name } }
        }
    }
    ListView { delegate: dot; highlight: Rectangle { color: "blue" } }
    Loader { sourceComponent: dot }
}"#,
    );
    // A `Component` with an id is a binding of the component it is in.
    assert_contains(&code, "const dot = $component(($data) => {");
    assert_contains(&code, r#"radius={"spacing" in $data ? $data.spacing : root.spacing}"#);
    // What is written in a Repeater is its delegate.
    assert_contains(&code, "<Repeater model={3} delegate={$component(($data) => {");
    // A required property is what the delegate is given; another name is the
    // object's if it has it, a role of the model's if not.
    assert_contains(&code, "index={$data.index}");
    assert_contains(&code, "x={$3.index * root.spacing}");
    assert_contains(&code, r#"y={$data.modelData + ("spacing" in $data ? $data.spacing : root.spacing)}"#);
    assert_contains(&code, "z={$data.model.index}");
    // A delegate in a delegate is given its own, and sees the other's.
    assert_contains(&code, "delegate={$component(($data1) => {");
    assert_contains(&code, r#"text={$data1.index + ("name" in $data1 ? $data1.name : $data.name)}"#);
    assert_contains(&code, "<ListView delegate={dot} highlight={$component(($data) => {");
    assert_contains(&code, "<Loader sourceComponent={dot}>");
}

#[test]
fn an_alias_is_a_path_to_the_object_that_has_the_property() {
    let code = lowered(
        r#"import QtQuick
Rectangle {
    property alias text: label.text
    property alias bold: label.font.bold
    property alias label: label
    default property alias content: body.data
    Text { id: label }
    Item { id: body }
}"#,
    );
    assert_contains(&code, r#"text: [label, "text"]"#);
    assert_contains(&code, r#"bold: [
			label,
			"font",
			"bold"
		]"#);
    assert_contains(&code, "label: [label]");
    // What an instance has inside it goes in the object the default alias names.
    assert_contains(&code, "<Item $self={body}>{$props.children}</Item></Rectangle>");
    assert_eq!(
        errors("import QtQuick\nItem { property alias text: nobody.text }"),
        ["`text` is an alias of nothing: an alias names an id, or a property of one"]
    );
}

#[test]
fn objects_go_where_values_do() {
    let code = lowered(
        r#"import QtQuick
Item {
    id: item
    transform: Rotation { angle: 45; origin.x: 10 }
    states: [
        State { name: "a"; PropertyChanges { target: item; x: 10; anchors.margins: width } },
        State { name: "b"; PropertyChanges { item.opacity: 0.5 } }
    ]
    transitions: Transition { NumberAnimation { properties: "x" } }
    Behavior on x { NumberAnimation { duration: 100 } }
    NumberAnimation on anchors.margins { to: 4 }
    Connections { target: item; function onXChanged() { console.log(x) } }
    ListModel { ListElement { name: "a"; cost: 2 } }
}"#,
    );
    // A list property is a list, however many objects are written.
    assert_contains(&code, "transform={[<Rotation angle={45} origin$x={10}></Rotation>]}");
    assert_contains(
        &code,
        r#"<PropertyChanges target={item} $changes={[["x", () => 10], ["anchors.margins", () => item.width]]}>"#,
    );
    assert_contains(&code, r#""opacity","#);
    assert_contains(&code, "() => item");
    assert_contains(&code, "transitions={[<Transition>");
    assert_contains(&code, r#"<Behavior $target={item} $property="x">"#);
    assert_contains(&code, r#"<NumberAnimation $target={item} $property="anchors$margins" to={4}>"#);
    assert_contains(&code, "<Connections target={item} onXChanged={function onXChanged() {");
    assert_contains(&code, r#"<ListModel><ListElement name={"a"} cost={2}></ListElement></ListModel>"#);
}

#[test]
fn a_path_is_taken_from_the_file() {
    let code = lowered(
        r#"import QtQuick
Item {
    property url icon: "icons/a.png"
    Image { source: "images/clock.png" }
    Image { source: "images/clock.png" }
    Image { source: "https://example.org/a.png" }
    Image { source: icon }
    Loader { source: "Other.qml" }
}"#,
    );
    assert_contains(&code, r#"const $url1 = new URL("icons/a.png", import.meta.url).href;"#);
    assert_contains(&code, r#"const $url2 = new URL("images/clock.png", import.meta.url).href;"#);
    assert_lacks(&code, "$url3");
    assert_contains(&code, "icon={$url1}");
    assert_contains(&code, "<Image source={$url2}></Image><Image source={$url2}></Image>");
    assert_contains(&code, r#"<Image source={"https://example.org/a.png"}>"#);
    assert_contains(&code, "<Image source={$url($1.icon, import.meta.url)}>");
    // A QML file is a module, loaded when it is asked for.
    assert_contains(&code, r#"<Loader source={() => import("./Other.qml")}>"#);
}

const CLOCK: &str = r#"import QtQuick
Item {
    id: clock
    property string city
    required property real shift
    signal struck(int hour)
    Text { text: clock.city }
}"#;

#[test]
fn a_file_is_a_component_of_the_files_that_name_it() {
    let app = r#"import QtQuick
import "parts"
Item {
    component Dot: Rectangle { property int size: 4; width: size }
    Clock { id: one; city: "Oslo"; shift: 1; onStruck: console.log(hour, city) }
    Dot { size: 8 }
    Hand { length: one.shift }
    ListView { delegate: Clock { required city } }
}"#;
    let hand = "import QtQuick\nRectangle { property real length }";
    let files = [("App", app), ("Clock", CLOCK), ("parts/Hand", hand)];
    let code = lowered_in(&files, "App").unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_contains(&code, r#"import Clock from "./Clock.qml";"#);
    assert_contains(&code, r#"import Hand from "./parts/Hand.qml";"#);
    // An inline component is a function of the module.
    assert_contains(&code, "function Dot($props) {");
    assert_contains(&code, "<Dot size={8}></Dot>");
    // The signal's arguments and the properties are the component's.
    assert_contains(&code, r#"<Clock $self={one} city={"Oslo"} shift={1} onStruck={(hour) => console.log(hour, one.city)}>"#);
    assert_contains(&code, "<Hand length={one.shift}></Hand>");
    // What a component requires is what its delegate is given.
    assert_contains(&code, "<Clock city={$data.city} shift={$data.shift}></Clock>");

    // A file in a directory names the files around it by their path from it.
    let hand = "import QtQuick\nimport \"..\"\nClock { }";
    let files = [("App", app), ("Clock", CLOCK), ("parts/Hand", hand)];
    let code = lowered_in(&files, "parts/Hand").unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_contains(&code, r#"import Clock from "../Clock.qml";"#);
    assert_contains(&code, "export default function Hand($props) {");
}

#[test]
fn a_module_may_be_imported_as_a_name() {
    let code = lowered(
        "import QtQuick\nimport QtQuick.Controls as C\nimport \"lib.js\" as Lib\nItem { C.Button { text: Lib.title(C.Button.Ok) } }",
    );
    assert_contains(&code, r#"import * as C from "qml-solid/QtQuick/Controls";"#);
    assert_contains(&code, r#"import * as Lib from "./lib.js";"#);
    assert_contains(&code, "<C.Button text={Lib.title(C.Button.Ok)}></C.Button>");
}

#[test]
fn a_name_nothing_has_is_an_error() {
    assert_eq!(errors("import QtQuick\nItem { width: nope }"), ["`nope` is not defined"]);
    assert_eq!(errors("import QtQuick\nItem { width: Nope.size }"), ["`Nope` is not defined"]);
    assert_eq!(
        errors("import QtQuick\nItem { Nope { } }"),
        ["`Nope` is not a type of anything the file imports"]
    );
    // An inline component sees nothing of the file around it.
    assert_eq!(
        errors("import QtQuick\nItem { id: root\n component Dot: Rectangle { width: root.width } }"),
        ["`root` is not defined"]
    );
}

#[test]
fn solid_makes_the_objects() {
    let options = Options { name: "Sample".to_string(), ..Options::default() };
    let code = compile("import QtQuick\nItem { id: root\n Rectangle { width: root.width; height: 4 } }", &options)
        .unwrap_or_else(|errors| panic!("{errors:?}"))
        .code;
    assert_contains(&code, r#"import { createComponent as _$createComponent } from "solid-js";"#);
    // A binding is a getter, a value a value: the object decides when to read.
    assert_contains(&code, "get width() {\n\t\t\t\t\treturn root.width;\n\t\t\t\t},\n\t\t\t\theight: 4");
    assert_lacks(&code, "_$memo");
}

#[test]
fn an_enum_is_keys_on_the_component() {
    let files = [
        (
            "Sample",
            r#"import QtQuick
Item {
    property int theme: Swatch.Theme.Dark
    property int mine: Sample.Narrow
    enum Width { Wide, Narrow = 4 }
    component Chip: Item { enum Shape { Round, Square } }
    Swatch { tone: Swatch.Light }
}"#,
        ),
        ("Swatch", "import QtQuick\nItem {\n    property int tone\n    enum Theme { Light, Dark }\n}"),
    ];
    let code = lowered_in(&files, "Sample").unwrap_or_else(|errors| panic!("{errors:?}"));
    // `Type.Enum.Key` and `Type.Key` are the same key, as they are in Qt's types.
    assert_contains(&code, "theme={Swatch.Dark}");
    assert_contains(&code, "tone={Swatch.Light}");
    // The file is a type to itself too, and is not imported for it.
    assert_contains(&code, "mine={Sample.Narrow}");
    assert_lacks(&code, "import Sample");
    assert_contains(&code, "Object.assign(Sample, {\n\tWide: 0,\n\tNarrow: 4\n});");
    assert_contains(&code, "Object.assign(Chip, {\n\tRound: 0,\n\tSquare: 1\n});");

    let code = lowered_in(&files, "Swatch").unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_contains(&code, "export default function Swatch($props) {");
    assert_contains(&code, "Object.assign(Swatch, {\n\tLight: 0,\n\tDark: 1\n});");
}

#[test]
fn a_singleton_is_one_object_reached_through_its_name() {
    let files = [
        (
            "Sample",
            r#"import QtQuick
Item {
    width: Units.grid * 2
    height: Units.Small
    property var units: Units
    function reset() { Units.grid = 8 }
}"#,
        ),
        (
            "Units",
            r#"pragma Singleton
import QtQuick
QtObject {
    property int grid: 8
    property int twice: Units.grid * 2
    enum Size { Small, Large }
}"#,
        ),
    ];
    let code = lowered_in(&files, "Sample").unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_contains(&code, r#"import Units from "./Units.qml";"#);
    // The object is made when something first asks for it.
    assert_contains(&code, "width={Units().grid * 2}");
    assert_contains(&code, "units={Units()}");
    assert_contains(&code, "Units().grid = 8;");
    // Its enums are the type's: nothing is made to read one.
    assert_contains(&code, "height={Units.Small}");

    let code = lowered_in(&files, "Units").unwrap_or_else(|errors| panic!("{errors:?}"));
    assert_contains(&code, r#"import { $object, $singleton } from "qml-solid/object";"#);
    assert_contains(&code, "function Units$component($props) {");
    assert_lacks(&code, "export default function");
    assert_contains(&code, "twice={Units().grid * 2}");
    assert_contains(&code, "const Units = $singleton(Units$component, {\n\tSmall: 0,\n\tLarge: 1\n});");
    assert_contains(&code, "export default Units;");
}

#[test]
fn a_module_of_the_project_is_the_files_it_is_said_to_be() {
    let files = [
        ("Main", "import QtQuick\nimport Parts\nItem {\n    Dial { value: Theme.accent }\n    Gauge { }\n}"),
        ("parts/Dial", "import QtQuick\nItem {\n    property int value\n    Needle { }\n}"),
        ("parts/gauges/Needle", "import QtQuick\nItem { }"),
        ("parts/Theme", "pragma Singleton\nimport QtQuick\nQtObject { property int accent: 3 }"),
        // Qt Design Studio's files are types by the name before `.ui`.
        ("parts/Gauge.ui", "import QtQuick\nItem { }"),
    ];
    let mut project = Project::new();
    for (file, source) in &files {
        project.add(file, source).unwrap_or_else(|errors| panic!("{file}: {errors:?}"));
    }
    for (name, file) in
        [("Dial", "parts/Dial"), ("Needle", "parts/gauges/Needle"), ("Theme", "parts/Theme"), ("Gauge", "parts/Gauge.ui")]
    {
        project.add_type("Parts", name, file);
    }
    let lowered = |name: &str| {
        let options = Options { name: name.to_string(), project: Some(project.clone()), ..Options::default() };
        let source = files.iter().find(|(file, _)| *file == name).expect("a file of the project").1;
        lowered_source(source, &options).unwrap_or_else(|errors| panic!("{name}: {errors:?}"))
    };

    let code = lowered("Main");
    assert_contains(&code, r#"import Dial from "./parts/Dial.qml";"#);
    assert_contains(&code, r#"import Theme from "./parts/Theme.qml";"#);
    assert_contains(&code, r#"import Gauge from "./parts/Gauge.ui.qml";"#);
    assert_contains(&code, "value={Theme().accent}");

    // A file of the module sees the rest of it, wherever the files are.
    let code = lowered("parts/Dial");
    assert_contains(&code, r#"import Needle from "./gauges/Needle.qml";"#);

    let code = lowered("parts/Gauge.ui");
    assert_contains(&code, "export default function Gauge($props) {");
}

#[test]
fn a_type_of_a_namespace_attaches_too() {
    let code = lowered(
        r#"import QtQuick
import QtQuick.Templates as T
T.Control {
    T.ScrollIndicator.vertical: T.ScrollIndicator { }
}"#,
    );
    assert_contains(&code, r#"import * as T from "qml-solid/QtQuick/Templates";"#);
    // The attached object goes by the type's own name.
    assert_contains(&code, "ScrollIndicator$vertical={<T.ScrollIndicator");
    assert_contains(&code, "$attach={[T.ScrollIndicator]}");
}
