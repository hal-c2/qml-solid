// main.cpp makes a calendar of the platform's own toolkit, or of Qt Widgets,
// gives its window to Main.qml, and shows the window that is.
import CalendarWindow from "./CalendarWindow.qml";

export const properties = () => ({ calendarWindow: CalendarWindow({}) });
export const loaded = (window) => window.showNormal();
