// main.cpp downloads the pictures and meshes the example does not come with
// into its `content` directory, telling App.qml how far it is, and says so
// when all of them are there. Nothing is downloaded here: they are there or
// they are not.
export const loaded = (window) => window.downloadComplete();
