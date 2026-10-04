// Stands in for AbstractResource (abstractresource.h): what the resources of
// a RestService share. In C++ that is the service's QRestAccessManager and
// QNetworkRequestFactory; here it is the service, and XMLHttpRequest.
import QtQml

QtObject {
    // The RestService the resource is declared in, which gives itself.
    property QtObject service: null

    // Sends `data` (as JSON, or nothing when undefined) to `path` of the
    // service, and calls `finished` with the request when it is over,
    // whichever way.
    function send(method, path, query, data, finished) {
        if (!service)
            return
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE)
                finished(request)
        }
        request.open(method, service.createUrl(path, query))
        const headers = service.commonHeaders()
        for (const name in headers)
            request.setRequestHeader(name, headers[name])
        if (data === undefined) {
            request.send()
        } else {
            request.setRequestHeader("Content-Type", "application/json")
            request.send(JSON.stringify(data))
        }
    }

    // QRestReply::isSuccess: answered, and with a 2xx status.
    function isSuccess(request) {
        return request.status >= 200 && request.status < 300
    }

    // QRestReply::readJson: the body as a JSON object or array, whatever the
    // status; undefined when it is not one.
    function readJson(request) {
        try {
            const json = JSON.parse(request.responseText)
            return typeof json === "object" && json !== null ? json : undefined
        } catch (error) {
            return undefined
        }
    }
}
