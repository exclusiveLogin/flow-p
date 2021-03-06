//ver 2.1 
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
var socketCl = false;

Global.sqlResetQuery = false;

function SocToNBRecon(){
    if(socketCl){
        console.log("SocketCL delete");
        //socketCl.disconnect();
        socketCl = null;
        Global.serverCon = false;
        setTimeout(SocToNBRecon,10000);
    }else{
        console.log("SocketCL init");
        socketCl = require('socket.io-client')('http://10.210.30.211:3001');
        //***********************CLIENT*************************

        socketCl.on('connect', function(){
            console.log("client connected to server");
            setTimeout(checkDB,10000);
            socketCl.emit("id",{"name":"OPC_Prichal"});
            Global.serverCon = true;
            sqlRelease();
            //console.log(util.inspect(socketCl,{colors:true}));
        });
        socketCl.on('discon', function(){
            console.log("discon emited");
            SocToNBRecon();
        });
        socketCl.on('connect_error', function(){
            console.log("connect to server error");
            Global.serverCon = false;
            //registerSQLLocal();
        });
        socketCl.on('connect_timeout', function(){
            console.log("connect to server error by timeout");
            Global.serverCon = false;
            //registerSQLLocal();
        });
        socketCl.on('msg', function(data){
            console.log("data:"+data.data);
        });
        socketCl.on('replicateQ', function(){
            console.log("repl query");
            checkDB();
        });
        socketCl.on('free', function(data){
            freenerDB(data.lid, data.tube);
        });
        socketCl.on('send_free', function(data){
            console.log("you may send stack");
            Global.sendLock = false;
            checkDB();
        });
    }
}
SocToNBRecon();//первичная инициация socket to NB

//---------WTD-----------
WatchDog();

function WatchDog(){
    //Global.sendLock = false;
    //Global.freeLock = false;
    if(Global.serverCon){
        if(Global.SendQuery){
            Global.SendQuery = false;
            console.log("WTD ping");        
            checkDB();
        }else{
            //console.log("WTD: no query");
        }
    }else{
        console.log("WTD: server not connected");
    }
    setTimeout(WatchDog, 30000);
};


