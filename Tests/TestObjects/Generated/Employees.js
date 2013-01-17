(function (grv) { //myNS = "myNameSpace" ... for example purposes

    if (typeof (grv) === undefined) {
        throw "Please Load EntitySpaces.Core First";
    }

    grv.objects.Employees = grv.defineEntity(function () {

        // core columns
        this.EmployeeID = ko.observable();
        this.LastName = ko.observable();
        this.FirstName = ko.observable();
        this.Title = ko.observable();
        this.TitleOfCourtesy = ko.observable();
        this.BirthDate = ko.observable();
        this.HireDate = ko.observable();
        this.Address = ko.observable();
        this.City = ko.observable();
        this.Region = ko.observable();
        this.PostalCode = ko.observable();
        this.Country = ko.observable();
        this.HomePhone = ko.observable();
        this.Extension = ko.observable();
        this.Photo = ko.observable();
        this.Notes = ko.observable();
        this.ReportsTo = ko.observable();
        this.PhotoPath = ko.observable();

        // Primary Key(s)
        this.grvPrimaryKeys = function () {
            return this.EmployeeID();
        }

        // extended columns
        this.grvExtendedData = undefined;

        // Hierarchical Properties
        this.EmployeesCollectionByReportsTo = grv.defineLazyLoader(this, 'EmployeesCollectionByReportsTo');
        this.UpToEmployeesByReportsTo = grv.defineLazyLoader(this, 'UpToEmployeesByReportsTo');
        this.UpToTerritoriesCollection = grv.defineLazyLoader(this, 'UpToTerritoriesCollection');
        this.EmployeeTerritoriesCollectionByEmployeeID = grv.defineLazyLoader(this, 'EmployeeTerritoriesCollectionByEmployeeID');
        this.OrdersCollectionByEmployeeID = grv.defineLazyLoader(this, 'OrdersCollectionByEmployeeID');
    });

    //#region Prototype Level Information

    grv.objects.Employees.prototype.grvTypeDefs = {
        EmployeesCollectionByReportsTo: "EmployeesCollection",
        UpToEmployeesByReportsTo: "Employees",
        UpToTerritoriesCollection: "TerritoriesCollection",
        EmployeeTerritoriesCollectionByEmployeeID: "EmployeeTerritoriesCollection",
        OrdersCollectionByEmployeeID: "OrdersCollection"
    };

    grv.objects.Employees.prototype.grvRoutes = {
        commit: { method: 'PUT', url: 'Employees_Save', response: 'entity' },
        loadByPrimaryKey: { method: 'GET', url: 'Employees_LoadByPrimaryKey', response: 'entity' },
        EmployeesCollectionByReportsTo: { method: 'GET', url: 'Employees_EmployeesCollectionByReportsTo', response: 'collection' },
        UpToEmployeesByReportsTo: { method: 'GET', url: 'Employees_UpToEmployeesByReportsTo', response: 'entity' },
        UpToTerritoriesCollection: { method: 'GET', url: 'Employees_UpToTerritoriesCollection', response: 'collection' },
        EmployeeTerritoriesCollectionByEmployeeID: { method: 'GET', url: 'Employees_EmployeeTerritoriesCollectionByEmployeeID', response: 'collection' },
        OrdersCollectionByEmployeeID: { method: 'GET', url: 'Employees_OrdersCollectionByEmployeeID', response: 'collection' }
    };

    grv.objects.Employees.prototype.grvColumnMap = {
        'EmployeeID': 1,
        'LastName': 1,
        'FirstName': 1,
        'Title': 1,
        'TitleOfCourtesy': 1,
        'BirthDate': 1,
        'HireDate': 1,
        'Address': 1,
        'City': 1,
        'Region': 1,
        'PostalCode': 1,
        'Country': 1,
        'HomePhone': 1,
        'Extension': 1,
        'Photo': 1,
        'Notes': 1,
        'ReportsTo': 1,
        'PhotoPath': 1
    };

    //#endregion

} (window.grv, window.myNS));

(function (grv) {

	grv.objects.EmployeesCollection = grv.defineCollection('EmployeesCollection', 'Employees');

	//#region Prototype Level Information

	grv.objects.EmployeesCollection.prototype.grvRoutes = {
		commit: { method: 'PUT', url: 'EmployeesCollection_Save', response: 'collection' },
		loadAll: { method: 'GET', url: 'EmployeesCollection_LoadAll', response: 'collection' }
	};

	//#endregion

}(window.grv, window.myNS));