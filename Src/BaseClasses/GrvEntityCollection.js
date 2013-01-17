/*globals grv*/
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