// Stands in for PaginatedResource (paginatedresource.cpp): a list of JSON
// items the service gives a page at a time, and adds to, changes and removes
// from.
import QtQml

AbstractResource {
    id: resource

    // The resource's own to set: in C++ nothing else can.
    property var data: []
    property int pages: 0
    // The page shown: 1 at first. Another is asked for when it is set.
    property int page: 1
    required property string path

    signal dataUpdated()
    signal pageUpdated()
    signal pagesUpdated()

    // The page asked for last, or the one the service said it gave.
    property int currentPage: 1
    onPageChanged: {
        if (page === currentPage)
            return
        if (page < 1) {
            page = currentPage
            return
        }
        currentPage = page
        pageUpdated()
        refreshCurrentPage()
    }

    function refreshCurrentPage() {
        send("GET", path, { page: currentPage }, undefined, (reply) => {
            const json = readJson(reply)
            if (json)
                refreshRequestFinished(json)
            else
                refreshRequestFailed()
        })
    }

    function update(data, id) {
        send("PUT", path + "/" + id, {}, data, (reply) => {
            if (isSuccess(reply))
                refreshCurrentPage()
        })
    }

    function add(data) {
        send("POST", path, {}, data, (reply) => {
            if (isSuccess(reply))
                refreshCurrentPage()
        })
    }

    function remove(id) {
        send("DELETE", path + "/" + id, {}, undefined, (reply) => {
            if (isSuccess(reply))
                refreshCurrentPage()
        })
    }

    function refreshRequestFinished(json) {
        const integer = (value) => typeof value === "number" ? Math.trunc(value) : 0
        data = Array.isArray(json.data) ? json.data.map((entry) => typeof entry === "object" && entry !== null ? entry : ({})) : []
        pages = integer(json.total_pages)
        currentPage = integer(json.page)
        page = currentPage
        pageUpdated()
        pagesUpdated()
        dataUpdated()
    }

    function refreshRequestFailed() {
        if (currentPage !== 1) {
            // The last item of the page may have been removed: back to the
            // first.
            page = 1
        } else {
            pages = 0
            pagesUpdated()
            if (data.length > 0) {
                data = []
                dataUpdated()
            }
        }
    }
}
