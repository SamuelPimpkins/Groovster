//-------------------------------------------------------------------- 
// The groovster.js JavaScript library v0.0.0 
// (c) Samuel Pimpkins 
// 
// Built on Wed 01/16/2013 at 22:40:03.83    
// https://github.com/SamuelPimpkins/Groovster 
// 
// License: NOT YET DETERMINED 
//-------------------------------------------------------------------- 
 
(function(window, undefined) { 
 
 
/*********************************************** 
* FILE: ..\Src\Namespace.js 
***********************************************/ 
﻿var grv = window['grv'] = {}; //define root namespace

// Google Closure Compiler helpers (used only to make the minified file smaller)
grv.exportSymbol = function (publicPath, object) {
    var tokens = publicPath.split(".");
    var target = window;
    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};

var config = window.grvConfig || {};

var extend = function (target, source) {
    var prop;

    if (!target || !source) {
        return;
    }

    for (prop in source) {
        target[prop] = source[prop];
    }

    return target;
};

config = extend(config, {
    //defines the namespace where the Business Objects will be stored
    namespace: 'grv.objects'
});

//ensure the namespace is built out...
(function () {
    
    var path = config.namespace.split('.');
    var target = window;

    for(var i = 0; i < path.length; i++){
        if(target[path[i]] === undefined){
            target[path[i]] = {};
        }
        target = target[path[i]];
    }

    grv.generatedNamespace = target;

}());


grv.getGeneratedNamespaceObj = function() {
    return grv.generatedNamespace;
};

grv.exportSymbol('grv', grv); 
 
 
/*********************************************** 
* FILE: ..\Src\Constants.js 
***********************************************/ 
﻿
grv.RowState = {
    INVALID: 0,
    UNCHANGED: 2,
    ADDED: 4,
    DELETED: 8,
    MODIFIED: 16
};

grv.exportSymbol('grv.RowState', grv.RowState); 
 
 
/*********************************************** 
* FILE: ..\Src\DateParser.js 
***********************************************/ 
﻿
grv.DateParser = function () {

    // From the Server
    this.deserialize = function (date) {

        var newDate = date;

        //deserialize weird .NET Date strings
        if (typeof newDate === "string") {
            if (newDate.indexOf('/Date(') === 0) {
                
                var offsetMinutes = 0;

                if(newDate.indexOf('-') === -1) {
                    var timeOffset = new Date();
                    offsetMinutes = timeOffset.getTimezoneOffset();
                }

                newDate = new Date(parseInt(newDate.substr(6)));
				
				if(offsetMinutes > 0) {
					newDate.setMinutes(newDate.getMinutes() + offsetMinutes);
				}
            }
        }

        return newDate;
    };

    // To the Server
    this.serialize = function (date, format) {
        return "\/Date(" + Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0)  + ")\/";
    };
};  
 
 
/*********************************************** 
* FILE: ..\Src\Core.js 
***********************************************/ 
﻿
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
 
 
/*********************************************** 
* FILE: ..\Src\utils.js 
***********************************************/ 
﻿/*globals grv, ko*/

/// <reference path="../Libs/jquery-1.9.0.min.js" />
/// <reference path="../Libs/knockout-2.0.0.debug.js" />

var utils = {

    dateParser: new grv.DateParser(),

    copyDataIntoEntity: function (target, source) {
        var prop, srcProp;

        if (!target || !source) {
            return;
        }

        for (prop in target) {

            if (source.hasOwnProperty(prop)) {

                if (target.grvTypeDefs && target.grvTypeDefs[prop]) continue; // skip heirarchtical

                srcProp = source[prop];

                if (typeof srcProp === "string") {
                    srcProp = utils.dateParser.deserialize(srcProp);
                }

                if (ko.isObservable(target[prop])) { //set the observable property
                    target[prop](srcProp); // set the observable
                } else {
                    target[prop] = srcProp;
                }
            }
        }

        return target;
    },

    extend: function (target, source) {
        var prop;

        if (!target || !source) {
            return;
        }

        for (prop in source) {
            target[prop] = source[prop];
        }

        return target;
    },

    addPropertyChangedHandlers: function (obj, propertyName) {

        var property = obj[propertyName];

        //only subscribe to property changes if its a ko.observable... not an ObservableArray, or a Computed
        if (ko.isObservable(property) && !(property instanceof Array) && property.__ko_proto__ !== ko.dependentObservable) {

            // This is the actual PropertyChanged event
            property.subscribe(function (originalValue) {

                var mappedName;

                if (obj.grv.ignorePropertyChanged === false) {

                    mappedName = obj.grvColumnMap[propertyName];

                    if (mappedName === 1) {
                        mappedName = propertyName;
                    }

                    mappedName = mappedName || propertyName;

                    if (ko.utils.arrayIndexOf(obj.ModifiedColumns(), mappedName) === -1) {

                        if (!obj.grv.originalValues[propertyName]) {
                            obj.grv.originalValues[propertyName] = originalValue;
                        }

                        if (propertyName !== "RowState") {

                            obj.ModifiedColumns.push(mappedName);

                            if (obj.RowState() !== grv.RowState.MODIFIED && obj.RowState() !== grv.RowState.ADDED) {
                                obj.RowState(grv.RowState.MODIFIED);
                            }
                        }
                    }
                }
            }, obj, "beforeChange"); //subscribe to 'beforeChange' so we can be notified of the current value and not the new value!
        }
    },

    startTracking: function (entity) {

        var propertyName;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(grv.RowState.ADDED);
        } else {
            if (!ko.isObservable(entity.RowState)) {
                entity.RowState = ko.observable(entity.RowState);
            }
        }

        if (entity.hasOwnProperty("ModifiedColumns")) {
            //overwrite existing data
            entity.ModifiedColumns([]);
        } else {
            entity.ModifiedColumns = ko.observableArray();
        }


        for (propertyName in entity) {
            if (propertyName !== "ModifiedColumns" &&
                propertyName !== '__type' &&
                propertyName !== 'grvExtendedData' &&
                propertyName !== 'grv') {

                var property = entity[propertyName];

                if (property instanceof Array) {
                    continue;
                }

                if (entity.hasOwnProperty(propertyName) && ko.isObservable(property)) {
                    utils.addPropertyChangedHandlers(entity, propertyName);
                }
            }
        }

        return entity;
    },

    expandExtraColumns: function (entity, shouldMakeObservable) {

        var data,
            i,
            ext,
            makeObservable = arguments[1] || false;

        if (entity.grvExtendedData && grv.isArray(entity.grvExtendedData)) {

            data = ko.isObservable(entity.grvExtendedData) ? entity.grvExtendedData() : entity.grvExtendedData;

            for (i = 0; i < data.length; i++) {

                if (ko.isObservable(entity[data[i].Key])) { //set the observable property
                    entity[data[i].Key](data[i].Value); // set the observable
                } else {
                    if (makeObservable) {
                        entity[data[i].Key] = ko.observable(data[i].Value);
                    } else {
                        entity[data[i].Key] = data[i].Value;
                    }
                }
            }

            delete entity.grvExtendedData;
        }

        return entity;
    },

    getDirtyGraph: function (obj, root, dirtyGraph) {

        var propertyName, entity, arr, temp, index;

        // Check and see if we have anything dirty at all?
        if (root === undefined) {
            if (!obj.isDirtyGraph()) {
                return null;
            }
        }

        if (grv.isGroovsterEntity(obj)) {

            if (grv.isArray(dirtyGraph)) {
                temp = obj.prepareForJSON();
                dirtyGraph.push(temp);
                dirtyGraph = temp;
            } else {
                dirtyGraph = obj.prepareForJSON();
            }

            if (root === undefined) {
                root = dirtyGraph;
            }

            for (propertyName in obj.grvTypeDefs) {

                if (obj[propertyName] !== undefined) {

                    if (obj[propertyName].isDirtyGraph()) {

                        arr = obj[propertyName].prepareForJSON();
                        dirtyGraph[propertyName] = [];

                        for (index = 0; index < arr.length; index++) {
                            entity = arr[index];
                            grv.utils.getDirtyGraph(entity, root, dirtyGraph[propertyName]);
                        }
                    }
                }
            }
        } else {

            // They passed in a collection 
            root = [];

            arr = obj.prepareForJSON();

            for (index = 0; index < arr.length; index++) {
                entity = arr[index];
                grv.utils.getDirtyGraph(entity, root, root);
            }
        }

        return root;
    }
};

