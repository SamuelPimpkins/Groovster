﻿/* File Created: December 23, 2011 */

grv.XMLHttpRequestProvider = function () {

    var createRequest, executeCompleted, noop = function () { };
    this.baseURL = "http://localhost";

    createRequest = function () {

        var xmlHttp;

        // Create HTTP request
        try {
            xmlHttp = new XMLHttpRequest();
        } catch (e1) {
            try {
                xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    alert("This sample only works in browsers with AJAX support");
                    return false;
                }
            }
        }

        return xmlHttp;
    };

    executeCompleted = function (responseText, route) {

        var response = {
            data: JSON.parse(responseText),
            error: undefined
        };

        if (route.response !== undefined) {
            switch (route.response) {
                case 'entity':
                case 'collection':
                    response.error = response.data['exception'];
                    response.data = response.data[route.response];
                    break;
            }
        }

        return response;
    };

    // Called by the entityspacorm.js framework when working with entities
    this.execute = function (options) {

        var path = null, xmlHttp, success, error, response;

        success = options.success || noop;
        error = options.error || noop;

        // Create HTTP request
        xmlHttp = createRequest();

        // Build the operation URL
        path = this.baseURL + options.url;

        // Make the HTTP request
        xmlHttp.open("POST", path, options.async || false);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
		// Hack to make it work with FireFox
        xmlHttp.setRequestHeader("accept", "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");		

        if (options.async === true) {
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {

                    response = executeCompleted(xmlHttp.responseText, options.route);

                    if (xmlHttp.status === 200 && response.error === null) {
                        success(response.data, options);
                    } else {
                        error(xmlHttp.status, response.error || xmlHttp.responseText, options);
                    }
                }
            };
        }

        xmlHttp.send(ko.toJSON(options.data));

        if (options.async === false) {

            response = executeCompleted(xmlHttp.responseText, options.route);

            if (xmlHttp.status === 200 && response.error === null) {
                if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                    success(response.data, options);
                }
            } else {
                error(xmlHttp.status, response.error || xmlHttp.responseText, options);
            }
        }
    };

    // So developers can make their own requests, synchronous or aynchronous
    this.makeRequest = function (url, methodName, params, successCallback, failureCallback, state) {

        var theData = null, path = null, async = false, xmlHttp, success, failure;

        if (successCallback !== undefined || failureCallback !== undefined) {
            async = true;
            success = successCallback || noop;
            failure = failureCallback || noop;
        }

        // Create HTTP request
        xmlHttp = createRequest();

        // Build the operation URL
        path = url + methodName;

        // Make the HTTP request
        xmlHttp.open("POST", path, async);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
		// Hack to make it work with FireFox
        xmlHttp.setRequestHeader("accept", "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
		

        if (async === true) {
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        success(JSON.parse(xmlHttp.responseText), state);
                    } else {
                        failure(xmlHttp.status, xmlHttp.statusText, state);
                    }
                }
            };
        }

        xmlHttp.send(params);

        if (async === false) {
            if (xmlHttp.status === 200) {
                if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                    theData = JSON.parse(xmlHttp.responseText);
                }
            } else {
                grv.makeRequstError = xmlHttp.statusText;
            }
        }

        return theData;
    };
};

grv.dataProvider = new grv.XMLHttpRequestProvider(); //assign default data provider