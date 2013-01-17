
//override the standard Ajax Provider
//all you need to do is overwrite the 'execute' function in your test!
grv.testDataProvider = {

    execute: function (options) {

    }

};

grv.dataProvider = grv.testDataProvider;

