Global.socketToLH = undefined;
$(document).ready(function(){
    $('#panel').html('<h2 class="label label-lg label-warning">Попытка установить связь</h2>');
    Global.socketToLH = io('http://10.210.30.150:3000');

    Global.socketToLH.on("connect", function(){
        $('#panel').html('<h2 class="label label-lg label-success">Связь установлена</h2>');
    });
    Global.socketToLH.on("connect_error", function(){
        $('#panel').html('<h2 class="label label-lg label-danger">Связь не установлена</h2>');
        $('#tube1_val').text("---");
        $('#tube2_val').text("---");
        $('#tube3_val').text("---");
        $('#tube4_val').text("---");
        $('#tube1_pr_val').css("width","0%");
        $('#tube2_pr_val').css("width","0%");
        $('#tube3_pr_val').css("width","0%");
        $('#tube4_pr_val').css("width","0%");
    });
    Global.socketToLH.on("mb_error", function(){
        $('#panel').html('<h2 class="label label-lg label-danger">Ошибка Modbus протокола</h2>');
        $('#tube1_val').text("---");
        $('#tube2_val').text("---");
        $('#tube3_val').text("---");
        $('#tube4_val').text("---");
        $('#tube1_pr_val').css("width","0%");
        $('#tube2_pr_val').css("width","0%");
        $('#tube3_pr_val').css("width","0%");
        $('#tube4_pr_val').css("width","0%");
    });
    Global.socketToLH.on("mb_ok", function(){
        $('#panel').html('<h2 class="label label-lg label-danger">Связь c PLC установлена</h2>');
    });
    Global.socketToLH.on("heap", function(data){
        if(data){
            if(data.heapUsed){
                $("#server_heap").text(data.heapUsed);
                if(Global.TrendHeap.series[0].xData.length<300){
                    Global.TrendHeap.series[0].addPoint(data.heapUsed,true,false,false);
                }else{
                    Global.TrendHeap.series[0].addPoint(data.heapUsed,true,true,false);
                } 
            }
            if(data.heapTotal){
                $("#server_heapT").text(data.heapTotal);
                if(Global.TrendHeap.series[1].xData.length<300){
                    Global.TrendHeap.series[1].addPoint(data.heapTotal,true,false,false);
                }else{
                    Global.TrendHeap.series[1].addPoint(data.heapTotal,true,true,false);
                } 
            }
            if(data.sqlfree){
                $("#server_sqlfree").text(data.sqlfree);
            }
            if(data.sqlcon){
                $("#server_sqlcon").text(data.sqlcon);
            }
        }
        
    });
    Global.socketToLH.on("all_ok", function(data){
        $('#panel').html('<h2 class="label label-lg label-success">Система работает</h2>');
        if(data){           
            if(data.tube1){
                $('#tube1_val').text(data.tube1[1]);
                $('#tube1_pr_val').css("width",press2perc(data.tube1[1])+"%");
                
                if(Global.Trend1.series[0].xData.length<300){
                    Global.Trend1.series[0].addPoint(data.tube1,true,false,false);
                }else{
                    Global.Trend1.series[0].addPoint(data.tube1,true,true,false);
                } 
            }
            
            if(data.tube2){
                $('#tube2_val').text(data.tube2[1]);
                $('#tube2_pr_val').css("width",press2perc(data.tube2[1])+"%");
                
                if(Global.Trend2.series[0].xData.length<300){
                    Global.Trend2.series[0].addPoint(data.tube2,true,false,false);
                }else{
                    Global.Trend2.series[0].addPoint(data.tube2,true,true,false);
                }
            }
                
            if(data.tube3){
                $('#tube3_val').text(data.tube3[1]);
                $('#tube3_pr_val').css("width",press2perc(data.tube3[1])+"%");
                
                if(Global.Trend3.series[0].xData.length<300){
                    Global.Trend3.series[0].addPoint(data.tube3,true,false,false);
                }else{
                    Global.Trend3.series[0].addPoint(data.tube3,true,true,false);
                }
            }
                
            if(data.tube4){
                $('#tube4_val').text(data.tube4[1]);
                $('#tube4_pr_val').css("width",press2perc(data.tube4[1])+"%");
                
                if(Global.Trend4.series[0].xData.length<300){
                    Global.Trend4.series[0].addPoint(data.tube4,true,false,false);
                }else{
                    Global.Trend4.series[0].addPoint(data.tube4,true,true,false);
                }
            }
        }
    });
    Global.socketToLH.on("mqsql_error", function(){
        $('#panel').html('<h2 class="label label-lg label-danger">Ошибка Базы Данных</h2>');
        $('#tube1_val').text("---");
        $('#tube2_val').text("---");
        $('#tube3_val').text("---");
        $('#tube4_val').text("---");
        $('#tube1_pr_val').css("width","0%");
        $('#tube2_pr_val').css("width","0%");
        $('#tube3_pr_val').css("width","0%");
        $('#tube4_pr_val').css("width","0%");
    });
});
function press2perc(val){
    var min = 0.0;
    var max = 16.0;
    var desc = max/100;
    var cur = val/desc;
    //console.log(cur);
    return cur;
}
