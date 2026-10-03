import OpenTUI

// hal-c2's TUI bricks, unmodified, composed for the browser.
Rectangle {
    objectName: "demo"
    flexDirection: "column"
    width: 64
    paddingX: 1
    paddingY: 1
    color: Theme.colors.bg

    WorkingIndicator {}
    Notifications {}
    Approvals {}
    PendingUserInput {}
    RevertPicker {}
    ThreadOverlay {}
    AddProjectInvite {}
}
