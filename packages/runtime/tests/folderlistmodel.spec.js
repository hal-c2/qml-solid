import { test as plain } from "@playwright/test";
import { expect, open, test } from "./open.js";

// A model is never ready at once: a test waits as a program does.
const READY = () => window.objects.files.status === 1 && window.objects.pictures.status === 1;

// What Qt 6.11 shows of the same folder after each of these, in turn.
const STEPS = [
  [{}, "C.png Zdir/ a.tar.gz a10.png a2.PNG b.txt noext sub/"],
  [{ nameFilters: ["*.png"] }, "C.png Zdir/ a10.png sub/"],
  [{ caseSensitive: false }, "C.png Zdir/ a10.png a2.PNG sub/"],
  [{ showDirs: false }, "C.png a10.png a2.PNG"],
  [{ nameFilters: [], showDirs: true, showDirsFirst: true }, "Zdir/ sub/ C.png a.tar.gz a10.png a2.PNG b.txt noext"],
  [{ sortCaseSensitive: false }, "sub/ Zdir/ a.tar.gz a10.png a2.PNG b.txt C.png noext"],
  [{ sortReversed: true }, "Zdir/ sub/ noext C.png b.txt a2.PNG a10.png a.tar.gz"],
  [{ sortReversed: false, sortField: 3 }, "sub/ Zdir/ C.png a2.PNG b.txt a10.png a.tar.gz noext"],
  [{ sortField: 4 }, "sub/ Zdir/ noext a.tar.gz a10.png a2.PNG C.png b.txt"],
  [{ sortField: 0 }, "Zdir/ sub/ a2.PNG a10.png noext C.png a.tar.gz b.txt"],
  [{ sortField: 1, showHidden: true }, ".hid/ sub/ Zdir/ .dot a.tar.gz a10.png a2.PNG b.txt C.png noext"],
  [{ showDotAndDotDot: true }, "./ ../ .hid/ sub/ Zdir/ .dot a.tar.gz a10.png a2.PNG b.txt C.png noext"],
  [{ showDotAndDotDot: false, showHidden: false, showFiles: false }, "sub/ Zdir/"],
  [{ showFiles: true, nameFilters: ["a*", "*.txt"] }, "sub/ Zdir/ a.tar.gz a10.png a2.PNG b.txt"],
  [{ nameFilters: ["a?.png", "[bc].*"] }, "sub/ Zdir/ a2.PNG b.txt C.png"],
  [{ showDirsFirst: false, nameFilters: [], sortField: 2 }, "a.tar.gz a10.png noext sub/ Zdir/ C.png a2.PNG b.txt"],
  [{ showDirs: false, sortReversed: true }, "b.txt a2.PNG C.png noext a10.png a.tar.gz"],
  [{ sortField: 0, sortReversed: false, showDirs: true }, "a2.PNG a10.png noext C.png a.tar.gz b.txt Zdir/ sub/"],
];

test("a FolderListModel filters and sorts a folder as Qt does", async ({ page }) => {
  await open(page, "folderlistmodel");
  const shown = [];
  for (const [changes] of STEPS) {
    await page.evaluate((changes) => Object.assign(window.objects.files, changes), changes);
    await page.waitForFunction(READY);
    shown.push(
      await page.evaluate(() => {
        const { files } = window.objects;
        const names = [];
        for (let index = 0; index < files.count; index++) names.push(files.get(index, "fileName") + (files.isFolder(index) ? "/" : ""));
        return names.join(" ");
      }),
    );
  }
  expect(shown).toEqual(STEPS.map(([, names]) => names));
  // The folder was looked in once: the rest is the same entries shown another way.
  expect(await page.evaluate(() => window.objects.asked)).toEqual(["host:/dir", ""]);
});

test("a FolderListModel has Qt's roles, methods and defaults", async ({ page }) => {
  await open(page, "folderlistmodel");
  await page.waitForFunction(READY);
  const read = await page.evaluate(() => {
    const { files, pictures, log, FolderListModel: F } = window.objects;
    const roles = ["fileName", "filePath", "fileURL", "fileUrl", "fileBaseName", "fileSuffix", "fileSize", "fileIsDir", "nope"];
    const at = (index) => roles.map((role) => files.get(index, role));
    return {
      log,
      rows: [files.count, files.rowCount(), files.status],
      first: at(0),
      third: at(2),
      modified: [files.get(0, "fileModified").toISOString(), files.get(5, "fileModified").toISOString()],
      accessed: files.get(0, "fileAccessed") instanceof Date,
      beyond: [files.get(99, "fileName"), files.get(-1, "fileName"), files.isFolder(99), files.isFolder(-1), files.isFolder(1)],
      folder: [files.folder, files.parentFolder, files.indexOf("host:/dir/b.txt"), files.indexOf("nope")],
      defaults: [
        files.sortField,
        files.sortReversed,
        files.showFiles,
        files.showDirs,
        files.showDirsFirst,
        files.showDotAndDotDot,
        files.showHidden,
        files.caseSensitive,
        files.sortCaseSensitive,
        files.nameFilters,
      ],
      enums: [F.Unsorted, F.Name, F.Time, F.Size, F.Type, F.Null, F.Ready, F.Loading],
      // No folder: the host's choice of one. An entry may say where it is.
      pictures: [pictures.folder, pictures.parentFolder, pictures.count, pictures.get(0, "fileName"), pictures.get(0, "fileUrl")],
    };
  });
  expect(read).toEqual({
    // It was loading before anything could ask to be told.
    log: ["count 8", "status 1 8"],
    rows: [8, 8, 1],
    first: ["C.png", "/dir/C.png", undefined, "host:/dir/C.png", "C", "png", 5, false, undefined],
    third: ["a.tar.gz", "/dir/a.tar.gz", undefined, "host:/dir/a.tar.gz", "a", "tar.gz", 1, false, undefined],
    modified: ["2024-03-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"],
    accessed: true,
    beyond: [undefined, undefined, false, false, true],
    folder: ["host:/dir", "host:/", 5, -1],
    defaults: [1, false, true, true, false, false, false, true, true, ["*"]],
    enums: [0, 1, 2, 3, 4, 0, 1, 2],
    pictures: ["", "", 1, "home.jpg", "host:/home/home.jpg"],
  });
});

