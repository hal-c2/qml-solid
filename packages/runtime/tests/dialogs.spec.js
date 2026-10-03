import { fileURLToPath } from "node:url";
import { expect, open, test } from "./open.js";

const asset = (name) => fileURLToPath(new URL(`./assets/${name}`, import.meta.url));

const log = (page) => page.evaluate(() => window.objects.log.splice(0));
const call = (page, name, method, ...args) =>
  page.evaluate(([name, method, args]) => void window.objects[name][method](...args), [name, method, args]);
// What a dialog said by the time a call returned.
const told = (page, name, method, ...args) =>
  page.evaluate(
    ([name, method, args]) => {
      window.objects[name][method](...args);
      return window.objects.log.splice(0);
    },
    [name, method, args],
  );
const closed = (page, name) => page.waitForFunction((name) => !window.objects[name].visible, name);

// The pickers a test can answer are those of an `<input>`: the browser is
// one that has no others.
const inputs = (page) =>
  page.addInitScript(() => {
    window.showOpenFilePicker = undefined;
    window.showDirectoryPicker = undefined;
  });

// A scene that opens a dialog as it is made, there before the test has
// asked the page anything: asking counts as the user doing something.
async function early(page, which) {
  const made = page.waitForEvent("console", (message) => message.text() === "dialogs made");
  await page.goto(`/?scene=dialogs-early&early=${which}`);
  await made;
}

// Opens a dialog, as a press would, and has the picker that came up.
async function asked(page, name) {
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), call(page, name, "open")]);
  return chooser;
}

test("a dialog is closed until it is opened, and has Qt's defaults", async ({ page }) => {
  await open(page, "dialogs");
  const read = await page.evaluate(() => {
    const { plain, folder, white, note, message, inside, FileDialog, MessageDialog } = window.objects;
    return {
      dialog: [plain.visible, plain.result, plain.modality, plain.title],
      file: [plain.fileMode, plain.selectedFile, [...plain.selectedFiles], plain.currentFolder, [...plain.nameFilters]],
      folder: [folder.selectedFolder, folder.currentFolder],
      color: String(white.selectedColor),
      message: [note.buttons, note.text, note.informativeText, note.detailedText, message.buttons],
      inside: inside.$type.typeName,
      enums: [
        FileDialog.Rejected,
        FileDialog.Accepted,
        FileDialog.OpenFile,
        FileDialog.OpenFiles,
        FileDialog.SaveFile,
        MessageDialog.NoButton,
        MessageDialog.Ok,
        MessageDialog.Cancel,
        MessageDialog.RestoreDefaults,
        MessageDialog.InvalidRole,
        MessageDialog.AcceptRole,
        MessageDialog.ApplyRole,
      ],
      // Nothing is on the page for a dialog that is closed.
      nodes: document.querySelectorAll("dialog, input").length,
    };
  });
  expect(read).toEqual({
    dialog: [false, 0, 1, ""],
    file: [0, "", [], "", ["All Files (*)"]],
    folder: ["", ""],
    color: "#ffffff",
    message: [0x400, "Done.", "", "", 0x400000 | 0x800 | 0x800000],
    inside: "QtObject",
    enums: [0, 1, 0, 1, 2, 0, 0x400, 0x400000, 0x8000000, -1, 0, 8],
    nodes: 0,
  });
});

test("a dialog ends as Qt's does, however it is closed", async ({ page }) => {
  await open(page, "dialogs");
  const state = () => page.evaluate(() => [window.objects.colors.visible, window.objects.colors.result]);
  expect(await told(page, "colors", "open")).toEqual(["colors visible true"]);
  expect(await state()).toEqual([true, 0]);
  expect(await told(page, "colors", "accept")).toEqual(["colors result 1", "colors visible false", "colors accepted"]);
  // Opening forgets how it ended the last time.
  expect(await told(page, "colors", "open")).toEqual(["colors visible true"]);
  expect(await state()).toEqual([true, 0]);
  expect(await told(page, "colors", "reject")).toEqual(["colors visible false", "colors rejected"]);
  await call(page, "colors", "open");
  await log(page);
  // A result that is neither is no ending anybody is told of.
  expect(await told(page, "colors", "done", 5)).toEqual(["colors result 5", "colors visible false"]);
  await call(page, "colors", "open");
  await log(page);
  expect(await told(page, "colors", "close")).toEqual(["colors visible false", "colors rejected"]);
  // One that is closed keeps the result, and says nothing more.
  expect(await told(page, "colors", "accept")).toEqual(["colors result 1"]);
  expect(await told(page, "colors", "close")).toEqual([]);
  expect(await state()).toEqual([false, 1]);
  // `visible` opens and closes it too.
  expect(await page.evaluate(() => ((window.objects.colors.visible = true), window.objects.log.splice(0)))).toEqual([
    "colors visible true",
  ]);
  expect(await state()).toEqual([true, 0]);
  expect(await page.evaluate(() => ((window.objects.colors.visible = false), window.objects.log.splice(0)))).toEqual([
    "colors visible false",
    "colors rejected",
  ]);
});

