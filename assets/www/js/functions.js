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
var tableModules = "modulos";
var tableModulesExists = false;

function onLoad() {
	/*$.mobile.allowCrossDomainPages = true;
    $.support.cors = true;*/
    
	document.addEventListener( "deviceready", onDeviceReady, false );
	document.addEventListener( "online", onOnline, false );
	document.addEventListener( "offline", onOffline, false );
}

$( document ).bind( 'mobileinit', function(){
	$.mobile.allowCrossDomainPages = true;
	$.support.cors = true;
    
	console.log("jquery loaded");
    
	$.mobile.loader.prototype.options.text = "loading";
	$.mobile.loader.prototype.options.textVisible = false;
	$.mobile.loader.prototype.options.theme = "a";
	$.mobile.loader.prototype.options.html = "";
	
	$.mobile.loading( 'show', {
		text: 'loading...',
		textVisible: true,
		theme: 'a',
		html: ""
		} );
});

/*$(document).on("mobileinit", function() {
	//apply overrides here
	
	$.mobile.loader.prototype.options.text = "loading";
	$.mobile.loader.prototype.options.textVisible = true;
	
	$.mobile.loading( 'show', {
		text: 'loading...',
		textVisible: true,
		theme: 'a',
		html: ""
		} );
});*/

/**
 * Event listener called after the phonegap library is loaded
 */
function onDeviceReady() {
	/*var elem = document.getElementById("content");
	navigator.notification.alert( "The device is ready", function(){}, jsTitle, "Dale OK" );*/
	
	initializeDB();
	checkCotizadorData();
	console.log( "packages " + generatePackages + " -- detail " + generateDetail );
	if( generatePackages ) {
		getPackages();	
	}
	else if( generateDetail ) {
		var title = getLocalValue( 'title' );
		var cost = getLocalValue( 'cost' );
		var time = getLocalValue( 'time' );

		$( '#title_detail' ).html( title );
		$( "#packages" ).trigger( "refresh" );
		
		$( '#cost' ).val( cost );
		$( '#time' ).val( time );
		
		var modules = getLocalValue( 'modules' );
		modules = modules.split( '-' );
		getModules( modules[0], modules[1], modules[2] );
	}
	else if( contactPage ) {
		if( !deviceIsOnLine ) {
			navigator.notification.alert( "Su dispositivo no tiene conexi\u00f3n a Internet, por favor intente m\u00e1s adelante.", function() {
				window.location.href="paquetes.html";
			}, "Formulario de contactos", "Aceptar" );
		}
	}
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
	
	db.transaction( checkCurrentTables, errorCB, function() {
		console.log( "table[" + tablePackages + "] created: " + tablePackagesExists );
		if( !tablePackagesExists ) {
			db.transaction( createPackageTable, errorCB, successCB );
			db.transaction( insertPackages, errorCB, successCB );
		}
		
		console.log( "table[" + tableModules + "] created: " + tableModulesExists );
		if( !tableModulesExists ) {
			db.transaction( createModuleTable, errorCB, successCB );
			db.transaction( insertModules, errorCB, successCB );
		}
	
		$( '#preloader' ).hide();
	} );
}

/**
 * Function to insert record form modules into local database
 * this function use the global variable 'parsedData'
 * @param tx SQLTransaction object
 */
function insertModules( tx ) {
	var query = "";
	var localData = parsedData.modules;
	
	console.log( "Inserting data into " + tableModules + " table." );
	for( var i = 0; i < localData.length; i++ ) {
		query = "INSERT INTO " + tableModules + "(id_mod, title, description, cost, days, image) VALUES(?,?,?,?,?,?)";
		//--console.log( "query: " + query );
		tx.executeSql( query, [localData[i].id_modulos, localData[i].m_title, localData[i].m_desc_tec, localData[i].m_cost, localData[i].m_days, localData[i].m_imagen],
				function(){}, errorCB );
	}
}

/**
 * Function to insert records into local database
 * this function use the global variable 'parsedData'
 * @param tx
 */
function insertPackages( tx ) {
	var query = "";
	var localData = parsedData.packages;
	
	console.log( "Inserting data into " + tablePackages + " table." );
	for( var i = 0; i < localData.length; i++ ) {
		query = "INSERT INTO " + tablePackages + "(title, description, modules, image, optional_modules, fixed_modules, precio_total, tiempo_entrega) VALUES(?,?,?,?,?,?,?,?)";
		tx.executeSql( query, [localData[i].p_titulo, localData[i].p_descripcion, localData[i].p_modulos, localData[i].p_imagen, localData[i].p_optionalmodules, localData[i].p_fixedmodules, localData[i].p_preciototal, localData[i].p_tiempoentrega],
				function(){}, errorCB );
	}
}

