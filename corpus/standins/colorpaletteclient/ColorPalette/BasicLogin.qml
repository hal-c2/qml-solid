// Stands in for BasicLogin (basiclogin.cpp): logs a user in to the service
// and out of it. The token the service answers with goes with every request
// after.
import QtQml

AbstractResource {
    // The resource's own to set: in C++ nothing else can.
    property string user: ""
    property bool loggedIn: false
    required property string loginPath
    required property string logoutPath

    function login(data) {
        send("POST", loginPath, {}, data, (reply) => {
            const json = readJson(reply)
            if (json && !Array.isArray(json) && "token" in json) {
                service.token = String(json.token)
                setUser(String(data.email ?? ""), true)
            } else {
                service.token = ""
                setUser("", false)
            }
        })
    }

    function logout() {
        send("POST", logoutPath, {}, undefined, (reply) => {
            if (isSuccess(reply)) {
                service.token = undefined
                setUser("", false)
            }
        })
    }

    // Both are changed by the time userChanged says so. C++ says so for
    // every answer, also one that changes nothing; this only for a change.
    function setUser(email, isLoggedIn) {
        loggedIn = isLoggedIn
        user = email
    }
}