utils.newId = (function () {
    var seedId = new Date().getTime();

    return function () {
        return ++seedId;
    };

} ());

grv.utils = utils;

grv.exportSymbol('grv.extend', grv.extend);
grv.exportSymbol('grv.startTracking', grv.startTracking);
grv.exportSymbol('grv.getDirtyGraph', grv.getDirtyGraph); 
 
 
/*********************************************** 
* FILE: ..\Src\Paging.js 
***********************************************/ 
/*globals grv, ko*/

grv.PagerFilterCriteria = function () {
    this.column = null;
    this.criteria1 = null;
    this.criteria2 = null;
    this.operation = null;
    this.conjuction = "AND";
};

grv.PagerSortCriteria = function () {
    this.column = null;
    this.direction = "ASC";
};

grv.PagerRequest = function () {
    this.getTotalRows = true;
    this.totalRows = 0;
    this.pageSize = 20;
    this.pageNumber = 1;

    this.sortCriteria = null;
    this.filterCriteria = null;
}; 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\GrvLazyLoader.js 
***********************************************/ 
﻿grv.grvLazyLoader = function (entity, propName) {

    var self = entity,
        data;

    var grvLazyLoader = function () {

        var val;

        if (arguments.length === 0) {

            if (val === undefined) {

                val = self.createObjectFromType(self.grvTypeDefs[propName]);

                if (val === undefined) {
                    throw "Please include the JavaScript class file for the '" + type + "'";
                }

                val.load({
                    route: self.grvRoutes[propName],
                    data: self.grvPrimaryKeys()
                });
            }

            self[propName] = val;

            if (self.grvRoutes[propName].response === 'collection') {
                return val();
            } else {
                return val;
            }
        }
    };

    return grvLazyLoader;
};

