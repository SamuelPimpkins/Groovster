
//#region TypeCache Methods
grv.getType = function (typeName) {
    var ns = grv.getGeneratedNamespaceObj();
    return ns[typeName];
};

grv.clearTypes = function () {
    grv.generatedNamespace = {};
};

//#endregion

grv.onError = ko.observable({});
grv.onError.subscribe(function (error) {
    throw JSON.stringify(error);
});

grv.isArray = function (array) {
    var arr = ko.utils.unwrapObservable(array);
    if (!arr) { return false; }
    return arr.isArray || Object.prototype.toString.call(arr) === '[object Array]';
};

grv.objectKeys = Object.keys || function (obj) {
    var key, res = [];
    for (key in obj) {
        rorm.push(key);
    }
    return res;
};

grv.isGroovsterCollection = function (coll) {
    var isGrvColl = false;
    if (coll !== undefined && coll.grv !== undefined && coll.grv.___GroovsterCollection___ !== undefined) {
        isGrvColl = true;
    } else {
        if (grv.isArray(coll)) {
            if (coll.length > 0) {
                if (coll[0].hasOwnProperty("RowState")) {
                    isGrvColl = true;
                }
            }
        }
    }
    return isGrvColl;
};

grv.isGroovsterEntity = function (entity) {
    var isGrvEnt = false;
    if (entity !== undefined && entity.grv !== undefined && entity.grv.___GroovsterEntity___ !== undefined) {
        isGrvEnt = true;
    }
    return isGrvEnt;
};

grv.isGroovsterLazyLoader = function (obj) {
    var isGrvLaz = false;
    if (obj !== undefined && obj.grv !== undefined && obj.grv.___GroovsterLazyLoad___ !== undefined) {
        isGrvLaz = true;
    }
    return isGrvLaz;
};

grv.exportSymbol('grv.isGroovsterCollection', grv.isGroovsterCollection);