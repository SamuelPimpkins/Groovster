grv.grvLazyLoader = function (entity, propName) {

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