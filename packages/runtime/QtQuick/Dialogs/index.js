// What `import QtQuick.Dialogs` brings into scope: the dialogs a browser
// has of its own. There is no font picker among them.
//
// `pickedFile`, `pickedFolder` and `filesIn` are not QML's: they are how
// the rest of the runtime finds what a URL from these dialogs stands for.
export { ColorDialog } from "./ColorDialog.js";
export { FileDialog, FolderDialog } from "./FileDialog.js";
export { filesIn, pickedFile, pickedFolder } from "./files.js";
export { MessageDialog } from "./MessageDialog.js";