test("a file dialog is the browser's picker, and a file picked is a URL", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  const chooser = await asked(page, "files");
  expect(chooser.isMultiple()).toBe(false);
  // The selected filter is the one the picker starts with.
  expect(await chooser.element().getAttribute("accept")).toBe(".webm,.mp4");
  expect(await log(page)).toEqual(["files visible true"]);
  await chooser.setFiles(asset("clip.webm"));
  await closed(page, "files");
  expect(await log(page)).toEqual([
    "files files 1",
    "files file true",
    "files result 1",
    "files visible false",
    "files accepted",
  ]);
  const read = await page.evaluate(() => {
    const { files, pickedFile } = window.objects;
    return {
      file: files.selectedFile.slice(0, 5),
      same: files.selectedFiles.length === 1 && files.selectedFiles[0] === files.selectedFile,
      name: pickedFile(files.selectedFile).name,
      result: files.result,
    };
  });
  expect(read).toEqual({ file: "blob:", same: true, name: "clip.webm", result: 1 });
  // A player plays it.
  await page.evaluate(() => (window.objects.player.source = window.objects.files.selectedFile));
  await page.waitForFunction(() => window.objects.player.mediaStatus === 2);
  expect(await page.evaluate(() => [window.objects.player.duration, window.objects.player.hasVideo])).toEqual([
    1000,
    true,
  ]);
});

test("an image shows a picked file", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  const chooser = await asked(page, "plain");
  // Every file, for the filter that says so.
  expect(await chooser.element().getAttribute("accept")).toBe("");
  await chooser.setFiles(asset("flag.png"));
  await closed(page, "plain");
  await page.evaluate(() => (window.objects.picture.source = window.objects.plain.selectedFile));
  await page.waitForFunction(() => window.objects.picture.status === 1);
  expect(await page.evaluate(() => [window.objects.picture.width, window.objects.picture.height])).toEqual([40, 20]);
});

test("a file dialog for several files has them all", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  await page.evaluate(() => {
    const { files, FileDialog } = window.objects;
    files.fileMode = FileDialog.OpenFiles;
    files.selectedNameFilter.index = 1;
  });
  const chooser = await asked(page, "files");
  expect(chooser.isMultiple()).toBe(true);
  expect(await chooser.element().getAttribute("accept")).toBe(".wav");
  await chooser.setFiles([asset("beep.wav"), asset("clip.webm")]);
  await closed(page, "files");
  const read = await page.evaluate(() => {
    const { files, pickedFile } = window.objects;
    return {
      names: files.selectedFiles.map((url) => pickedFile(url).name),
      first: files.selectedFile === files.selectedFiles[0],
    };
  });
  expect(read).toEqual({ names: ["beep.wav", "clip.webm"], first: true });
});

test("a picker closed without a file is the dialog rejected", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  await asked(page, "files");
  await log(page);
  // What the browser says when the user closes its picker.
  await page.evaluate(() => document.querySelector("input[type=file]").dispatchEvent(new Event("cancel")));
  expect(await log(page)).toEqual(["files visible false", "files rejected"]);
  expect(await page.evaluate(() => window.objects.files.selectedFile)).toBe("");
  // Closed by the program, the picker stays: what it answers is nobody's.
  const chooser = await asked(page, "files");
  await call(page, "files", "close");
  await log(page);
  await chooser.setFiles(asset("clip.webm"));
  expect(await log(page)).toEqual([]);
  expect(await page.evaluate(() => window.objects.files.selectedFile)).toBe("");
});

