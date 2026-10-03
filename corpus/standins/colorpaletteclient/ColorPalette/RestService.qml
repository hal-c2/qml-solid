// Stands in for RestService (restservice.cpp): the address of a REST service
// and the headers every request to it has, shared by the resources declared
// in it.
import QtQml

QtObject {
    id: service

    property url url
    // QSslSocket::supportsSsl(): a browser's requests do.
    readonly property bool sslSupported: true
    default property list<AbstractResource> resources

    // The rest is QNetworkRequestFactory, private in C++.

    // What a login was answered with; none after a logout or another address.
    property var token: undefined
    onUrlChanged: token = undefined

    function commonHeaders() {
        const headers = {}
        // reqres.in requires an API-key, see https://reqres.in/signup
        const host = /^[a-z][a-z0-9+.-]*:\/\/([^\/:?#]*)/i.exec(String(url))
        if (host && host[1].startsWith("reqres"))
            headers["x-api-key"] = "reqres-free-v1"
        if (token !== undefined)
            headers["token"] = token
        return headers
    }

    // `path` of the service, with one slash between, and the query.
    function createUrl(path, query) {
        let address = String(url)
        if (address.endsWith("/") && path.startsWith("/"))
            address += path.slice(1)
        else if (address.endsWith("/") || path.startsWith("/"))
            address += path
        else
            address += "/" + path
        const pairs = []
        for (const name in query)
            pairs.push(encodeURIComponent(name) + "=" + encodeURIComponent(query[name]))
        return pairs.length > 0 ? address + "?" + pairs.join("&") : address
    }

    Component.onCompleted: {
        for (const resource of resources)
            resource.service = service
    }
}
