(function (grv) { //myNS = "myNameSpace" ... for example purposes

    if (typeof (grv) === undefined) {
        throw "Please Load EntitySpaces.Core First";
    }

    grv.objects.Orders = grv.defineEntity(function () {

        // core columns
        this.OrderID = ko.observable();
        this.CustomerID = ko.observable();
        this.EmployeeID = ko.observable();
        this.OrderDate = ko.observable();
        this.RequiredDate = ko.observable();
        this.ShippedDate = ko.observable();
        this.ShipVia = ko.observable();
        this.Freight = ko.observable();
        this.ShipName = ko.observable();
        this.ShipAddress = ko.observable();
        this.ShipCity = ko.observable();
        this.ShipRegion = ko.observable();
        this.ShipPostalCode = ko.observable();
        this.ShipCountry = ko.observable();

        // Primary Key(s)
        this.grvPrimaryKeys = function () {
            return this.OrderID();
        }

        // extended columns
        this.grvExtendedData = undefined;

        // Hierarchical Properties
        this.UpToProductsCollection = grv.defineLazyLoader(this, 'UpToProductsCollection');
        this.OrderDetailsCollectionByOrderID = grv.defineLazyLoader(this, 'OrderDetailsCollectionByOrderID');
        this.UpToCustomersByCustomerID = grv.defineLazyLoader(this, 'UpToCustomersByCustomerID');
        this.UpToEmployeesByEmployeeID = grv.defineLazyLoader(this, 'UpToEmployeesByEmployeeID');
        this.UpToShippersByShipVia = grv.defineLazyLoader(this, 'UpToShippersByShipVia');
    });

    //#region Prototype Level Information

    grv.objects.Orders.prototype.grvTypeDefs = {
        UpToProductsCollection: "ProductsCollection",
        OrderDetailsCollectionByOrderID: "OrderDetailsCollection",
        UpToCustomersByCustomerID: "Customers",
        UpToEmployeesByEmployeeID: "Employees",
        UpToShippersByShipVia: "Shippers"
    };

    grv.objects.Orders.prototype.grvRoutes = {
        commit: { method: 'PUT', url: 'Orders_Save', response: 'entity' },
        loadByPrimaryKey: { method: 'GET', url: 'Orders_LoadByPrimaryKey', response: 'entity' },
        UpToProductsCollection: { method: 'GET', url: 'Orders_UpToProductsCollection', response: 'collection' },
        OrderDetailsCollectionByOrderID: { method: 'GET', url: 'Orders_OrderDetailsCollectionByOrderID', response: 'collection' },
        UpToCustomersByCustomerID: { method: 'GET', url: 'Orders_UpToCustomersByCustomerID', response: 'entity' },
        UpToEmployeesByEmployeeID: { method: 'GET', url: 'Orders_UpToEmployeesByEmployeeID', response: 'entity' },
        UpToShippersByShipVia: { method: 'GET', url: 'Orders_UpToShippersByShipVia', response: 'entity' }
    };

    grv.objects.Orders.prototype.grvColumnMap = {
        'OrderID': 1,
        'CustomerID': 1,
        'EmployeeID': 1,
        'OrderDate': 1,
        'RequiredDate': 1,
        'ShippedDate': 1,
        'ShipVia': 1,
        'Freight': 1,
        'ShipName': 1,
        'ShipAddress': 1,
        'ShipCity': 1,
        'ShipRegion': 1,
        'ShipPostalCode': 1,
        'ShipCountry': 1
    };

    //#endregion

} (window.grv, window.myNS));

(function (grv) {

	grv.objects.OrdersCollection = grv.defineCollection('OrdersCollection', 'Orders');

	//#region Prototype Level Information

	grv.objects.OrdersCollection.prototype.grvRoutes = {
		commit: { method: 'PUT', url: 'OrdersCollection_Save', response: 'collection' },
		loadAll: { method: 'GET', url: 'OrdersCollection_LoadAll', response: 'collection' }
	};

	//#endregion

}(window.grv, window.myNS));