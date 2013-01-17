
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