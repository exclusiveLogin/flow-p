var Global = {};
Global.conSockets = [];
var modbus = require("jsmodbus");
var mysql = require("mysql");
var socketServ = require('socket.io').listen(3000);
var socketCl = require('socket.io-client')('http://10.210.30.148:8000');
socketCl.on('connect', function(){
    console.log("client connected to server");
});
socketCl.on('connect_error', function(){
    console.log("client error");
});
socketCl.on('connect_timeout', function(){
    console.log("client timeout");
});
socketCl.on('msg', function(data){
    console.log("data:"+data.data);
});

socketServ.on("connection",function(socket){
    console.log("client FE connected");
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

client.connect();


pool.on("connection", function(connection){
    console.log("con event start");
})

// reconnect with client.reconnect()

client.on('connect', function () {
    console.log("PLC connected");
    pool.getConnection(function(err, connection) {
        if(err){
            socketServ.sockets.emit("mysql_error",{});
        }else{
            socketServ.sockets.emit("all_ok",{});
            Global.connection = connection;
            Global.schedullerTube = setInterval(function(){
                rcvTubes();  
                //console.log(process.memoryUsage().heapUsed);
            },1000);
        }    
    });
});

client.on('error', function (err) {
    socketServ.sockets.emit("mb_error",{});
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
    client.readInputRegisters(15, 8).then(function (resp) {
        //console.log(resp);
        var res = [];
        res[0] = WordToFloat(resp.register[1],resp.register[0]).toFixed(2);
        res[1] = WordToFloat(resp.register[3],resp.register[2]).toFixed(2);
        res[2] = WordToFloat(resp.register[5],resp.register[4]).toFixed(2);
        res[3] = WordToFloat(resp.register[7],resp.register[6]).toFixed(2);
        console.log("1:"+res[0]+" 2:"+res[1]+" 3:"+res[2]+" 4:"+res[3]+" heap = "+process.memoryUsage().heapUsed);
        var nowdt = Date.now();
        DBWriter(res,nowdt);
    }).fail(function(e){
        if(Global.schedullerTube){
            clearInterval(Global.schedullerTube);
        }
        socketServ.sockets.emit("mb_error",{});
    });
};
//console.log("hello world");
//socketServ.sockets.emit("all_ok",{"tube1":[Number(nowdt),Number(tube1)]});
//----------------------------------
function DBWriter(data,nowdt){
    var tmpQ = "";
    if(data!=undefined){
        if(data[0]!=undefined){
            tmpQ = "INSERT INTO `tube1_dump`(value,utc) VALUES("+data[0]+","+nowdt+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.sockets.emit("mysql_error",{});
                }
            });
        }
        if(data[1]!=undefined){
            tmpQ = "INSERT INTO `tube2_dump`(value,utc) VALUES("+data[1]+","+nowdt+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.sockets.emit("mysql_error",{});
                }
            });
        }
        if(data[2]!=undefined){
            tmpQ = "INSERT INTO `tube3_dump`(value,utc) VALUES("+data[2]+","+nowdt+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.sockets.emit("mysql_error",{});
                }
            });
        }
        if(data[3]!=undefined){
            tmpQ = "INSERT INTO `tube4_dump`(value,utc) VALUES("+data[3]+","+nowdt+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.sockets.emit("mysql_error",{});
                }
            });
        }
    }
    FESender(data,nowdt);
};
function FESender(data,nowdt){
    //nowdt = Number(nowdt);
    socketServ.sockets.emit("all_ok",{
        "tube1":[nowdt,Number(data[0])],
        "tube2":[nowdt,Number(data[1])],
        "tube3":[nowdt,Number(data[2])],
        "tube4":[nowdt,Number(data[3])]
    });
};
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
	};