test("a dialog to save a file is rejected: a page has nowhere to save to", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  await page.evaluate(() => (window.objects.files.fileMode = window.objects.FileDialog.SaveFile));
  await log(page);
  expect(await told(page, "files", "open")).toEqual(["files visible true", "files visible false", "files rejected"]);
});

test("name filters are taken apart as Qt takes them", async ({ page }) => {
  await open(page, "dialogs");
  const read = (filters, index) =>
    page.evaluate(
      ([filters, index]) => {
        const { files } = window.objects;
        files.nameFilters = filters;
        files.selectedNameFilter.index = index;
        const { index: at, name, extensions, globs } = files.selectedNameFilter;
        return [at, name, extensions, globs];
      },
      [filters, index],
    );
  const filters = ["Films (*.webm *.mp4)", "Text files (*.txt)", "All files (*)", "Plain", "Odd (a(b) *.c;*.d  x*.tar.gz)"];
  expect(await read(filters, 0)).toEqual([0, "Films", ["webm", "mp4"], ["*.webm", "*.mp4"]]);
  expect(await read(filters, 1)).toEqual([1, "Text files", ["txt"], ["*.txt"]]);
  expect(await read(filters, 2)).toEqual([2, "All files", ["*"], ["*"]]);
  expect(await read(filters, 3)).toEqual([3, "Plain", [], []]);
  expect(await read(filters, 4)).toEqual([4, "Odd", ["a(b)", "c;*.d", "tar.gz"], ["a(b)", "*.c;*.d", "x*.tar.gz"]]);
  // An index that names no filter is the first.
  expect(await read(filters, 9)).toEqual([0, "Films", ["webm", "mp4"], ["*.webm", "*.mp4"]]);
  // Until one is selected there is none.
  expect(
    await page.evaluate(() => {
      const { index, name, extensions, globs } = window.objects.plain.selectedNameFilter;
      return [index, name, extensions, globs];
    }),
  ).toEqual([-1, "", [], []]);
});

// A browser with the File System Access API, whose pickers a test cannot
// reach: they are stood in for, and answer what the test says.
const pickers = (page) =>
  page.addInitScript(() => {
    window.asked = [];
    const answer = (kind) => (options) => {
      window.asked.push([kind, options]);
      if (!navigator.userActivation.isActive) {
        return Promise.reject(new DOMException("Must be handling a user gesture.", "SecurityError"));
      }
      return new Promise((resolve, reject) => (window.answer = { resolve, reject }));
    };
    window.showOpenFilePicker = answer("file");
    window.showDirectoryPicker = answer("folder");
    const file = (name, text) => ({ kind: "file", name, getFile: async () => new File([text], name) });
    window.file = file;
    window.directory = {
      kind: "directory",
      name: "Pictures",
      async *values() {
        yield file("b.txt", "bb");
        yield { kind: "directory", name: "sub" };
        yield file("a.txt", "a");
      },
    };
  });

test("where the browser has file handles, the dialog asks for those", async ({ page }) => {
  await pickers(page);
  await open(page, "dialogs");
  await call(page, "files", "open");
  const plain = ([kind, options]) => [kind, options.multiple, options.types, options.startIn?.name];
  expect(await page.evaluate(() => window.asked.length)).toBe(1);
  expect(plain(await page.evaluate(() => window.asked[0]))).toEqual([
    "file",
    false,
    [
      { description: "Films", accept: { "application/x-file": [".webm", ".mp4"] } },
      { description: "Sounds", accept: { "application/x-file": [".wav"] } },
    ],
    undefined,
  ]);
  // Asked again while the picker is open, it is the same picker.
  await call(page, "files", "open");
  expect(await page.evaluate(() => window.asked.length)).toBe(1);
  await log(page);
  await page.evaluate(() => window.answer.resolve([window.file("a.webm", "film"), window.file("b.webm", "film")]));
  await closed(page, "files");
  expect(await log(page)).toEqual([
    "files files 2",
    "files file true",
    "files result 1",
    "files visible false",
    "files accepted",
  ]);
  expect(
    await page.evaluate(() => window.objects.files.selectedFiles.map((url) => window.objects.pickedFile(url).name)),
  ).toEqual(["a.webm", "b.webm"]);
  // The user closing the picker is the dialog rejected.
  await call(page, "files", "open");
  await log(page);
  await page.evaluate(() => window.answer.reject(new DOMException("The user aborted a request.", "AbortError")));
  await closed(page, "files");
  expect(await log(page)).toEqual(["files visible false", "files rejected"]);
});

