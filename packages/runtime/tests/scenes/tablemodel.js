// The TableModel of Qt.labs.qmlmodels, which the compiler does not know yet:
// what it would emit for this, written by hand. What `read()` answers is
// asked of Qt too, for the same QML, and what Qt says is what the test
// expects.
//
// Item {
//     id: root; width: 320; height: 200
//     property var heard: []
//     property var told: [0, 0]
//     Component.onCompleted: told = [0, 0]
//     TableModel {
//         id: tm
//         TableModelColumn { display: "name"; edit: "name" }
//         TableModelColumn { display: "cost"; toolTip: (at) => "costs " + tm.rows[at.row].cost }
//         rows: [{ name: "a", cost: 1 }, { name: "b", cost: 2 }, { name: "c", cost: 3 }]
//         onRowsChanged: root.told[0]++
//         onRowCountChanged: root.told[1]++
//         onModelReset: root.heard.push("reset")
//         onRowsInserted: (parent, first, last) => root.heard.push("inserted " + first + " " + last)
//         onRowsRemoved: (parent, first, last) => root.heard.push("removed " + first + " " + last)
//         onRowsMoved: (parent, first, last, to, before) => root.heard.push("moved " + first + " " + last + " " + before)
//         onDataChanged: (from, to, roles) =>
//             root.heard.push("data " + from.row + "," + from.column + " " + to.row + "," + to.column + " " + roles)
//     }
//     TableModel {
//         id: late
//         TableModelColumn { display: "n" }
//         onRowsInserted: (parent, first, last) => root.heard.push("late inserted " + first + " " + last)
//     }
//     TableView {
//         id: tv; width: 320; height: 120; model: tm
//         delegate: Rectangle {
//             implicitWidth: 60; implicitHeight: 20
//             required property var display
//             required property int row
//             required property int column
//             required property var model
//         }
//     }
//     TableView {
//         id: lv; y: 130; width: 320; height: 60; model: late
//         delegate: Rectangle { implicitWidth: 40; implicitHeight: 10; required property var display }
//     }
// }
import { $component, $object } from "qml-solid/object";
import { TableModel, TableModelColumn } from "qml-solid/Qt/labs/qmlmodels";
import { Item, Rectangle, TableView } from "qml-solid/QtQuick";
import { make } from "../scene.js";

const Cell = { properties: { display: undefined, row: 0, column: 0, model: undefined } };
const Late = { properties: { display: undefined } };
const Root = { properties: { heard: undefined, told: undefined } };

function items(view, tell) {
  const all = [];
  for (let r = view.topRow; r >= 0 && r <= view.bottomRow; r++) {
    for (let c = view.leftColumn; c >= 0 && c <= view.rightColumn; c++) {
      const item = view.itemAtCell({ x: c, y: r });
      if (item) all.push(tell(item, c, r));
    }
  }
  return all;
}

