// `import QtPositioning`: places on the Earth, and where the device is.
//
// Of the shapes Qt has (rectangles, circles, paths, polygons) there are
// none here, nor addresses and satellites.
import { coordinate, fromMercator, INVALID, toMercator } from "./coordinate.js";

export { Position, PositionSource } from "./PositionSource.js";

export const QtPositioning = {
  // With nothing, or with less than a latitude and a longitude: nowhere.
  coordinate: (latitude, longitude, altitude) => coordinate(latitude, longitude, altitude),
  coordToMercator: (place) => toMercator(place ?? INVALID),
  mercatorToCoord: (point) => fromMercator(point.x, point.y),
};