//-------WDSQL------------



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
        if(!err && socketCl){
            var tmpReplQuery = "";
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube1_dump` ORDER BY `id` ASC LIMIT 1000'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length>0){
                    cont.tube1 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        if(socketCl){
                            socketCl.emit("replica",cont);
                        }
                    }else{
                        console.log("SEND LOCK tube 1 freelock:"+Global.freeLock+" sendlock:"+Global.sendLock);
                        Global.SendQuery = true;
                    }      
                    cont.tube1 = null;
                }                
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube2_dump` ORDER BY `id` ASC LIMIT 1000'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length>0){
                    cont.tube2 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        if(socketCl){
                            socketCl.emit("replica",cont); 
                        }
                    }else{
                        console.log("SEND LOCK tube 2 freelock:"+Global.freeLock+" sendlock:"+Global.sendLock);
                        Global.SendQuery = true;
                    }        
                    cont.tube2 = null;
                }                
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube3_dump` ORDER BY `id` ASC LIMIT 1000'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length){
                    cont.tube3 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        if(socketCl){
                            socketCl.emit("replica",cont);  
                        }
                    }else{
                        console.log("SEND LOCK tube 3 freelock:"+Global.freeLock+" sendlock:"+Global.sendLock);
                        Global.SendQuery = true;
                    }         
                    cont.tube3 = null;
                }
            });
            tmpReplQuery = 'SELECT *, DATE_FORMAT(`datetime`,"%s") AS `sec`, DATE_FORMAT(`datetime`,"%i") AS `min` FROM `tube4_dump` ORDER BY `id` ASC LIMIT 1000'; 
            connection.query(tmpReplQuery,function(err,data,row){
                if(data.length){
                    cont.tube4 = data;
                    if(!Global.sendLock && !Global.freeLock){
                        Global.sendLock = true;
                        if(socketCl){ 
                            socketCl.emit("replica",cont); 
                        }
                    }else{
                        console.log("SEND LOCK tube 4 freelock:"+Global.freeLock+" sendlock:"+Global.sendLock);
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
    Global.freeLock = true;
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
                    //socketCl.emit("free_free",{});
                    Global.freeLock = false;
                    Global.sendLock = false;
                    checkDB();
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

//---------SERVER----------

socketServ.on("connection",function(socket){
    console.log("client Front End connected");
});


//---------OPC--------------

var client = modbus.client.tcp.complete({ 
        'host'              : "10.210.30.214", 
        'port'              : "502",
        'autoReconnect'     : true,
        'reconnectTimeout'  : 1000,
        'timeout'           : 500,
        'unitId'            : 0
    });
//-------------------------POOL--------------------------
var pool;
function crPool(){
    pool  = mysql.createPool({
        connectionLimit : 5,
        host     : 'localhost',
        user     : 'root',
        password : '123',
        database : 'flow_p'
    });
}
crPool();//Первичная инициация pool

var resetPool = function(){
    if(!Global.sqlResetQuery){
        Global.sqlResetQuery = true;
        if(pool){
            console.log("pool established, reset success");
            pool.end(function(err){//delete pool
                pool = null;
                if(!err){
                    console.log("pool end without error");
                    crPool();
                    registerSQLLocal();
                }else{
                    console.log("pool end with ERROR");
                    console.log("ERROR:"+util.inspect(err,{colors:true}));
                }
                Global.sqlResetQuery = false;
            });
        }else{
            crPool();
            registerSQLLocal();
            console.log("pool not established, reset unsuccess");
        }
    }
}
var checkPool = function(str){
    if(pool){
        console.log(str+":");
        console.log("all con:"+util.inspect(pool._allConnections.length,{colors:true}));
        console.log("free con:"+util.inspect(pool._freeConnections.length,{colors:true}));
    }else{
        console.log("pool not defined");
    }
}

//----------------------------------------------------------
function registerSQLLocal(){
    if(!Global.sqlResetQuery){
        Global.sqlResetQuery = true;
        stopOPC();
        sqlRelease();
        pool.getConnection(function(err, connection) {
            if(err){
                console.log("pool register error");
                Global.sqlResetQuery = false;
                resetPool();
            }else{
                console.log("Register SQL local success");
                Global.connection = connection;
                Global.sqlResetQuery = false;
            }    
        });
    }
    
}

function sqlRelease(){
    if(Global.connection){
        Global.connection.release();
        Global.connection=null;
        console.log("local SQL connection reset");
    }else{
        console.log("SQLRelease:connection not found");
    }
}

function startOPC(){
    Global.schedullerTube = setInterval(rcvTubes,60);
    console.log("startOPC");
}
function stopOPC(){
    if(Global.schedullerTube){
        clearInterval(Global.schedullerTube);
        console.log("stop OPC");
    }
}

client.connect();

client.on('connect', function () {
    console.log("PLC connected");
    //registerSQLLocal();
    startOPC();
});

client.on('error', function (err) {
    socketServ.sockets.emit("mb_error",{});
    console.log("ERROR MODBUS");
    console.log(err);
    //sqlRelease();
    stopOPC();
});

//Prebuffer rcvTubes
Global.buffer_tube1 = [];
Global.buffer_tube2 = [];
Global.buffer_tube3 = [];
Global.buffer_tube4 = [];

Global.buffer_valmin = [];
Global.buffer_valmax = [];
Global.buffer_dtmin = [];
Global.buffer_dtmax = [];

Global.bufferLen = 10;
Global.bufferStep = 0;

function rcvTubes(){
    client.readInputRegisters(15, 8).then(function (resp) {
        Global.bufferStep++;
        var nowdt = Date.now();

        var res = [];
        var val = [];
        var timestamp = [];
        
        res[0] = WordToFloat(resp.register[1],resp.register[0]).toFixed(2); //tube1
        res[1] = WordToFloat(resp.register[3],resp.register[2]).toFixed(2); //tube2
        res[2] = WordToFloat(resp.register[5],resp.register[4]).toFixed(2); //tube3
        res[3] = WordToFloat(resp.register[7],resp.register[6]).toFixed(2); //tube4
        
        //console.log("1:"+res[0]+" 2:"+res[1]+" 3:"+res[2]+" 4:"+res[3]+" dt:"+nowdt+" heap = "+process.memoryUsage().heapUsed);
        
        
        if(Global.bufferStep == 1){
            //------------------------
            Global.buffer_valmax[0] = res[0];
            Global.buffer_valmax[1] = res[1];
            Global.buffer_valmax[2] = res[2];
            Global.buffer_valmax[3] = res[3];
            //------------------------
            Global.buffer_valmin[0] = res[0];
            Global.buffer_valmin[1] = res[1];
            Global.buffer_valmin[2] = res[2];
            Global.buffer_valmin[3] = res[3];
            //------------------------
            Global.buffer_dtmin[0] = nowdt;
            Global.buffer_dtmin[1] = nowdt;
            Global.buffer_dtmin[2] = nowdt;
            Global.buffer_dtmin[3] = nowdt;
            //------------------------
            Global.buffer_dtmax[0] = nowdt;
            Global.buffer_dtmax[1] = nowdt;
            Global.buffer_dtmax[2] = nowdt;
            Global.buffer_dtmax[3] = nowdt;
        }else{
            if(res[0]>Global.buffer_valmax[0]){
                Global.buffer_valmax[0] = res[0];
                Global.buffer_dtmax[0] = nowdt;
            }
            if(res[1]>Global.buffer_valmax[1]){
                Global.buffer_valmax[1] = res[1];
                Global.buffer_dtmax[1] = nowdt;
            }
            if(res[2]>Global.buffer_valmax[2]){
                Global.buffer_valmax[2] = res[2];
                Global.buffer_dtmax[2] = nowdt;
            }
            if(res[3]>Global.buffer_valmax[3]){
                Global.buffer_valmax[3] = res[3];
                Global.buffer_dtmax[3] = nowdt;
            }
            
            if(res[0]<Global.buffer_valmin[0]){
                Global.buffer_valmin[0] = res[0];
                Global.buffer_dtmin[0] = nowdt;
            }
            if(res[1]<Global.buffer_valmin[1]){
                Global.buffer_valmin[1] = res[1];
                Global.buffer_dtmin[1] = nowdt;
            }
            if(res[2]<Global.buffer_valmin[2]){
                Global.buffer_valmin[2] = res[2];
                Global.buffer_dtmin[2] = nowdt;
            }
            if(res[3]<Global.buffer_valmin[3]){
                Global.buffer_valmin[3] = res[3];
                Global.buffer_dtmin[3] = nowdt;
            }
        }
        //console.log("-----------------STEP: "+Global.bufferStep+"-----------------------");
        //console.log(util.inspect("max tubes:"+Global.buffer_valmax,{colors:true}));
        //console.log(util.inspect("min tubes:"+Global.buffer_valmin,{colors:true}));
        
        if(Global.bufferStep >= Global.bufferLen){
            //console.log("Step ping..."+Global.bufferStep);
            
            
            //отправка
            //console.log("-----------------SEND max----------------------");
            //console.log(util.inspect("max val:"+Global.buffer_valmax,{colors:true}));
            //console.log(util.inspect("dt:"+Global.buffer_dtmax,{colors:true}));
            //prepare send packet
            
            //отправка
            //console.log("-----------------SEND min----------------------");
            //console.log(util.inspect("min val:"+Global.buffer_valmin,{colors:true}));
            //console.log(util.inspect("td:"+Global.buffer_dtmin,{colors:true}));
                
            Global.bufferStep = 0;
            FESender(Global.buffer_valmax,Global.buffer_dtmax);
            FESender(Global.buffer_valmin,Global.buffer_dtmin);
            
            
            if(Global.serverCon){
                ServerSender(Global.buffer_valmax,Global.buffer_dtmax);
                ServerSender(Global.buffer_valmin,Global.buffer_dtmin);
            }else{
                if(Global.connection){
                    DBWriter(Global.buffer_valmax,Global.buffer_dtmax);
                    DBWriter(Global.buffer_valmin,Global.buffer_dtmin);
                }else{
                    registerSQLLocal();
                }
            } 
        }
        
    }).fail(function(e){
        console.log(e);
        stopOPC();
        socketServ.sockets.emit("mb_error",{});
    });
}; 
//----------------------------------
function DBWriter(data,nowdt){
    var tmpQ = "";
    if(data!=undefined){
        if(data[0]!=undefined){
            tmpQ = "INSERT INTO `tube1_dump`(value,utc) VALUES("+data[0]+","+nowdt[0]+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.emit("mysql_error",{});
                    registerSQLLocal();
                }
            });
        }
        if(data[1]!=undefined){
            tmpQ = "INSERT INTO `tube2_dump`(value,utc) VALUES("+data[1]+","+nowdt[1]+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.emit("mysql_error",{});
                    registerSQLLocal();
                }
            });
        }
        if(data[2]!=undefined){
            tmpQ = "INSERT INTO `tube3_dump`(value,utc) VALUES("+data[2]+","+nowdt[2]+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.emit("mysql_error",{});
                    registerSQLLocal();
                }
            });
        }
        if(data[3]!=undefined){
            tmpQ = "INSERT INTO `tube4_dump`(value,utc) VALUES("+data[3]+","+nowdt[3]+")";
            Global.connection.query(tmpQ,function(err,data,row){
                //console.log(data);
                if(err){
                    console.log(err);
                    socketServ.emit("mysql_error",{});
                    registerSQLLocal();
                }
            });
        }
    }   
};

function FESender(data,nowdt){
    socketServ.sockets.emit("all_ok",{
        "tube1":[nowdt[0],Number(data[0])],
        "tube2":[nowdt[1],Number(data[1])],
        "tube3":[nowdt[2],Number(data[2])],
        "tube4":[nowdt[3],Number(data[3])]
    });
    var heap = process.memoryUsage();
    if(pool){
        heap.sqlcon = pool._allConnections.length;
        heap.sqlfree = pool._freeConnections.length;
    }else{
        heap.sqlcon = 0;
        heap.sqlfree = 0;
    }
    
    socketServ.emit("heap",heap);
};
function ServerSender(data,nowdt){
    if(socketCl){
        //console.log("Отправка данных Серверу WS");
        //console.log(util.inspect(data,{colors:true}));
        socketCl.emit("RTSend",{"tubes":data,"time":nowdt});
    }else{
        console.log("ERR WS нет socketCL");
    }
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