grv.grvLazyLoader.fn = { //can't do prototype on this one bc its a function

    __ko_proto__: ko.observable,

    isDirty: function () {
        return false;
    },

    isDirtyGraph: function () {
        return false;
    },

    subscribe: function () {

    }
};

grv.defineLazyLoader = function (entity, propName) {

    var grvwhatever = function () {
        var lazy = new grv.grvLazyLoader(entity, propName);
        return lazy();
    };

    ko.utils.extend(grvwhatever, grv.grvLazyLoader.fn);
    grvwhatever.grv = {};
    grvwhatever.grv.___GroovsterLazyLoader___ = true;
    return grvwhatever;
}; 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\GrvEntity.js 
***********************************************/ 
﻿/*globals es */
/// <reference path="../Libs/jquery-1.7.1.js" />
/// <reference path="../Libs/json2.js" />
/// <reference path="../Libs/knockout-2.0.0.debug.js" />
/// <reference path="../Constants.js" />
/// <reference path="../Namespace.js" />
/// <reference path="../Utils.js" />


grv.GroovsterEntity = function () { //empty constructor
    var extenders = [];

    this.customize = function (extender) {
        extenders.push(extender);
        return this;
    };

    this.init = function () {
        var self = this;

        //build out the 'es' utility object
        self.grv.___GroovsterEntity___ = grv.utils.newId(); // assign a unique id so we can test objects with this key, do equality comparison, etc...
        self.grv.ignorePropertyChanged = false;
        self.grv.originalValues = {};
        self.grv.isLoading = ko.observable(false);

        //start change tracking
        grv.utils.startTracking(self);

        // before populating the data, call each extender to add the required functionality to our object        
        ko.utils.arrayForEach(extenders, function (extender) {

            if (extender) {
                //Make sure to set the 'this' properly by using 'call'
                extender.call(self);
            }
        });


        this.isDirty = ko.computed(function () {
            return (self.RowState() !== grv.RowState.UNCHANGED);
        });

        this.isDirtyGraph = function () {

            var propertyName, dirty = false;

            if (self.RowState() !== grv.RowState.UNCHANGED) {
                return true;
            }

            for (propertyName in this.grvTypeDefs) {

                if (this[propertyName] !== undefined) {
                    dirty = this[propertyName].isDirtyGraph();
                    if (dirty === true) {
                        break;
                    }
                }
            }

            return dirty;
        };
    };

    this.createObjectFromEsTypeDef = function (esTypeDef) {
        var entityProp, EntityCtor;

        if (this.grvTypeDefs && this.grvTypeDefs[esTypeDef]) {
            EntityCtor = grv.getType(this.grvTypeDefs[esTypeDef]);
            if (EntityCtor) {
                entityProp = new EntityCtor();
            }
        }

        return entityProp;
    };

    this.createObjectFromType = function (type) {
        var entityProp, EntityCtor;

        EntityCtor = grv.getType(type);
        if (EntityCtor) {
            entityProp = new EntityCtor();
        }

        return entityProp;
    };

    this.prepareForJSON = function () {

        var self = this,
            stripped = {};

        ko.utils.arrayForEach(grv.objectKeys(this), function (key) {

            var mappedName, srcValue;

            switch (key) {
                case 'grv':
                case 'grvTypeDefs':
                case 'grvRoutes':
                case 'grvColumnMap':
                case 'grvExtendedData':
                    break;

                case 'RowState':
                    stripped['RowState'] = ko.utils.unwrapObservable(self.RowState);
                    break;

                case 'ModifiedColumns':
                    stripped['ModifiedColumns'] = ko.utils.unwrapObservable(self.ModifiedColumns);
                    break;

                default:

                    mappedName = self.grvColumnMap[key];

                    if (mappedName !== undefined) {

                        srcValue = ko.utils.unwrapObservable(self[key]);

                        if (srcValue === null || (!grv.isGroovsterCollection(srcValue) && typeof srcValue !== "function" && srcValue !== undefined)) {

                            // This is a core column ...
                            if (srcValue !== null && srcValue instanceof Date) {
                                stripped[key] = utils.dateParser.serialize(srcValue);
                            } else {
                                stripped[key] = srcValue;
                            }
                        }
                    }
                    break;

            }
        });

        return stripped;
    };

    this.populateEntity = function (data) {
        var self = this,
            prop,
            EntityCtor,
            entityProp;

        self.grv.ignorePropertyChanged = true;

        try {
            //blow away ModifiedColumns && orinalValues            
            if (this.hasOwnProperty("ModifiedColumns")) {
                //overwrite existing data
                this.ModifiedColumns([]);
            } else {
                this.ModifiedColumns = ko.observableArray();
            }
            this.grv.originalValues = {};

            //populate the entity with data back from the server...
            grv.utils.copyDataIntoEntity(self, data);

            //expand the Extra Columns
            grv.utils.expandExtraColumns(self, true);

            for (prop in data) {
                if (data.hasOwnProperty(prop)) {

                    if (this.grvTypeDefs && this.grvTypeDefs[prop]) {
                        EntityCtor = grv.getType(this.grvTypeDefs[prop]);
                        if (EntityCtor) {

                            entityProp = new EntityCtor();
                            if (entityProp.grv.hasOwnProperty('___GroovsterCollection___')) { //if its a collection call 'populateCollection'
                                entityProp.populateCollection(data[prop]);
                            } else { //else call 'populateEntity'
                                entityProp.populateEntity(data[prop]);
                            }

                            if (grv.isGroovsterCollection(this[prop])) {
                                this[prop](entityProp()); // Pass the entities into the already created collection
                            } else {
                                this[prop] = entityProp;  //then set the property back to the new Entity Object
                            }
                        } else {
                            // NOTE: We have a hierarchical property but the .js file for that entity wasn't included
                            //       so we need to make these regular ol' javascript objects
                            if (grv.isArray(data[prop])) {
                                this[prop] = data[prop];
                                ko.utils.arrayForEach(this[prop], function (data) {
                                    // TODO : CONTINUE WALKING, TALK WITH ERIC
                                });
                            } else {
                                this[prop] = data[prop];
                                // TODO : CONTINUE WALKING, TALK WITH ERIC
                            }
                        }
                    }
                }
            }
        } finally {
            // We need to make sure we always turn this off ...
            self.grv.ignorePropertyChanged = false;
        }
    };

    this.applyDefaults = function () {
        //here to be overridden higher up the prototype chain
    };

    this.acceptChanges = function () {

        //clear out originalValues so it thinks all values are original
        this.grv.originalValues = {};

        //then clear out ModifiedColumns
        this.ModifiedColumns([]);

        //finally set RowState back
        this.grv.ignorePropertyChanged = true;
        this.RowState(grv.RowState.UNCHANGED);
        this.grv.ignorePropertyChanged = false;
    };

    this.rejectChanges = function () {
        var prop;

        if (this.grv.originalValues) {

            this.grv.ignorePropertyChanged = true;

            //loop through the properties and revert the values back
            for (prop in this.grv.originalValues) {

                //ideally RowState is handled by this as well
                this[prop](this.grv.originalValues[prop]); // set the observable
            }

            // reset changes
            this.ModifiedColumns([]);
            this.grv.originalValues = {};

            this.grv.ignorePropertyChanged = false;
        }
    };

    this.markAsDeleted = function () {
        var entity = this;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(grv.RowState.DELETED);
        } else if (entity.RowState() !== grv.RowState.DELETED) {
            entity.RowState(grv.RowState.DELETED);
        }

        if (entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns.removeAll();
        }
    };

    //#region Loads
    this.load = function (options) {
        var state = {},
            self = this;

        self.grv.isLoading(true);

        state.wasLoaded = false;
        state.state = options.state;

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        //if a route was passed in, use that route to pull the ajax options url & type
        if (options.route) {
            options.url = options.route.url || this.grvRoutes[options.route].url;
            options.type = options.route.method || this.grvRoutes[options.route].method; //in jQuery, the HttpVerb is the 'type' param
        }

        //sprinkle in our own handlers, but make sure the original still gets called
        var successHandler = options.success;
        var errorHandler = options.error;

        //wrap the passed in success handler so that we can populate the Entity
        options.success = function (data, options) {

            if (data !== undefined && data !== null) {

                state.wasLoaded = true;

                //populate the entity with the returned data;
                self.populateEntity(data);
            }

            //fire the passed in success handler
            if (successHandler) { successHandler.call(self, data, state); }
            self.grv.isLoading(false);
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, state); }
            self.grv.isLoading(false);
        };

        grv.dataProvider.execute(options);

        if (options.async === false) {
            self.grv.isLoading(false);
        }

        return state.wasLoaded;
    };

    this.loadByPrimaryKey = function (primaryKey, success, error, state) { // or single argument of options

        var options = {
            route: this.grvRoutes['loadByPrimaryKey']
        };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            grv.utils.extend(options, arguments[0]);
        } else {
            options.data = primaryKey;
            options.success = success;
            options.error = error;
            options.state = state;
        }

        return this.load(options);
    };
    //#endregion Save

    //#region Save
    this.save = function (success, error, state) {
        var self = this;

        self.grv.isLoading(true);

        var options = { success: success, error: error, state: state, route: self.grvRoutes['commit'] };

        switch (self.RowState()) {
            case grv.RowState.ADDED:
                options.route = self.grvRoutes['create'] || options.route;
                break;
            case grv.RowState.MODIFIED:
                options.route = self.grvRoutes['update'] || options.route;
                break;
            case grv.RowState.DELETED:
                options.route = self.grvRoutes['delete'] || options.route;
                break;
        }

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            grv.utils.extend(options, arguments[0]);
        }

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        // Get all of the dirty data in the entire object graph
        options.data = grv.utils.getDirtyGraph(self);

        if (options.data === null) {
            // there was no data to save
            if (options.async === true) {
                options.success(null, options.state);
            }

            self.grv.isLoading(false);
            return;
        }

        if (options.route) {
            options.url = options.route.url;
            options.type = options.route.method;
        }

        var successHandler = options.success,
            errorHandler = options.error;

        options.success = function (data, options) {
            self.populateEntity(data);
            if (successHandler) { successHandler.call(self, data, options.state); }
            self.grv.isLoading(false);
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
            self.grv.isLoading(false);
        };

        grv.dataProvider.execute(options);

        if (options.async === false) {
            self.grv.isLoading(false);
        }
    };
    //#endregion
};