test("a view shows a folder's rows, made again when the folder is read again", async ({ page }) => {
  await open(page, "folderlistmodel");
  await page.waitForFunction(READY);
  const rows = () =>
    page.evaluate(() => {
      const { rows } = window.objects;
      return Array.from({ length: rows.count }, (_, index) => rows.itemAt(index).all);
    });
  expect((await rows()).slice(0, 2)).toEqual([
    [0, "C.png", "host:/dir/C.png", "host:/dir/C.png", false, "png"],
    [1, "Zdir", "host:/dir/Zdir", "host:/dir/Zdir", true, ""],
  ]);
  const during = await page.evaluate(() => {
    const { files, rows, log } = window.objects;
    log.length = 0;
    files.folder = "host:/dir/sub";
    // What it showed stays until it has looked.
    return [files.status, files.count, rows.count, files.parentFolder];
  });
  expect(during).toEqual([2, 8, 8, "host:/dir"]);
  await page.waitForFunction(READY);
  expect(await rows()).toEqual([[0, "deep file.txt", "host:/dir/sub/deep%20file.txt", "host:/dir/sub/deep%20file.txt", false, "txt"]]);
  const after = await page.evaluate(async () => {
    const { files, rows, log, table, folders } = window.objects;
    const seen = { log: log.filter((line) => !line.startsWith("destroyed")), destroyed: log.length, made: window.objects.made };
    // The page says the folder has changed.
    table["host:/dir/sub"] = ["deep file.txt", "new.txt"];
    folders.changed("host:/dir");
    seen.other = files.status;
    folders.changed("host:/dir/sub");
    seen.told = files.status;
    await null;
    await null;
    await null;
    seen.changed = [files.status, files.count, rows.count, window.objects.made];
    // A folder that is not there.
    files.folder = "host:/nowhere";
    await null;
    await null;
    await null;
    seen.missing = [files.status, files.count, rows.count];
    return seen;
  });
  expect(after).toEqual({
    log: ["status 2 8", "count 1", "status 1 1"],
    destroyed: 3 + 8,
    made: 9,
    other: 1,
    told: 2,
    changed: [1, 2, 2, 11],
    missing: [0, 0, 0],
  });
});

test("the page may answer later, or not be there to answer", async ({ page }) => {
  await open(page, "folderlistmodel");
  await page.waitForFunction(READY);
  const read = await page.evaluate(async () => {
    const { files, rows, folders } = window.objects;
    const tick = () => new Promise((resolve) => setTimeout(resolve));
    const seen = {};
    const answers = [];
    folders.list = (url) => new Promise((resolve) => answers.push([url, resolve]));
    await tick();
    seen.asked = [answers.map(([url]) => url), files.status, files.count];
    // Asked again before the answer came: the first answer is not shown.
    files.folder = "host:/other";
    await tick();
    answers[0][1](["late.txt"]);
    await tick();
    seen.late = [files.status, files.count];
    answers[2][1](["one.txt", "two/"]);
    await tick();
    seen.answered = [answers[2][0], files.status, files.count, rows.itemAt(1).all[1], files.isFolder(1)];
    // No host: every folder is empty.
    folders.list = null;
    seen.asking = files.status;
    await tick();
    seen.none = [files.status, files.count, rows.count];
    return seen;
  });
  expect(read).toEqual({
    asked: [["host:/dir", ""], 2, 8],
    late: [2, 8],
    answered: ["host:/other", 1, 2, "two", true],
    asking: 2,
    none: [1, 0, 0],
  });
});

plain("a host that fails is said to have, and the folder shown as not there", async ({ page }) => {
  const warnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await open(page, "folderlistmodel");
  await page.waitForFunction(READY);
  await page.evaluate(() => {
    window.objects.folders.list = () => {
      throw new Error("no such host");
    };
  });
  await page.waitForFunction(() => window.objects.files.status === 0);
  expect(await page.evaluate(() => window.objects.files.count)).toBe(0);
  expect(warnings).toEqual(["FolderListModel: no such host", "FolderListModel: no such host"]);
});
