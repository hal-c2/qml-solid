// What the user picked, by the URL QML is given for it.
//
// A page is not told where a file is, only handed the file. QML gets a
// `blob:` URL for it, which an Image or a MediaPlayer shows like any other;
// a folder gets a URL made up here, which nothing can fetch. What is behind
// either is kept, for whatever needs the file's name or the folder's files.
//
// The URLs are never taken back: a playlist goes on playing a file long
// after the dialog chose another, and a file kept is a handle, not its bytes.
const files = new Map();
const folders = new Map();
let count = 0;

export function fileUrl(file) {
  const url = URL.createObjectURL(file);
  files.set(url, file);
  return url;
}

// `folder` is `{ name, handle }` where the browser gives a directory handle,
// `{ name, files }` where it gives every file under the folder at once.
export function folderUrl(folder) {
  const url = `folder:${++count}/${encodeURIComponent(folder.name)}/`;
  folders.set(url, folder);
  return url;
}

// The File a URL from a FileDialog stands for.
export const pickedFile = (url) => files.get(String(url));

// The folder a URL from a FolderDialog stands for.
export const pickedFolder = (url) => folders.get(String(url));

async function list(folder) {
  const found = [];
  if (folder.handle) {
    for await (const entry of folder.handle.values()) {
      if (entry.kind === "file") found.push(await entry.getFile());
    }
  } else {
    // The paths start with the folder's own name: the files right in it
    // have one more part.
    for (const file of folder.files) {
      if (file.webkitRelativePath.split("/").length === 2) found.push(file);
    }
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  return found.map((file) => ({ name: file.name, url: fileUrl(file), file }));
}

// The files right in a picked folder, by name: `[{ name, url, file }]`,
// read once. A URL that is no picked folder has none.
export function filesIn(url) {
  const folder = pickedFolder(url);
  if (!folder) return Promise.resolve([]);
  return (folder.listed ??= list(folder));
}