test("a folder dialog gives a URL the folder's files are found by", async ({ page }) => {
  await pickers(page);
  await open(page, "dialogs");
  await call(page, "folder", "open");
  expect(await page.evaluate(() => [window.asked[0][0], window.asked[0][1]])).toEqual(["folder", { mode: "read" }]);
  await page.evaluate(() => window.answer.resolve(window.directory));
  await closed(page, "folder");
  expect(await log(page)).toEqual(["folder folder", "folder accepted"]);
  const read = await page.evaluate(async () => {
    const { folder, filesIn, pickedFolder, pickedFile } = window.objects;
    const found = await filesIn(folder.selectedFolder);
    return {
      url: folder.selectedFolder,
      name: pickedFolder(folder.selectedFolder).name,
      files: found.map(({ name, url }) => [name, url.slice(0, 5), pickedFile(url).size]),
      again: (await filesIn(folder.selectedFolder)) === found,
      other: await filesIn("file:///nowhere"),
    };
  });
  expect(read).toEqual({
    url: "folder:1/Pictures/",
    name: "Pictures",
    files: [
      ["a.txt", "blob:", 1],
      ["b.txt", "blob:", 2],
    ],
    again: true,
    other: [],
  });
  // The folder is where the next picker starts.
  await page.evaluate(() => (window.objects.files.currentFolder = window.objects.folder.selectedFolder));
  await call(page, "files", "open");
  expect(await page.evaluate(() => window.asked[1][1].startIn === window.directory)).toBe(true);
});

test("a folder dialog without file handles reads what the input was given", async ({ page }) => {
  await inputs(page);
  await open(page, "dialogs");
  const chooser = await asked(page, "folder");
  expect(await chooser.element().evaluate((input) => input.webkitdirectory)).toBe(true);
  await chooser.setFiles(asset("folder"));
  await closed(page, "folder");
  expect(await log(page)).toEqual(["folder folder", "folder accepted"]);
  const read = await page.evaluate(async () => {
    const { folder, filesIn, pickedFolder } = window.objects;
    const found = await filesIn(folder.selectedFolder);
    return [folder.selectedFolder, pickedFolder(folder.selectedFolder).name, found.map(({ name }) => name)];
  });
  // Not what is in a folder inside it.
  expect(read).toEqual(["folder:1/folder/", "folder", ["a.txt", "b.txt"]]);
  // Closed without a folder.
  await asked(page, "folder");
  await page.evaluate(() => document.querySelector("input[type=file]").dispatchEvent(new Event("cancel")));
  expect(await log(page)).toEqual(["folder rejected"]);
});

test("a picker the browser refuses comes up at the user's first press", async ({ page }) => {
  await inputs(page);
  let choosers = 0;
  page.on("filechooser", () => choosers++);
  await early(page, "files");
  // Open, as far as QML can tell, and nothing thrown or logged.
  expect(await page.evaluate(() => [window.objects.files.visible, [...window.objects.log]])).toEqual([true, []]);
  expect(choosers).toBe(0);
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.mouse.click(300, 250)]);
  await chooser.setFiles(asset("clip.webm"));
  await closed(page, "files");
  expect(await log(page)).toEqual(["files accepted 1"]);
  // Nothing waits for the next press.
  await page.mouse.click(300, 250);
  expect(choosers).toBe(1);
});

test("a picker refused is not asked for once its dialog is closed", async ({ page }) => {
  await inputs(page);
  let choosers = 0;
  page.on("filechooser", () => choosers++);
  await early(page, "files");
  // Not `close()` from here: a call from a test counts as the user's.
  await page.evaluate(() => (window.objects.files.visible = false));
  expect(await log(page)).toEqual(["files rejected"]);
  await page.mouse.click(300, 250);
  await page.mouse.click(300, 250);
  expect(choosers).toBe(0);
});