grv.exportSymbol('grv.GroovsterEntity', grv.GroovsterEntity);
grv.exportSymbol('grv.GroovsterEntity.populateEntity', grv.GroovsterEntity.populateEntity);
grv.exportSymbol('grv.GroovsterEntity.markAsDeleted', grv.GroovsterEntity.markAsDeleted);
grv.exportSymbol('grv.GroovsterEntity.load', grv.GroovsterEntity.load);
grv.exportSymbol('grv.GroovsterEntity.loadByPrimaryKey', grv.GroovsterEntity.loadByPrimaryKey);
grv.exportSymbol('grv.GroovsterEntity.save', grv.GroovsterEntity.save);
 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\GrvEntityCollection.js 
***********************************************/ 
﻿/*globals grv*/
/// <reference path="../../Libs/jquery-1.7.1.js" />
/// <reference path="../../Libs/json2.js" />
/// <reference path="../../Libs/knockout-2.0.0.debug.js" />


grv.GroovsterEntityCollection = function () {
    var obs = ko.observableArray([]);

    //define the 'grv' utility object
    obs.grv = {};

    //add all of our extra methods to the array
    ko.utils.extend(obs, grv.GroovsterEntityCollection.fn);

    obs.grv['___GroovsterCollection___'] = grv.utils.newId(); // assign a unique id so we can test objects with this key, do equality comparison, etc...
    obs.grv.deletedEntities = new ko.observableArray();
    obs.grv.deletedEntities([]);
    obs.grv.isLoading = ko.observable(false);

    return obs;
};

