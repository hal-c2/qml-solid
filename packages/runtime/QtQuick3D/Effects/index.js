// `import QtQuick3D.Effects`: the effects Qt has ready, Blur and Vignette
// and the rest. None of it is in C++: each is QML of Qt's own over Effect,
// and its shaders are Qt's own, kept in the module's plugin. Both are of the
// Qt that is installed, and a build reads them from it.
//
// What runs them is the Effect of QtQuick3D (`../effects.js`).
export {};
