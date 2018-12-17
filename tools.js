import axios from 'axios';

async function requestAjaxSync(url, method = 'get', params) {
    return new Promise((resolve, reject) => {
        axios({
            // `url` is the server URL that will be used for the request
            url: url,

            // `method` is the request method to be used when making the request
            method: method, // default

            // `headers` are custom headers to be sent
            headers: {
                // 'X-Requested-With': 'XMLHttpRequest'
            },

            // `params` are the URL parameters to be sent with the request
            // Must be a plain object or a URLSearchParams object
            params: params,

            // `data` is the data to be sent as the request body
            // Only applicable for request methods 'PUT', 'POST', and 'PATCH'
            // When no `transformRequest` is set, must be of one of the following types:
            // - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
            // - Browser only: FormData, File, Blob
            // - Node only: Stream, Buffer
            data: params,

            // `timeout` specifies the number of milliseconds before the request times out.
            // If the request takes longer than `timeout`, the request will be aborted.
            timeout: 30000, // default is `0` (no timeout)

            // `responseType` indicates the type of data that the server will respond with
            // options are 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
            responseType: 'json', // default

            // `maxContentLength` defines the max size of the http response content in bytes allowed
            maxContentLength: 2000000
        }).then((data) => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}
export default {
    requestAjaxSync
}