grv.GroovsterEntityCollection.fn = { //can't do prototype on this one bc its a function

    filter: function (predicate) {
        var array = this();

        return ko.utils.arrayFilter(array, predicate);
    },

    prepareForJSON: function () {

        var stripped = [];

        ko.utils.arrayForEach(this(), function (entity) {
            if (entity.isDirtyGraph()) {
                stripped.push(entity);
            }
        });

        ko.utils.arrayForEach(this.grv.deletedEntities(), function (entity) {
            if (entity.RowState() !== grv.RowState.ADDED) {
                stripped.push(entity);
            }
        });

        return stripped;
    },

    acceptChanges: function () {

        ko.utils.arrayForEach(this(), function (entity) {
            if (entity.RowState() !== grv.RowState.UNCHANGED) {
                entity.acceptChanges();
            }
        });

        this.grv.deletedEntities([]);
    },

    rejectChanges: function () {
        var self = this,
            addedEntities = [],
            slot = 0,
            index = 0,
            newArr,
            i;

        ko.utils.arrayForEach(self.grv.deletedEntities(), function (entity) {
            if (entity.RowState() === grv.RowState.ADDED) {
                addedEntities[slot] = index;
                slot += 1;
            } else {
                entity.rejectChanges();
            }
            index += 1;
        });


        if (addedEntities.length > 0) {
            for (index = addedEntities.length - 1; index >= 0; index--) {
                this.grv.deletedEntitigrv.splice(addedEntities[index], 1);
            }
        }

        addedEntities = [];
        ko.utils.arrayForEach(this(), function (entity) {

            switch (entity.RowState()) {
                case grv.RowState.MODIFIED:
                    entity.rejectChanges();
                    break;

                case grv.RowState.ADDED:
                    addedEntities.push(entity);
                    break;
            }
        });

        if (addedEntities.length > 0) {
            for (i = 0; i < addedEntities.length; i++) {
                index = ko.utils.arrayIndexOf(self(), addedEntities[i]);
                if (index >= 0) {
                    self.splice(index, 1);
                }
            }
        }

        if (this.grv.deletedEntities().length > 0) {
            newArr = self().concat(this.grv.deletedEntities());
            self(newArr);
        }

        this.grv.deletedEntities([]);
    },

    markAllAsDeleted: function () {

        var i, entity, coll, len, self = this;

        self.grv.deletedEntities(self.splice(0, self().length));
        coll = self.grv.deletedEntities;
        len = coll().length;

        // NOTE: Added ones are moved into the grv.deletedEntities area incase reject changes is called
        //       in which case they are restored, however, during a save they are simply discarded.
        for (i = 0; i < len; i += 1) {
            entity = coll()[i];

            if (entity.RowState() === grv.RowState.UNCHANGED) {

                if (!entity.hasOwnProperty("RowState")) {
                    entity.RowState = ko.observable(grv.RowState.DELETED);
                } else if (entity.RowState() !== grv.RowState.DELETED) {
                    entity.RowState(grv.RowState.DELETED);
                }

                if (entity.hasOwnProperty("ModifiedColumns")) {
                    entity.ModifiedColumns.removeAll();
                }
            }
        }
    },

    // Can be a single entity or an array of entities
    markAsDeleted: function (entitiesOrEntityToDelete) {

        var i, entity, coll, len, arr, tempArr = [], self = this;

        if (!arguments) {
            throw new Error("The entitiesOrEntityToDelete cannot be null or undefined.");
        }

        if (grv.isArray(entitiesOrEntityToDelete)) {

            tempArr = ko.utils.unwrapObservable(entitiesOrEntityToDelete);

            if (tempArr.length === 0) {
                throw new Error("The array passed in to markAsDeleted.markAsDeleted() cannot be empty.");
            }
        } else {
            for (i = 0; i < arguments.length; i++) {
                if (grv.isGroovsterEntity(arguments[i])) {
                    tempArr.push(arguments[i]);
                } else {
                    throw new Error("Invalid type passed in to markAsDeleted.markAsDeleted()");
                }
            }
        }

        arr = this.grv.deletedEntities().concat(tempArr);
        this.grv.deletedEntities(arr);
        this.removeAll(tempArr);

        coll = this.grv.deletedEntities;
        len = coll().length;

        // NOTE: Added ones are moved into the grv.deletedEntities area incase reject changes is called
        //       in which case they are restored, however, during a save they are simply discarded.
        for (i = 0; i < len; i += 1) {
            entity = coll()[i];

            if (entity.RowState() === grv.RowState.UNCHANGED) {

                if (!entity.hasOwnProperty("RowState")) {
                    entity.RowState = ko.observable(grv.RowState.DELETED);
                } else if (entity.RowState() !== grv.RowState.DELETED) {
                    entity.RowState(grv.RowState.DELETED);
                }

                if (entity.hasOwnProperty("ModifiedColumns")) {
                    entity.ModifiedColumns.removeAll();
                }
            }
        }
    },

    //call this when walking the returned server data to populate collection
    populateCollection: function (dataArray) {
        var entityTypeName = this.grv.entityTypeName, // this should be set in the 'DefineCollection' call, unless it was an anonymous definition
            EntityCtor,
            finalColl = [],
            create = this.createEntity,
            entity,
            self = this;

        if (entityTypeName) {
            EntityCtor = grv.getType(entityTypeName); //might return undefined
        }

        if (dataArray && grv.isArray(dataArray)) {

            ko.utils.arrayForEach(dataArray, function (data) {

                //call 'createEntity' for each item in the data array
                entity = create(data, EntityCtor); //ok to pass an undefined Ctor

                if (entity !== undefined && entity !== null) { //could be zeros or empty strings legitimately
                    finalColl.push(entity);
                }
            });

            //now set the observableArray that we inherit off of
            this(finalColl);
        }
    },

    createEntity: function (entityData, Ctor) {
        var entityTypeName, // this should be set in the 'DefineCollection' call 
            EntityCtor = Ctor,
            entity;

        if (!Ctor) { //undefined Ctor was passed in
            entityTypeName = this.grv.entityTypeName;
            EntityCtor = grv.getType(entityTypeName); //could return undefined
        }

        if (EntityCtor) { //if we have a constructor, new it up
            entity = new EntityCtor();
            entity.populateEntity(entityData);
        } else { //else just set the entity to the passed in data
            entity = entityData;
        }

        return entity;
    },

    addNew: function () {

        var entity = null,
            EntityCtor,
            entityTypeName = this.grv.entityTypeName; // this should be set in the 'DefineCollection' call, unless it was an anonymous definition

        if (entityTypeName) {
            EntityCtor = grv.getType(entityTypeName);
            entity = new EntityCtor();
            this.push(entity);
        }

        return entity;
    },

    //#region Loads
    load: function (options) {
        var self = this;

        self.grv.isLoading(true);

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        //if a route was passed in, use that route to pull the ajax options url & type
        if (options.route) {
            options.url = options.route.url || this.grvRoutes[options.route].url;
            options.type = options.route.method || this.grvRoutes[options.route].method; //in jQuery, the HttpVerb is the 'type' param
        }

        //sprinkle in our own handlers, but make sure the original still gets called
        var successHandler = options.success, 
            errorHandler = options.error;

        //wrap the passed in success handler so that we can populate the Entity
        options.success = function (data, options) {

            //populate the entity with the returned data;
            self.populateCollection(data);

            //fire the passed in success handler
            if (successHandler) { successHandler.call(self, data, options.state); }
            self.grv.isLoading(false);
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
            self.grv.isLoading(false);
        };

        grv.dataProvider.execute(options);

        if (options.async === false) {
            self.grv.isLoading(false);
        }
    },

    loadAll: function (success, error, state) {

        var options = {
            route: this.grvRoutes['loadAll']
        };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            grv.utils.extend(options, arguments[0]);
        } else {
            options.success = success;
            options.error = error;
            options.state = state;
        }

        this.load(options);
    },
    //#endregion Loads

    //#region Save
    save: function (success, error, state) {
        var self = this;

        self.grv.isLoading(true);

        var options = { success: success, error: error, state: state, route: self.grvRoutes['commit'] };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            grv.utils.extend(options, arguments[0]);
        }

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        //TODO: potentially the most inefficient call in the whole lib
        options.data = grv.utils.getDirtyGraph(self);

        if (options.data === null) {
            // there was no data to save
            if (options.async === false) {
                self.grv.isLoading(false);
                return;
            } else {
                options.success(null, options);
            }
        }

        if (options.route) {
            options.url = options.route.url;
            options.type = options.route.method;
        }

        var successHandler = options.success;
        var errorHandler = options.error;

        options.success = function (data, options) {
            self.grv.deletedEntities([]);
            self.populateCollection(data);
            if (successHandler) { successHandler.call(self, data, options.state); }
            self.grv.isLoading(false);
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
            self.grv.isLoading(false);
        };

        grv.dataProvider.execute(options);

        if (options.async === false) {
            self.grv.isLoading(false);
        }
    }
    //#endregion
};

