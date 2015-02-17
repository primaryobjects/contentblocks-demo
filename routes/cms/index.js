var mongo = require('mongoskin'),
    easypost = require('easypost'),
    config = require('../../config/config');

exports.get = function (req, res) {
    try {
        // Select the item by id.
        mongo.db(config.mongo.connectionString).collection(config.mongo.collectionName).findOne({ '_id': mongo.ObjectID.createFromHexString(req.params.itemId) }, function (err, document) {
            // Verify we have a document.
            if (!err && document != null) {
                res.json(document);
            }
            else {
                // No document found.
                res.status(404).json({ error: 'ID not found.', id: req.params.itemId });
            }
        });
    }
    catch (err) {
        // Database error.
        sendError(res, err.message);
    }
}

exports.find = function (req, res) {
    cleanQuery(req.query['q'].toString(), function (query, err) {
        if (err != null) {
            sendError(res, err.message);
        }
        else {
            try {
                // Get collection.
                mongo.db(config.mongo.connectionString).collection(config.mongo.collectionName).find(query).toArray(function (err, items) {
                    if (!err && items != null) {
                        console.log('Found ' + items.length + ' records.');
                        res.json(items);
                    }
                    else {
                        // No document found.
                        res.status(404).json({ error: 'No records found.' });
                    }
                });
            }
            catch (err) {
                // Database error.
                sendError(res, err.message);
            }
        }
    });
}

exports.insert = function (req, res) {
    // Read post data.
    easypost.get(req, res, function (data) {
        // Parse the JSON object.
        tryParseJson(data, function (json, err) {
            if (err != null) {
                sendError(res, err.message);
            }
            else {
                // Check for script injection in json, unless url contains ?script=1
                if (isScriptInjection(req, res, json)) {
                    sendError(res, 'Script tags are not allowed.');
                }
                else {
                    try {
                        // Insert the new item.
                        mongo.db(config.mongo.connectionString).collection(config.mongo.collectionName).insert(json, { safe: true }, function (err) {
                            // Success.
                            res.json(json);
                        });
                    }
                    catch (err) {
                        // Database error.
                        sendError(res, err.message);
                    }
                }
            }
        });
    });
 };

exports.update = function (req, res) {
    // Read post data.
    easypost.get(req, res, function (data) {
        // Parse the JSON object.
        tryParseJson(data, function (json, err) {
            if (err != null) {
                sendError(res, err.message);
            }
            else {
                // Check for script injection in json, unless url contains ?script=1
                if (isScriptInjection(req, res, json)) {
                    sendError(res, 'Script tags are not allowed.');
                }
                else {
                    try {
                        // Update the record matching id.
                        mongo.db(config.mongo.connectionString).collection(config.mongo.collectionName).update({ '_id': new mongo.ObjectID(req.params.itemId) }, json, { safe: true, multi: false }, function (err, count) {
                            // Verify a document was updated by checking the count.
                            if (!err && count > 0) {
                                // Success.
                                res.json({ document: json, updated: count });
                            }
                            else {
                                // Error, check if it's a database error or just no records updated.
                                if (err != null) {
                                    // Error during update.
                                    sendError(res, err.message);
                                }
                                else {
                                    // No records updated.
                                    res.status(404).json({ error: 'No record updated', id: req.params.itemId });
                                }
                            }
                        });
                    }
                    catch (err) {
                        // Database error.
                        sendError(res, err.message);
                    }
                }
            }
        });
    });
};

exports.delete = function (req, res) {
    try {
        // Update the record matching id.
        mongo.db(config.mongo.connectionString).collection(config.mongo.collectionName).remove({ '_id': mongo.ObjectID.createFromHexString(req.params.itemId) }, { safe: true, multi: false }, function (err, count) {
            // Verify a document was updated by checking the count.
            if (!err && count > 0) {
                // Success.
                res.json({ id: req.params.itemId, deleted: count });
            }
            else {
                // Error, check if it's a database error or just no records updated.
                if (err != null) {
                    // Error during update.
                    sendError(res, err.message);
                }
                else {
                    // No records updated.
                    res.status(404).json({ error: 'No record deleted', id: req.params.itemId });
                }
            }
        });
    }
    catch (err) {
        // Database error.
        sendError(res, err.message);
    }
};

//
// Helper Methods
//
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};

sendError = function (res, message) {
    res.status(500).json({ error: message });
};

tryParseJson = function (data, onJson) {
    try {
        // Try parsing the JSON object.
        json = JSON.parse(data);

        onJson(json);
    }
    catch (err) {
        // Invalid JSON.
        onJson(null, { message: 'Invalid JSON object passed in query: ' + data + '. ' + err.message });
    }
};

cleanQuery = function (query, onQuery) {
    var cleanedQuery = {};

    try {
        // Try parsing the JSON object.
        cleanedQuery = JSON.parse(query);

        var index = query.indexOf('/');
        if (index > -1) {
            // This is a regular expression. Parse out the left and right portion of the expression and create a RegEx query.
            var left = query.substring(0, index - 1);
            var right = query.substr(index, query.length - index);

            // Clean the string.
            left = left.replace(/{/g, '');
            left = left.replace(/\"/g, '');
            left = left.replace(/:/g, '');
            right = right.replace(/}/g, '');
            right = right.replace(/\//g, '');
            right = right.replace(/\"/g, '');

            left = left.trim();
            right = right.trim();

            // Create the query.
            cleanedQuery[left] = { $regex: right, $options: 'ig' };
        }

        // Return result.
        onQuery(cleanedQuery);
    }
    catch (err) {
        // Invalid JSON.
        onQuery(null, { message: 'Invalid JSON object passed in query: ' + query + '. ' + err.message });
    }
};

isScriptInjection = function (req, res, json) {
    var result = false;

    if (req.query['script'] != '1') {
        // Enforce no script tags in json data, unless url contains ?script=1
        if (JSON.stringify(json).toLowerCase().indexOf('<script') != -1) {
            result = true;
        }
    }

    return result;
};