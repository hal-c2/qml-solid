// main.cpp gives Main.qml the file named on the command line, of which there
// is none here, and what the file dialog filters by: a name filter for each
// file format the platform decodes (QMediaFormat), in order, the MP4 one
// selected. Here the platform is the browser.

// QMediaFormat's file formats: the MIME type of each (after a space, the name
// browsers know it by), QMediaFormat's description, and the MIME database's
// suffixes.
const formats = [
  ["video/x-ms-wmv", "Windows Media Video (WMV)", ["wmv"]],
  ["video/vnd.avi video/x-msvideo", "Audio Video Interleave (AVI)", ["avi", "avf", "divx"]],
  ["video/matroska video/x-matroska", "Matroska Multimedia Container", ["mkv"]],
  ["video/mp4", "MPEG-4 Video Container", ["mp4", "m4v", "f4v", "lrv", "lrf"]],
  ["video/ogg", "Ogg", ["ogv", "ogg"]],
  ["video/quicktime", "QuickTime Container", ["qt", "mov", "moov", "qtvr"]],
  ["video/webm", "WebM", ["webm"]],
  ["audio/mp4", "MPEG-4 Audio", ["m4a", "f4a"]],
  ["audio/aac", "Advanced Audio Coding (AAC)", ["aac", "adts", "ass"]],
  ["audio/x-ms-wma", "Windows Media Audio (WMA)", ["wma"]],
  ["audio/mpeg", "MP3", ["mp3", "mpga"]],
  ["audio/flac", "Free Lossless Audio Codec (FLAC)", ["flac"]],
  ["audio/vnd.wave audio/wav", "Wave Audio File Format (WAVE)", ["wav"]],
];

const filter = ([, description, suffixes]) => `${description} (${suffixes.map((suffix) => `*.${suffix}`).join(" ")})`;

export const properties = () => {
  const player = document.createElement("video");
  const decoded = formats.filter(([types]) => types.split(" ").some((type) => player.canPlayType(type) !== ""));
  const nameFilters = decoded.map(filter).sort();
  const preferred = decoded.find(([types]) => types === "video/mp4");
  return {
    source: "",
    nameFilters,
    selectedNameFilter: preferred ? nameFilters.indexOf(filter(preferred)) : 0,
  };
};