grv.exportSymbol('grv.GroovsterEntityCollection', grv.GroovsterEntityCollection);
grv.exportSymbol('grv.GroovsterEntityCollection.markAllAsDeleted', grv.GroovsterEntityCollection.markAllAsDeleted);
grv.exportSymbol('grv.GroovsterEntityCollection.loadAll', grv.GroovsterEntityCollection.loadAll);
grv.exportSymbol('grv.GroovsterEntityCollection.load', grv.GroovsterEntityCollection.load);
grv.exportSymbol('grv.GroovsterEntityCollection.save', grv.GroovsterEntityCollection.save); 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\DefineEntity.js 
***********************************************/ 
﻿
grv.defineEntity = function (typeName, constrctor) {
    var isAnonymous = (typeof (typeName) !== 'string'),
        Ctor = isAnonymous ? arguments[0] : arguments[1];

    var GrvCtor = function (data) {
        this.grv = {};

        //MUST do this here so that obj.hasOwnProperty actually returns the keys in the object!
        Ctor.call(this);

        //call apply defaults here before change tracking is enabled
        this.applyDefaults();

        //call the init method on the base prototype
        this.init();

        // finally, if we were given data, populate it
        if (data) {
            this.populateEntity(data);
        }
    };

    //Setup the prototype chain correctly
    GrvCtor.prototype = new grv.GroovsterEntity();

    //add it to the correct namespace if it isn't an anonymous type
    if (!isAnonymous) {
        grv.generatedNamespace[typeName] = GrvCtor;
    }

    return GrvCtor;
};