/**
 * Function to return modules from DB
 */
function getModules( fixedModules, checkedModules, optionalModules ) {
	var query = "";
	
	initializeDB();
	
	db.transaction( function( tx ){
		var htmlContent = '';
		//$( "#fixed_modules" ).html( "" );
		//$( "#fixed_modules" ).trigger( "refresh" );
		
		/* Query for fixed modules */
		query = "SELECT * FROM " + tableModules + " WHERE id_mod IN (" + fixedModules + ")";
		
		tx.executeSql( query, [], function( tx, result ) {
			var len = result.rows.length;
			htmlContent = '<fieldset data-role="controlgroup" data-iconpos="right" id="fixed_modules">';
			for( var i = 0; i < len; i++ ) {
				//--console.log( "title: " + result.rows.item(i).title );
				//--htmlContent += '<li><a href="">' + result.rows.item(i).title + '</a></li>';
				
				htmlContent += '<input checked="checked" disabled="disabled" id="checkbox-mini-' + result.rows.item(i).id_mod + '"';
				htmlContent += ' onclick="changeValues( ' + result.rows.item(i).days + ', ' + result.rows.item(i).cost + ', \'checkbox-mini-' + result.rows.item(i).id_mod + '\' )" ';
				htmlContent += ' data-mini="true" type="checkbox">';

				htmlContent += '<label for="checkbox-mini-' + result.rows.item(i).id_mod + '" ><img src="images/modulos/hosting.png">' + result.rows.item(i).title + '</label>';
			}
			
			htmlContent += '</fieldset>';
			
			/*$( "#general_form" ).append( htmlContent );
			$( "#general_form" ).trigger( "create" );*/
			
			/* Query for checked modules */
			query = "SELECT * FROM " + tableModules + " WHERE id_mod IN (" + checkedModules + ")";
			
			tx.executeSql( query, [], function( tx, result ) {
				var len = result.rows.length;
				
				if( len > 0 ) {
					htmlContent += '<h4 class="heading-icon">M&oacute;dulos asignados</h4>';
					htmlContent += '<fieldset data-role="controlgroup" data-iconpos="right">';
					
					for( var i = 0; i < len; i++ ) {
						//--htmlContent += '<li><a href="">' + result.rows.item(i).title + '</a></li>';
						htmlContent += '<input checked="checked" id="checkbox-mini-' + result.rows.item(i).id_mod + '"';
						htmlContent += ' onclick="changeValues( ' + result.rows.item(i).days + ', ' + result.rows.item(i).cost + ', \'checkbox-mini-' + result.rows.item(i).id_mod + '\' )" ';
						htmlContent += ' data-mini="true" type="checkbox">';
						htmlContent += '<label for="checkbox-mini-' + result.rows.item(i).id_mod + '"><img src="images/modulos/hosting.png">' + result.rows.item(i).title + '</label>';
					}
					
					htmlContent += '</fieldset>';
				}
				
				/*$( "#general_form" ).append( htmlContent );
				$( "#general_form" ).trigger( "create" );*/
				
				/* Query for optional modules */
				query = "SELECT * FROM " + tableModules + " WHERE id_mod IN (" + optionalModules + ")";
				
				tx.executeSql( query, [], function( tx, result ) {
					var len = result.rows.length;
					
					if( len > 0 ) { 
						htmlContent += '<h4 class="heading-icon">M&oacute;dulos opcionales</h4>';
						htmlContent += '<fieldset data-role="controlgroup" data-iconpos="right">';
						
						for( var i = 0; i < len; i++ ) {
							htmlContent += '<input id="checkbox-mini-'+ result.rows.item(i).id_mod +'"';
							htmlContent += ' onclick="changeValues( ' + result.rows.item(i).days + ', ' + result.rows.item(i).cost + ', \'checkbox-mini-' + result.rows.item(i).id_mod + '\' )" ';
							htmlContent += ' data-mini="true" type="checkbox">';
							htmlContent += '<label for="checkbox-mini-'+ result.rows.item(i).id_mod +'"><img src="images/modulos/hosting.png">' + result.rows.item(i).title + '</label>';
						}
					
						htmlContent += '</fieldset>';
					}
					
					$( "#general_form" ).append( htmlContent );
					
					$( '#preloader' ).hide();
					
					$( "#general_form" ).trigger( "create" );

				}, errorCB );
			}, errorCB );
		}, errorCB );
	}, errorCB, successCB );
}

/**
 * Function to store values into the cellphone
 * @param key string, key to save value
 * @param value mixed, value to save
 */