// The colour input of a dialog that has been opened.
const swatch = (page) => page.locator("input[type=color]");
const pick = (page, value, ...events) =>
  swatch(page).evaluate(
    (input, [value, events]) => {
      input.value = value;
      for (const type of events) input.dispatchEvent(new Event(type, { bubbles: true }));
      return window.objects.log.splice(0);
    },
    [value, events],
  );

test("a colour dialog is the browser's colour picker", async ({ page }) => {
  await page.addInitScript(() => {
    window.shown = [];
    const show = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function () {
      window.shown.push(`${this.type} ${this.value}`);
      return show.call(this);
    };
  });
  await open(page, "dialogs");
  expect(await told(page, "colors", "open")).toEqual(["colors visible true"]);
  // It opens on the colour the dialog has.
  expect(await page.evaluate(() => window.shown)).toEqual(["color #ff0000"]);
  // Every colour the user tries is the selected one; the one the picker is
  // closed on is the dialog accepted.
  expect(await pick(page, "#00ff00", "input")).toEqual(["colors color #00ff00"]);
  expect(await pick(page, "#0000ff", "input")).toEqual(["colors color #0000ff"]);
  expect(await pick(page, "#0000ff", "change")).toEqual(["colors result 1", "colors visible false", "colors accepted"]);
  expect(await page.evaluate(() => window.objects.colors.selectedColor.b)).toBe(1);
  // A colour assigned is the one the picker shows, without its alpha.
  await call(page, "colors", "open");
  await page.evaluate(() => (window.objects.colors.selectedColor = "#80102030"));
  expect(await swatch(page).evaluate((input) => input.value)).toBe("#102030");
  await call(page, "colors", "close");
  await log(page);
  await call(page, "colors", "open");
  expect(await page.evaluate(() => window.shown)).toEqual(["color #ff0000", "color #0000ff", "color #102030"]);
});

test("a colour picker closed on the colour it had is the dialog rejected", async ({ page }) => {
  await open(page, "dialogs");
  await call(page, "colors", "open");
  await log(page);
  // The picker says nothing of that: the press that reaches the page does.
  await page.mouse.click(300, 250);
  expect(await log(page)).toEqual(["colors visible false", "colors rejected"]);
  await page.mouse.click(300, 250);
  expect(await log(page)).toEqual([]);
  // Closed on another colour, before the input has said so.
  await call(page, "colors", "open");
  await log(page);
  await pick(page, "#00ff00");
  await page.mouse.click(300, 250);
  expect(await log(page)).toEqual([
    "colors color #00ff00",
    "colors result 1",
    "colors visible false",
    "colors accepted",
  ]);
});

test("a colour dialog opened before the user did anything waits for a press", async ({ page }) => {
  await page.addInitScript(() => {
    window.shown = [];
    const show = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function () {
      show.call(this);
      window.shown.push(this.type);
    };
  });
  await early(page, "colors");
  expect(await page.evaluate(() => [window.objects.colors.visible, window.shown, [...window.objects.log]])).toEqual([
    true,
    [],
    [],
  ]);
  await page.mouse.click(300, 250);
  expect(await page.evaluate(() => [window.objects.colors.visible, window.shown, [...window.objects.log]])).toEqual([
    true,
    ["color"],
    [],
  ]);
  // The press after that finds the picker closed.
  await page.mouse.click(300, 250);
  expect(await log(page)).toEqual(["colors rejected"]);
});

// The `<dialog>` of a message dialog that is open.
const box = (page) => page.locator("dialog.qq-message");
const shown = (page) =>
  box(page).evaluate((dialog) => ({
    modal: dialog.matches(":modal"),
    texts: [...dialog.querySelectorAll("h2, p, details")].filter((part) => !part.hidden).map((part) => part.textContent),
    buttons: [...dialog.querySelectorAll("button")].map((button) => button.textContent),
    focused: document.activeElement.textContent,
  }));

const press = (page, label) => box(page).getByRole("button", { name: label, exact: true }).click();