grv.exportSymbol('grv.defineEntity', grv.defineEntity); 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\DefineCollection.js 
***********************************************/ 
﻿
grv.defineCollection = function (typeName, entityName) {
    var isAnonymous = (typeof (typeName) !== 'string'),
        ctorName = isAnonymous ? arguments[0] : arguments[1];

    var EsCollCtor = function (data) {

        var coll = new grv.GroovsterEntityCollection();

        //add the type definition;
        coll.grv.entityTypeName = ctorName;

        this.init.call(coll); //Trickery and sorcery on the prototype

        // make sure that if we were handed a JSON array, that we initialize the collection with it
        if (data) {
            coll.populateCollection(data);
        }

        return coll;
    };

    var F = function () {
        var base = this,
            extenders = [];

        this.init = function () {
            var self = this;

            //loop through the extenders and call each one
            ko.utils.arrayForEach(extenders, function (ext) {

                //make sure to set 'this' properly
                ext.call(self);
            });

            //loop through all the PROTOTYPE methods/properties and tack them on
            for (var prop in base) {
                if (base.hasOwnProperty(prop) && prop !== "init" && prop !== "customize") {

                    self[prop] = base[prop];

                }
            }

            this.isDirty = function () {
                var i,
                entity,
                arr = self(),
                dirty = false;

                if (this.grv.deletedEntities().length > 0) {
                    dirty = true;
                } else if (arr.length > 0 && arr[arr.length - 1].isDirty()) {
                    dirty = true;
                } else {
                    for (i = 0; i < arr.length; i++) {

                        entity = arr[i];

                        if (entity.RowState() !== grv.RowState.UNCHANGED) {
                            dirty = true;
                            break;
                        }
                    }
                }

                return dirty;
            };


            this.isDirtyGraph = function () {

                // Rather than just call isDirty() above we dup the logic here
                // for performance so we do not have to walk all of the entities twice
                var i,
                    entity,
                    arr = self(),
                    dirty = false;

                if (this.grv.deletedEntities().length > 0) {
                    dirty = true;
                } else if (arr.length > 0 && arr[arr.length - 1].isDirty()) {
                    dirty = true;
                } else {
                    for (i = 0; i < arr.length; i++) {

                        entity = arr[i];

                        if (entity.RowState() !== grv.RowState.UNCHANGED) {
                            dirty = true;
                            break;
                        } else {
                            dirty = entity.isDirtyGraph();
                            if (dirty === true) {
                                break;
                            }
                        }
                    }
                }

                return dirty;
            };
        };

        this.customize = function (customizer) {

            extenders.push(customizer);

        };
    };

    EsCollCtor.prototype = new F();

    //add it to the correct namespace if it isn't an anonymous type
    if (!isAnonymous) {
        grv.generatedNamespace[typeName] = EsCollCtor;
    }

    return EsCollCtor;
};