function setLocalValue( key, value ) {
	window.localStorage.setItem( key, value );
	console.log("key: " + key + ", value: " + value);
	console.log( getLocalValue( key ) );
	window.location.href = "paquetes_detalle.html";
}

/**
 * Function to get a stored value
 * @param key string, value's key to return
 * @returns mixed
 */
function getLocalValue( key ) {
	return window.localStorage.getItem( key );
}

/**
 * Function to clear internal storage
 */
function clearLocalValue() {
	window.localStorage.clear();
}

function changeValues( time, cost, element ) {
	var cTime = parseFloat( $( '#time' ).val() );
	var cCost = parseFloat( $( '#cost' ).val() );
	
	/* add value to cost and time */
	if( $( '#' + element ).is( ':checked' ) ) {
		console.log( 'checked' );
		$( '#time' ).val( cTime + parseFloat( time ) );
		$( '#cost' ).val( cCost + parseFloat( cost ) );
		$( '#' + element ).attr( 'checked', true );
	}
	else {
		console.log( 'un checked' );
		$( '#time' ).val( cTime - parseFloat( time ) );
		$( '#cost' ).val( cCost - parseFloat( cost ) );
		$( '#' + element ).attr( 'checked', false );
	}
}

/**
 * Function to return packages from DB
 */
function getPackages() {
	var lImage;
	initializeDB();
	
	db.transaction( function( tx ) {
		tx.executeSql( "SELECT * FROM " + tablePackages, [], function( tx, result ) {
			var htmlContent = '';
			var len = result.rows.length;
			$("#packages").html( "" );
			
			for( var i = 0; i < len; i++ ) {
				for( var j = 0; j < imagesPack.length; j++ ) {
					if( imagesPack[j][0] == result.rows.item(i).id )
						lImage = imagesPack[j][1]; 
				}
				//--console.log( "title: " + result.rows.item(i).title );
				//--htmlContent += '<li><a href="#" onclick="getModules( \'' + result.rows.item(i).fixed_modules + '\', \'' + result.rows.item(i).modules + '\', \'' + result.rows.item(i).optional_modules + '\' )">' + result.rows.item(i).title + '</a></li>';
				htmlContent += '<li>';
				htmlContent += '<a href="#" onclick="';
				htmlContent += 'setLocalValue( \'modules\' , \'' + result.rows.item(i).fixed_modules + '-' + result.rows.item(i).modules + '-' + result.rows.item(i).optional_modules + '\');';
				htmlContent += 'setLocalValue( \'title\' , \'' + result.rows.item(i).title + '\' );';
				htmlContent += 'setLocalValue( \'cost\', ' + result.rows.item(i).precio_total + ' );';
				htmlContent += 'setLocalValue( \'time\', ' + result.rows.item(i).tiempo_entrega + ' )'
				htmlContent += '">';
				htmlContent += '<img src="images/' + lImage + '" width="80" />';
				htmlContent += '<h2>' + result.rows.item(i).title + '</h2>';
				htmlContent += '<p>' + result.rows.item(i).description + '<br /><span class="note">Precio: USD ' + result.rows.item(i).precio_total + '</span></p>';
				htmlContent += '</a>';
				htmlContent += '</li>';
			}
			
			$("#packages").html( $("#packages").html() + htmlContent );
			$("#packages").listview("refresh");
			
		}, errorCB );
	}, errorCB, successCB );
}

/**
 * Function to create modules table
 * @param tx, SQLTransaction object
 */
function createModuleTable( tx ) {
	var query = "CREATE TABLE IF NOT EXISTS " + tableModules + " (" +
			"id INTEGER PRIMARY KEY AUTOINCREMENT, " +
			"id_mod INTEGER NOT NULL, " +
			"title TEXT NOT NULL, description TEXT NULL, " +
			"cost REAL NULL, days INTEGER NULL, " +
			"image TEXT NULL)";
	
	tx.executeSql( query, [], function ( tx,  result ) {
		console.log( "Table " + tableModules + " created successfully" );
	}, errorCB );
	
	query = "CREATE INDEX IF NOT EXISTS id_mod ON " + tableModules + " (id_mod)";
	
	tx.executeSql( query, [], function ( tx, result ) {
		console.log( "Index in " + tableModules + " created successfully" );
	}, errorCB );
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
			"optional_modules TEXT NULL, fixed_modules TEXT NULL, " +
			"precio_total TEXT NULL, tiempo_entrega TEXT NULL)";
	
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
			}
			
			if( result.rows.item(i).name == tableModules ) {
				tableModulesExists = true;
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