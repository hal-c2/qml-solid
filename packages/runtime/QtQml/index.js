// `import QtQml`, and what QML puts in every file's scope without an import.
export { QtObject } from "../object.js";
export { Component } from "./Component.js";
export { Locale } from "./locale.js";
export {
  gc,
  print,
  qsTr,
  qsTrId,
  qsTrIdNoOp,
  qsTrNoOp,
  qsTranslate,
  qsTranslateNoOp,
  Qt,
  QT_TR_NOOP,
  QT_TRANSLATE_NOOP,
  QT_TRID_NOOP,
} from "./Qt.js";
