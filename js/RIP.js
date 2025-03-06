window.modifyResponseForUrlXHR = function(urlMapping) {
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener("readystatechange", function() {
            if (this.readyState === 4) {
                if (urlMapping.hasOwnProperty(this.responseURL)) {
                    const modifiedResponseText = modifyResponse(this.response, urlMapping, this.responseURL);
                    
                    Object.defineProperty(this, 'responseText', {
                        get: function() {
                            return modifiedResponseText;
                        }
                    });

                    Object.defineProperty(this, 'response', {
                        get: function() {
                            return modifiedResponseText;
                        }
                    });
                }
            }
        });

        return originalSend.apply(this, arguments);
    };
}


window.modifyResponseForUrlFetch = function(urlMapping) {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        if (urlMapping.hasOwnProperty(response.url)) {
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json();
            const modifiedResponseData = JSON.parse(modifyResponse(JSON.stringify(responseData), urlMapping, response.url));

            return new Response(JSON.stringify(modifiedResponseData), {
                status: clonedResponse.status,
                statusText: clonedResponse.statusText,
                headers: clonedResponse.headers
            });
        }

        return response;
    };
}

window.modifyResponse = function(originalResponse, urlMapping, url) {
    let jsonResponse = JSON.parse(originalResponse);

    for (const pattern in urlMapping) {
        const regex = new RegExp(pattern);
        if (regex.test(url)) {
            const modifiedResponse = urlMapping[pattern](jsonResponse);
            return JSON.stringify(modifiedResponse);
        }
    }

    return originalResponse;
}
