(function (grv) { //myNS = "myNameSpace" ... for example purposes

	if (typeof (grv) === undefined) {
		throw "Please Load EntitySpaces.Core First";
	}

	grv.objects.OrderDetails = grv.defineEntity(function () {

		// core columns
		this.OrderID = ko.observable();
		this.ProductID = ko.observable();
		this.UnitPrice = ko.observable();
		this.Quantity = ko.observable();
		this.Discount = ko.observable();

		this.grvPrimaryKeys = function() {
			var val = {data: {}};
			val.data.orderID = this.OrderID();
			val.data.productID = this.ProductID();
			return val;
		};

		// extended columns
		this.grvExtendedData = undefined;

		// Hierarchical Properties
		this.UpToOrdersByOrderID = grv.defineLazyLoader(this, 'UpToOrdersByOrderID');
		this.UpToProductsByProductID = grv.defineLazyLoader(this, 'UpToProductsByProductID');
	});

	//#region Prototype Level Information

	grv.objects.OrderDetails.prototype.grvTypeDefs = {
		UpToOrdersByOrderID: "Orders",
		UpToProductsByProductID: "Products"
	};

	grv.objects.OrderDetails.prototype.grvRoutes = {
		commit: { method: 'PUT', url: 'OrderDetails_Save', response: 'entity' },
		loadByPrimaryKey: { method: 'GET', url: 'OrderDetails_LoadByPrimaryKey', response: 'entity' },
		UpToOrdersByOrderID: { method: 'GET', url: 'OrderDetails_UpToOrdersByOrderID', response: 'entity'},
		UpToProductsByProductID: { method: 'GET', url: 'OrderDetails_UpToProductsByProductID', response: 'entity'}
	};

	grv.objects.OrderDetails.prototype.grvColumnMap = {
		'OrderID': 1,
		'ProductID': 1,
		'UnitPrice': 1,
		'Quantity': 1,
		'Discount': 1
	};

	//#endregion

}(window.grv, window.myNS));

(function (grv) {

	grv.objects.OrderDetailsCollection = grv.defineCollection('OrderDetailsCollection', 'OrderDetails');

	//#region Prototype Level Information

	grv.objects.OrderDetailsCollection.prototype.grvRoutes = {
		commit: { method: 'PUT', url: 'OrderDetailsCollection_Save', response: 'collection' },
		loadAll: { method: 'GET', url: 'OrderDetailsCollection_LoadAll', response: 'collection' }
	};

	//#endregion

}(window.grv, window.myNS));