test("a message dialog is a dialog of the browser's with Qt's buttons", async ({ page }) => {
  await open(page, "dialogs");
  expect(await told(page, "message", "open")).toEqual(["message visible true"]);
  expect(await shown(page)).toEqual({
    modal: true,
    texts: ["Leaving", "The document was changed.", "Save it?"],
    buttons: ["Save", "Discard", "Cancel"],
    focused: "Save",
  });
  // In the middle of the page, over it.
  const rect = await box(page).boundingBox();
  const view = page.viewportSize();
  expect(Math.abs(rect.x + rect.width / 2 - view.width / 2)).toBeLessThan(1);
  expect(Math.abs(rect.y + rect.height / 2 - view.height / 2)).toBeLessThan(1);
  // The button pressed is the result, and its role how the dialog ended.
  await press(page, "Save");
  expect(await log(page)).toEqual([
    "message result 2048",
    "message visible false",
    "message accepted",
    "message clicked 2048 0",
  ]);
  expect(await box(page).count()).toBe(0);
  await call(page, "message", "open");
  await log(page);
  await press(page, "Discard");
  expect(await log(page)).toEqual([
    "message result 8388608",
    "message visible false",
    "message rejected",
    "message clicked 8388608 2",
  ]);
  await call(page, "message", "open");
  await log(page);
  await press(page, "Cancel");
  expect(await log(page)).toEqual([
    "message result 4194304",
    "message visible false",
    "message rejected",
    "message clicked 4194304 1",
  ]);
});

test("a message dialog follows its texts and buttons", async ({ page }) => {
  await open(page, "dialogs");
  await call(page, "message", "open");
  await page.evaluate(() => {
    const { message, MessageDialog } = window.objects;
    message.title = "";
    message.informativeText = "";
    message.detailedText = "It was changed at noon.";
    message.buttons =
      MessageDialog.Help | MessageDialog.No | MessageDialog.Yes | MessageDialog.Reset | MessageDialog.Apply;
  });
  expect(await shown(page)).toEqual({
    modal: true,
    texts: ["The document was changed.", "DetailsIt was changed at noon."],
    buttons: ["Reset", "Yes", "No", "Apply", "Help"],
    focused: "Yes",
  });
  await log(page);
  await press(page, "Yes");
  expect(await log(page)).toEqual([
    "message result 16384",
    "message visible false",
    "message accepted",
    "message clicked 16384 5",
  ]);
  // Without a button it could not be closed: it has OK, as Qt's.
  await page.evaluate(() => (window.objects.message.buttons = 0));
  await call(page, "message", "open");
  expect((await shown(page)).buttons).toEqual(["OK"]);
});

test("Escape rejects a message dialog, and so does closing it", async ({ page }) => {
  await open(page, "dialogs");
  await call(page, "message", "open");
  await log(page);
  await page.keyboard.press("Escape");
  expect(await log(page)).toEqual(["message visible false", "message rejected"]);
  expect(await box(page).count()).toBe(0);
  // The page takes presses again.
  expect(await page.evaluate(() => document.elementFromPoint(10, 10)?.className)).toBe("qq");
  await call(page, "message", "open");
  await log(page);
  // Qt's `accept()` gives a result that is no button: nothing accepted it.
  expect(await told(page, "message", "accept")).toEqual([
    "message result 1",
    "message visible false",
    "message rejected",
  ]);
  expect(await box(page).count()).toBe(0);
});

test("a message dialog that is not modal leaves the page its presses", async ({ page }) => {
  await open(page, "dialogs");
  await call(page, "note", "open");
  expect(await shown(page)).toEqual({ modal: false, texts: ["Done."], buttons: ["OK"], focused: "OK" });
  expect(await page.evaluate(() => document.elementFromPoint(10, 10)?.className)).toBe("qq");
  await press(page, "OK");
  expect(await page.evaluate(() => [window.objects.note.visible, window.objects.note.result])).toEqual([false, 1024]);
});

test("a message dialog needs no press to be shown", async ({ page }) => {
  await early(page, "message");
  expect((await shown(page)).texts).toEqual(["The application may not use the location."]);
  await press(page, "OK");
  // The handler's `accept()` comes when the dialog has closed: it changes
  // the result, as in Qt, and nothing else.
  expect(await log(page)).toEqual(["message accepted", "message clicked 1024"]);
  expect(await page.evaluate(() => [window.objects.message.visible, window.objects.message.result])).toEqual([
    false,
    1,
  ]);
});
