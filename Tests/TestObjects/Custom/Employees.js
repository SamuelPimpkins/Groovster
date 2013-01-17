/* File Created: December 22, 2011 */

// Custom Properties goes in the "customize" method and this is called for you automatically
grv.objects.Employees.prototype.customize(function () {

    // You can add any number of extra properties of any type in here
    this.OtherEmployeeID = ko.observable();

});

grv.objects.EmployeesCollection.prototype.myMethod = function () {
    return 2;
};