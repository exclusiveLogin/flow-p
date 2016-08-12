var Global = {};
var modbus = require("jsmodbus");
var mysql = require("mysql");
var socket = require('socket.io-client')('http://10.210.30.148:8080');
socket.on('connect', function(){
    console.log("client connected to server");
});
socket.on('connect_error', function(){
    console.log("client error");
});
socket.on('connect_timeout', function(){
    console.log("client timeout");
});
socket.on('msg', function(data){
    console.log("data:"+data.data);
});

var client = modbus.client.tcp.complete({ 
        'host'              : "10.210.30.116", 
        'port'              : "502",
        'autoReconnect'     : true,
        'reconnectTimeout'  : 1000,
        'timeout'           : 500,
        'unitId'            : 0
    });
var pool  = mysql.createPool({
    connectionLimit : 5,
    host     : 'localhost',
    user     : 'root',
    password : '123',
    database : 'flow_p'
});

//client.connect();


pool.on("connection", function(connection){
    console.log("con event start");
})

// reconnect with client.reconnect()

client.on('connect', function () {
    console.log("connected");
    pool.getConnection(function(err, connection) {
        Global.connection = connection;
        Global.schedullerTube = setInterval(function(){
            rcvTubes();            
        },3000);
    });
});

client.on('error', function (err) {
    console.log("ERROR MODBUS");
    console.log(err);
    if(Global.connection){
        Global.connection.release();
        Global.connection=null;
    }
    if(Global.schedullerTube){
        clearInterval(Global.schedullerTube);
    }
});

function rcvTubes(){
    client.readInputRegisters(15, 2).then(function (resp) {
        console.log(resp);
        var tube1 = WordToFloat(resp.register[1],resp.register[0]).toFixed(2);
        console.log("tube1 = "+tube1);
        var tmpQ = "INSERT INTO `tube1_dump`(value) VALUES("+tube1+")";
        console.log(tmpQ);
        Global.connection.query(tmpQ,function(err,data,row){
            console.log(data);
        });
    }).fail(function(e){
        console.log("fail");
        console.log(e);
    });
};
//console.log("hello world");
//----------------------------------
function WordToFloat( $Word1, $Word2 ) {
		/* Conversion selon presentation Standard IEEE 754 
		/    seeeeeeeemmmmmmmmmmmmmmmmmmmmmmm   
		/    31                             0  
		/    s = sign bit, e = exponent, m = mantissa
		*/
		var DBL_MAX = 99999999999999999;

		$src = ( ($Word1 & 0x0000FFFF) << 16) + (($Word2 & 0x0000FFFF) );

		$s = Boolean($src >> 31);
		$e = ($src & 0x7F800000) >> 23;
		$f = ($src & 0x007FFFFF);
		
		//var_dump($s);
		//echo "<br>";
		//var_dump($e);
		//echo "<br>";
		//var_dump($f);
		//echo "<br>";

		if ($e == 255 && $f != 0) {
			 /* NaN - Not a number */
			 $value = DBL_MAX;
		} else if ($e == 255 && $f == 0 && $s) {
			/* Negative infinity */
			$value = -DBL_MAX;
		} else if ($e == 255 && $f == 0 && !$s) {
			/* Positive infinity */
			$value = DBL_MAX;
	   } else if ($e > 0 && $e < 255) {
			/* Normal number */
			$f += 0x00800000;
			if ($s) $f = -$f;
			$value = $f * Math.pow(2, $e - 127 - 23);
		} else if ($e == 0 && $f != 0) {
			/* Denormal number */
			if ($s) $f = -$f;
			$value = $f * Math.pow(2, $e - 126 - 23);
		} else if ($e == 0 && $f == 0 && $s) {
			/* Negative zero */
			$value = 0;
		} else if ($e == 0 && $f == 0 && !$s) {
			/* Positive zero */
			$value = 0;
		} else {
			/* Never happens */
		}

	   return $value;
	}