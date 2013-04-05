var deviceIsOnLine = false;
var db;
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

function onDeviceReady() {
	var elem =  document.getElementById("content");
	elem.innerHTML = "The device is ready!!!";
	navigator.notification.alert( "The device is ready", function(){}, jsTitle, "Dale OK" );
	
	initializeDB();
	checkCotizadorData();
}

function onOnline() {
	deviceIsOnLine = true;
}

function onOffline() {
	deviceIsOnLine = false;
}

/**
 * Function to connect whit SQLite database
 */
function initializeDB() {
	db = window.openDatabase( dbName, dbDescription, dbVersion, dbSizeMB * 1024 * 1024 );
}

function checkCotizadorData() {
	$.ajax({
		url: 'http://www.cuencasbolivia.org/gapi/dataCotizador.json',
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
	//--console.log( data );
	
	db.transaction( checkCurrentTables, errorCB, successCB );
	
	if( !tablePackagesExists ) {
		db.transaction( createPackageTable, errorCB, successCB );
	}
	$("#loading").hide();
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

function errorCB( err ) {
	console.log( "There was an error procesing the sql query." );
}

function successCB() {
	console.log( "Transaction executed successfully" );
}