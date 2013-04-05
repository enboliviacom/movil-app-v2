var deviceIsOnLine = false;
var urlWebService = "http://www.cuencasbolivia.org/gapi/dataCotizador.json";
var db;
var parsedData;
var dbName = "cotizador";
var dbDescription = "Cotizador";
var dbVersion = "1.0";
var dbSizeMB = 7;
var tablePackages = "paquetes";
var tablePackagesExists = false;

function onLoad() {
	/*$.mobile.allowCrossDomainPages = true;
    $.support.cors = true;*/
    
	document.addEventListener( "deviceready", onDeviceReady, false );
	document.addEventListener( "online", onOnline, false );
	document.addEventListener( "offline", onOffline, false );
}

/**
 * Event listener called after the phonegap library is loaded
 */
function onDeviceReady() {
	/*var elem = document.getElementById("content");
	navigator.notification.alert( "The device is ready", function(){}, jsTitle, "Dale OK" );*/
	
	initializeDB();
	checkCotizadorData();
}

/**
 * Event listener called when the device has Internet connection
 */
function onOnline() {
	deviceIsOnLine = true;
}

/**
 * Event listener called when the device has not Internet connection
 */
function onOffline() {
	deviceIsOnLine = false;
}

/**
 * Function to connect whit SQLite database
 */
function initializeDB() {
	db = window.openDatabase( dbName, dbDescription, dbVersion, dbSizeMB * 1024 * 1024 );
}

/**
 * Function to check if there is new data to loaded in local database
 */
function checkCotizadorData() {
	$.ajax({
		url: urlWebService,
		dataType: 'json',
		success: parseAndSaveData,
		error: function(request, status, error) {
		      	console.log("Error status " + status);
		      	console.log("Error request status text: " + request.statusText);
		      	console.log("Error request status: " + request.status);
		      	console.log("Error request response text: " + request.responseText);
		      	console.log("Error response header: " + request.getAllResponseHeaders());
		    	}
	});
}

/**
 * Function to parse JSON format and save it into a database table
 * @param data, string-json
 */
function parseAndSaveData( data ) {
	parsedData = eval( '(' + JSON.stringify( data ) + ')' );
	
	db.transaction( checkCurrentTables, errorCB, successCB );
	
	if( !tablePackagesExists ) {
		db.transaction( createPackageTable, errorCB, successCB );
	}
	
	db.transaction( insertRecords, errorCB, successCB );
	$("#loading").hide();
}

/**
 * Function to insert records into local database
 * this function use the global variable 'parsedData'
 * @param tx
 */
function insertRecords( tx ) {
	var query = "";
	
	for( var i = 0; i < parsedData.length; i++ ) {
		query = "INSERT INTO " + tablePackages + "(title, description, modules, image, optional_modules, fixed_modules) VALUES(?,?,?,?,?,?)";
		tx.executeSql( query, [parsedData[i].p_titulo, parsedData[i].p_descripcion, parsedData[i].p_modulos, parsedData[i].p_imagen, parsedData[i].p_optionalmodules, parsedData[i].p_fixedmodules],
				function(){}, errorCB );
	}
}

/**
 * Function to create packages table and add to it and index 
 * @param tx. SQLTransaction object
 */
function createPackageTable( tx ) {
	var query = "CREATE TABLE IF NOT EXISTS " + tablePackages + " (" +
			"id INTEGER PRIMARY KEY AUTOINCREMENT, " +
			"title TEXT NOT NULL, description TEXT NULL, " +
			"modules TEXT NOT NULL, image TEXT NULL, " +
			"optional_modules TEXT NULL, fixed_modules TEXT NULL)";
	
	tx.executeSql( query, [], function ( tx, result ) {
		console.log( "Table " + tablePackages + " created successfully" );
	}, errorCB );
	
	query = "CREATE INDEX IF NOT EXISTS datatypes ON " + tablePackages + " (modules, optional_modules, fixed_modules)";
	
	tx.executeSql( query, [], function ( tx, result ) {
		console.log( "Index in " + tablePackages + " created successfully" );
	}, errorCB );
}

/**
 * Function to check if there are tables in the SQLite database
 * @param tx, SQLTransaction object
 */
function checkCurrentTables( tx ) {
	var query = "SELECT name FROM sqlite_master WHERE type='table'";
	
	tx.executeSql( query, [], function( tx, result ) {
		var len = result.rows.length;
		
		for( var i = 0; i < len; i++ ) {
			/* check if database table is already created */
			if( result.rows.item(i).name == tablePackages ) {
				tablePackagesExists = true;
				break;
			}
		}
	}, errorCB );
}

/**
 * Function executed when a SQL error ocurred
 */
function errorCB( err ) {
	console.log( "There was an error procesing the sql query." );
}

/**
 * Function executed when a SQL error is success
 */
function successCB() {
	console.log( "Transaction executed successfully" );
}