var deviceIsOnLine = false;
var db;

function onLoad() {
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

function initializeDB() {
	db = window.openDatabase( "cotizador", "1.0", "Cotizador", 7000000 );
}

function checkCotizadorData() {
	$.ajax({
		url: 'http://localhost.enbolivia/dataCotizador.php',
		dataType: 'json',
		success: parseAndSaveData,
		error: function ( data ) { console.log( "There was an error when the app tried to get new data." ) }
	});
}

function parseAndSaveData( data ) {
	console.log( data );
}