export default function TableModels() {
  const root = $object();
  const tm = $object();
  const late = $object();
  const tv = $object();
  const lv = $object();

  function read() {
    const said = root.heard;
    const counts = root.told;
    root.heard = [];
    root.told = [0, 0];
    return {
      size: [tm.rowCount, tm.columnCount, tv.rows, tv.columns],
      rows: tm.rows.map((row) => row.name + row.cost).join(" "),
      // What a delegate shows, and what its model says: a role of the
      // column it is in.
      cells: items(tv, (item, c, r) => [r, c, item.display, c === 0 ? item.model.edit : item.model.toolTip, item.y]),
      heard: said,
      told: counts,
      late: [late.rowCount, late.columnCount, lv.rows, lv.columns, late.rows.map((row) => row.n).join(" ")],
      lateCells: items(lv, (item) => item.display),
      asked:
        tm.rowCount < 2
          ? []
          : [
              tm.data(tm.index(0, 0), "display"),
              tm.data(tm.index(1, 1), "display"),
              tm.data(tm.index(1, 1), "toolTip"),
              tm.data(tm.index(0, 0), "nothing") ?? null,
              tm.data(tm.index(1, 1), 3),
              tm.data(tm.index(1, 0)),
              tm.getRow(1).name,
            ],
      indexes: [
        tm.index(0, 0).valid,
        tm.index(0, 2).valid,
        tm.index(9, 0).valid,
        tm.index(0, 1).row,
        tm.index(0, 1).column,
        tm.flags(tm.index(0, 0)),
        tm.headerData(1, 1),
      ],
    };
  }

  // What the model refuses: it says why in a warning, and is as it was.
  function refuse() {
    const row = { name: "x", cost: 1 };
    tm.data(tm.index(0, 0), "toolTip");
    tm.data(tm.index(9, 0), "display");
    const set = [
      tm.setData(tm.index(0, 0), "x", "toolTip"),
      tm.setData(tm.index(0, 1), "x", "toolTip"),
      tm.setData(tm.index(0, 1), "abc", "display"),
      tm.setData(tm.index(0, 0), { a: 1 }, "edit"),
      tm.setData(tm.index(0, 0), "x", "nothing"),
    ];
    tm.appendRow(3);
    tm.appendRow("abc");
    tm.appendRow([1, 2]);
    tm.appendRow({ name: "x" });
    tm.appendRow({ name: "x", price: 3 });
    tm.appendRow({ name: "x", cost: { a: 1 } });
    tm.appendRow({ name: [1], cost: 1 });
    tm.appendRow({ name: "x", cost: "abc" });
    tm.insertRow(-1, row);
    tm.insertRow(99, row);
    tm.getRow(99);
    tm.moveRow(1, 1);
    tm.moveRow(0, 1, 0);
    tm.moveRow(99, 1);
    tm.moveRow(0, 99);
    tm.moveRow(1, 0, 99);
    tm.moveRow(0, 2, 2);
    tm.removeRow(99);
    tm.removeRow(0, 0);
    tm.removeRow(1, 99);
    tm.setRow(99, row);
    tm.setRow(0, { name: "x" });
    tm.rows = [{ name: "x" }];
    tm.rows = [{ name: "x", cost: [1] }];
    return [set, tm.rows.map((row) => row.name + row.cost).join(" ")];
  }

  function step(i) {
    switch (i) {
      case 0:
        tm.appendRow({ name: "d", cost: 4 });
        break;
      case 1:
        tm.insertRow(1, { name: "e", cost: 5 });
        break;
      case 2:
        tm.removeRow(0);
        break;
      case 3:
        tm.moveRow(0, 2);
        break;
      case 4:
        tm.moveRow(2, 0, 2);
        break;
      case 5:
        tm.setRow(1, { name: "f", cost: 6 });
        break;
      case 6:
        tm.setRow(tm.rowCount, { name: "g", cost: 7 });
        break;
      case 7:
        tm.setData(tm.index(0, 0), "h", "edit");
        break;
      case 8:
        tm.setData(tm.index(0, 1), 8, "display");
        break;
      case 9:
        // A delegate writes to the model through a role.
        tv.itemAtCell({ x: 0, y: 1 }).model.edit = "i";
        break;
      case 10:
        tm.removeRow(1, 2);
        break;
      case 11:
        tm.rows = [
          { name: "x", cost: 10 },
          { name: "y", cost: 11 },
        ];
        break;
      case 12:
        tm.clear();
        break;
      case 13:
        tm.appendRow({ name: "z", cost: 12 });
        break;
      case 14:
        late.appendRow({ n: 1 });
        break;
      case 15:
        late.rows = [{ n: 2 }, { n: 3 }];
        break;
      case 16:
        // The same rows again are no change.
        late.rows = [{ n: 2 }, { n: 3 }];
        break;
      case 17:
        tm.setRow(0, { name: "w", cost: 13 });
        break;
    }
  }

  return make(
    Item,
    {
      $self: root,
      width: 320,
      height: 200,
      // What the models said of themselves, and how often that `rows` and
      // `rowCount` changed, since they were last read.
      heard: [],
      told: [0, 0],
      $declare: Root,
      $functions: { read, refuse, step },
      // Qt tells of `rows` and `rowCount` as a model is completed too.
      Component$onCompleted: () => (root.told = [0, 0]),
    },
    () => [
      make(
        TableModel,
        {
          $self: tm,
          rows: [
            { name: "a", cost: 1 },
            { name: "b", cost: 2 },
            { name: "c", cost: 3 },
          ],
          onRowsChanged: () => root.told[0]++,
          onRowCountChanged: () => root.told[1]++,
          onModelReset: () => root.heard.push("reset"),
          onRowsInserted: (parent, first, last) => root.heard.push("inserted " + first + " " + last),
          onRowsRemoved: (parent, first, last) => root.heard.push("removed " + first + " " + last),
          onRowsMoved: (parent, first, last, to, before) => root.heard.push("moved " + first + " " + last + " " + before),
          onDataChanged: (from, to, roles) =>
            root.heard.push("data " + from.row + "," + from.column + " " + to.row + "," + to.column + " " + roles),
        },
        () => [
          make(TableModelColumn, { display: "name", edit: "name" }),
          make(TableModelColumn, { display: "cost", toolTip: (at) => "costs " + tm.rows[at.row].cost }),
        ],
      ),
      // One that has no rows yet: it learns its roles from the first.
      make(
        TableModel,
        {
          $self: late,
          onRowsInserted: (parent, first, last) => root.heard.push("late inserted " + first + " " + last),
        },
        () => [make(TableModelColumn, { display: "n" })],
      ),
      make(TableView, {
        $self: tv,
        width: 320,
        height: 120,
        model: tm,
        get delegate() {
          return $component(($data) =>
            make(Rectangle, {
              implicitWidth: 60,
              implicitHeight: 20,
              get display() {
                return $data.display;
              },
              get row() {
                return $data.row;
              },
              get column() {
                return $data.column;
              },
              get model() {
                return $data.model;
              },
              $declare: Cell,
            }),
          );
        },
      }),
      make(TableView, {
        $self: lv,
        y: 130,
        width: 320,
        height: 60,
        model: late,
        get delegate() {
          return $component(($data) =>
            make(Rectangle, {
              implicitWidth: 40,
              implicitHeight: 10,
              get display() {
                return $data.display;
              },
              $declare: Late,
            }),
          );
        },
      }),
    ],
  );
}
