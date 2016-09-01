var Global = {};
Global.serverCon = false;
Global.conSockets = [];
Global.checkDBTimer = false;
Global.sendLock = false;
Global.SendQuery = false;
var modbus = require("jsmodbus");
var util = require("util");
var mysql = require("mysql");
var socketServ = require('socket.io').listen(3000);
var socketCl = require('socket.io-client')('http://10.210.30.148:3001');

//***********************WTD****************************
//WatchDog();

function WatchDog(){
    if(Global.serverCon){
        if(Global.SendQuery){
            Global.SendQuery = false;
            console.log("WTD ping");        
            checkDB();
        }
    }else{
        console.log("WTD: server not connected");
    }
    /*if(Global.SendQuery){
        console.log("SendQuery true");
        setTimeout(WatchDog, 1000);
    }else{
        setTimeout(WatchDog, 30000);
    }*/
    setTimeout(WatchDog, 30000);
};

//***********************CLIENT*************************

socketCl.on('connect', function(){
    console.log("client connected to server");
    setTimeout(checkDB,5000);
    socketCl.emit("id",{"name":"OPC_Prichal"});
    Global.serverCon = true;
});
socketCl.on('connect_error', function(){
    console.log("connect to server error");
    Global.serverCon = false;
});
socketCl.on('connect_timeout', function(){
    console.log("connect to server error by timeout");
    Global.serverCon = false;
});
socketCl.on('msg', function(data){
    console.log("data:"+data.data);
});
socketCl.on('replicateQ', function(){
    console.log("repl query");
    checkDB();
});
socketCl.on('free', function(data){
    console.log("free from 0 to "+data.lid+" ID on tube:"+data.tube);
    Global.freeLock = true;
    freenerDB(data.lid, data.tube);
});
socketCl.on('send_free', function(data){
    console.log("you may send stack");
    Global.sendLock = false;
    checkDB();
});

function checkDB(){
    console.log("check DB");
    var states = {
        tube1:false,
        tube2:false,
        tube3:false,
        tube4:false
    };
    var needSend = false;
    
    if(Global.serverCon){
        pool.getConnection(function(err, connection) {
            if(!err){
                var tmpReplQuery = "";
                tmpReplQuery = "SELECT * FROM `tube1_dump`";
                connection.query(tmpReplQuery,function(err,data,row){
                    if(data.length){
                        console.log("DB not empty rows on tube 1:"+data.length);
                        needSend = true;
                    }else{
                        console.log("DB empty tube 1");
                    }
                    states.tube1 = true;
                    checkIT();
                });
                tmpReplQuery = "SELECT * FROM `tube2_dump`";
                connection.query(tmpReplQuery,function(err,data,row){
                    if(data.length){
                        console.log("DB not empty rows on tube 2:"+data.length);
                        needSend = true;
                    }else{
                        console.log("DB empty tube 2");
                    }
                    states.tube2 = true;
                    checkIT();
                });
                tmpReplQuery = "SELECT * FROM `tube3_dump`";
                connection.query(tmpReplQuery,function(err,data,row){
                    if(data.length){
                        console.log("DB not empty rows on tube 3:"+data.length);
                        needSend = true;
                    }else{
                        console.log("DB empty tube 3");
                    }
                    states.tube3 = true;
                    checkIT();
                });
                tmpReplQuery = "SELECT * FROM `tube4_dump`";
                connection.query(tmpReplQuery,function(err,data,row){
                    if(data.length){
                        console.log("DB not empty rows on tube 4:"+data.length);
                        needSend = true;
                    }else{
                        console.log("DB empty tube 4");
                    }
                    states.tube4 = true;
                    checkIT();
                });
            }
            else{
                socketServ.sockets.emit("mysql_error",{});
            }
            connection.release();
        });
        function checkIT(){
            if(states.tube1 && states.tube2 && states.tube3 && states.tube4 && needSend){ //если где то не пусто запускаем репликатор
                console.log("data need send");
                replicator();
            }
            if(states.tube1 && states.tube2 && states.tube3 && states.tube4 && !needSend){ //если нет данных но стек закончен сбрасываем флаги
                console.log("data NOT need send");
            }
            if(states.tube1 && states.tube2 && states.tube3 && states.tube4){ //если нет данных но стек закончен сбрасываем флаги
                states.tube1 = false;
                states.tube2 = false;
                states.tube3 = false;
                states.tube4 = false;
                console.log("reset flags");
            }
            
        };
    }
};
function replicator(){
    var cont = {
        tube1:undefined,
        tube2:undefined,
        tube3:undefined,
        tube4:undefined,
    };
    pool.getConnection(function(err, connection) {
        if(!err){
            var tmpReplQuery = "";
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube1_dump` ORDER BY `id` ASC LIMIT 50'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length>0){
                    cont.tube1 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        socketCl.emit("replica",cont);
                    }else{
                        console.log("SEND LOCK tube 1");
                        Global.SendQuery = true;
                    }      
                    cont.tube1 = null;
                }                
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube2_dump` ORDER BY `id` ASC LIMIT 50'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length>0){
                    cont.tube2 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        socketCl.emit("replica",cont); 
                    }else{
                        console.log("SEND LOCK tube 2");
                        Global.SendQuery = true;
                    }        
                    cont.tube2 = null;
                }                
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube3_dump` ORDER BY `id` ASC LIMIT 50'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length){
                    cont.tube3 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        socketCl.emit("replica",cont);  
                    }else{
                        console.log("SEND LOCK tube 3");
                        Global.SendQuery = true;
                    }         
                    cont.tube3 = null;
                }
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube4_dump` ORDER BY `id` ASC LIMIT 50'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length){
                    cont.tube4 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        socketCl.emit("replica",cont); 
                    }else{
                        console.log("SEND LOCK tube 4");
                        Global.SendQuery = true;
                    }          
                    cont.tube4 = null;
                }
            });
        }else{
            socketServ.sockets.emit("mysql_error",{});
        }
        connection.release();
    });
};
function freenerDB(lid,tube){
    pool.getConnection(function(err, connection) {
        if(!err){
            var tmpReplQuery = "";
            tmpReplQuery = 'DELETE FROM `tube'+tube+'_dump` WHERE `utc`<='+lid; 
            //console.log(tmpReplQuery);
            connection.query(tmpReplQuery,function(err,data,row){
                if(err){
                    socketServ.sockets.emit("mysql_error",{});
                }else{
                    console.log("data free where utc < "+lid+"  on tube:"+tube);
                    //replica may be
                    socketCl.emit("free_free",{});
                    Global.freeLock = false;
                }
            });
        }else{
            console.log("freener ERROR");
            socketServ.sockets.emit("mysql_error",{});
            socketCl.emit("free_free",{});
            Global.freeLock = false;
        }
        connection.release();
    });
};