grv.exportSymbol('grv.defineCollection', grv.defineCollection);

 
 
 
/*********************************************** 
* FILE: ..\Src\Providers\AjaxProvider.js 
***********************************************/ 
﻿/*globals grv*/
/// <reference path="../Libs/jquery-1.9.0.min.js" />
/// <reference path="../Libs/json2.js" />

//set this up so we match jQuery's api style... if we want to rip it out later, we can...
grv.AjaxProvider = function () {
    var noop = function () { };
    var parameterizeUrl = function (url, data) {
        var rurlDataExpr = /\{([^\}]+)\}/g;
        var newUrl;

        if (typeof data === "string") {
            return;
        }

        //thanks AmplifyJS for this little tidbit
        // url = "/Product/{id}" => "/Product/57966910-C5EF-400A-8FC4-615159D95C2D
        newUrl = url.replace(rurlDataExpr, function (m, key) {
            if (key in data) {
                return ko.utils.unwrapObservable(data[key]);
            }
        });

        return newUrl;
    };


    this.execute = function (options) {
        var origSuccess = options.success || noop,
            origError = options.error || noop,
            defaults = {
                cache: false,
                contentType: 'application/json; charset=utf-8;',
                dataType: 'json',
                type: 'GET'
            };

        //extend the defaults with our options
        options = $.extend(defaults, options);

        // override the passed in successHandler so we can add global processing if needed
        options.success = function (data) {
            origSuccess(data, options);
        };

        // override the passed in errorHandler so we can add global processing if needed
        options.error = function (xhr, textStatus, errorThrown) {
            if (origError) {
                origError(xhr.status, xhr.responseText, options);
            } else {
                grv.onError({ code: xhr.status, message: xhr.responseText });
            }
        };

        // parameterize the Url
        // url = "/Product/{id}" => "/Product/57966910-C5EF-400A-8FC4-615159D95C2D
        options.url = parameterizeUrl(options.url, options.data);

        // don't json-ize a 'GET's data object bc jQuery $.param will do this automatically
        if (options.data && options.type !== 'GET') {
            options.data = ko.toJSON(options.data);
        }

        $.ajax(options);
    };
};
    

grv.dataProvider = new grv.AjaxProvider(); //assign default data provider 
}(window)); 
