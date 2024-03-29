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