//***********************SERVER*************************

socketServ.on("connection",function(socket){
    console.log("client Front End connected");
});


//***********************OPC****************************

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
    //----------
    if(Global.schedullerTube){
            clearInterval(Global.schedullerTube);
            console.log("interval clear first reset");
        }
    if(Global.connection){
        Global.connection.release();
        Global.connection = null;
    }
    pool.getConnection(function(err, connection) {
        if(err){
            socketServ.sockets.emit("mysql_error",{});
            console.log("pool error");
        }else{
            socketServ.sockets.emit("all_ok",{});
             console.log("No error SQL {LOCAL} all ok");
            Global.connection = connection;
            Global.schedullerTube = setInterval(rcvTubes,1000);
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
        //console.log("1:"+res[0]+" 2:"+res[1]+" 3:"+res[2]+" 4:"+res[3]+" heap = "+process.memoryUsage().heapUsed);
        socketServ.emit("heap",process.memoryUsage());
        var nowdt = Date.now();
        FESender(res,nowdt);
        if(Global.serverCon){
            ServerSender(res,nowdt);
        }else{
            DBWriter(res,nowdt);
        }
    }).fail(function(e){
        console.log(e);
        if(Global.schedullerTube){
            clearInterval(Global.schedullerTube);
            console.log("interval clear RCV TUBES");
        }
        socketServ.sockets.emit("mb_error",{});
    });
};
//console.log("hello world");
//socketServ.sockets.emit("all_ok",{"tube1":[Number(nowdt),Number(tube1)]});
//----------------------------------
function DBWriter(data,nowdt){
    var tmpQ = "";
    /*if(Global.serverCon){
        console.log("Отправка данных Серверу WS");
        console.log(data);
        socketCl.emit("RTSend",{"tubes":data,"time":nowdt});
    }
    else{*/
        if(data!=undefined){
            if(data[0]!=undefined){
                tmpQ = "INSERT INTO `tube1_dump`(value,utc) VALUES("+data[0]+","+nowdt+")";
                Global.connection.query(tmpQ,function(err,data,row){
                    //console.log(data);
                    if(err){
                        console.log(err);
                        socketServ.emit("mysql_error",{});
                    }
                });
            }
            if(data[1]!=undefined){
                tmpQ = "INSERT INTO `tube2_dump`(value,utc) VALUES("+data[1]+","+nowdt+")";
                Global.connection.query(tmpQ,function(err,data,row){
                    //console.log(data);
                    if(err){
                        console.log(err);
                        socketServ.emit("mysql_error",{});
                    }
                });
            }
            if(data[2]!=undefined){
                tmpQ = "INSERT INTO `tube3_dump`(value,utc) VALUES("+data[2]+","+nowdt+")";
                Global.connection.query(tmpQ,function(err,data,row){
                    //console.log(data);
                    if(err){
                        console.log(err);
                        socketServ.emit("mysql_error",{});
                    }
                });
            }
            if(data[3]!=undefined){
                tmpQ = "INSERT INTO `tube4_dump`(value,utc) VALUES("+data[3]+","+nowdt+")";
                Global.connection.query(tmpQ,function(err,data,row){
                    //console.log(data);
                    if(err){
                        console.log(err);
                        socketServ.emit("mysql_error",{});
                    }
                });
            }
        }   
    };

function FESender(data,nowdt){
    socketServ.sockets.emit("all_ok",{
        "tube1":[nowdt,Number(data[0])],
        "tube2":[nowdt,Number(data[1])],
        "tube3":[nowdt,Number(data[2])],
        "tube4":[nowdt,Number(data[3])]
    });
};
function ServerSender(data,nowdt){
    console.log("Отправка данных Серверу WS");
    //console.log(util.inspect(data,{colors:true}));
    socketCl.emit("RTSend",{"tubes":data,"time":nowdt});
};


//--------------------------SUPPORT FUNC-------------------------
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