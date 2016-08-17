Global.authkey=false;
Global.loginData={
    "login":"",
    "password":""
};
Global.bugFixEv = new Event("resize");

function tooltipHandler() {
    $("[data-tooltip]").mousemove(function (eventObject) {

        var data_tooltip = $(this).attr("data-tooltip");

        $("#tooltip").text(data_tooltip)
            .css({
                "top" : eventObject.pageY + 10,
                "left" : eventObject.pageX + 10
            })
            .show();

    }).mouseout(function () {

        $("#tooltip").hide()
            .text("")
            .css({
                "top" : 0,
                "left" : 0
            });
    });
}
$(document).ready(function(){
    Global.jqready = true;

    Global.authkey = true;
    Global.loggedAs = "ssv";

    refreshLog();
    $.ajaxSetup({
        cache:false
    });
    $('.btnlogin').on('click',function(){
        $(this).addClass('disabled active');
        $('#loginform').show(500);
    });
    $('#btnloginenter').on('click',function(){
        Global.loginData.login = $('#loginName').val();
        Global.loginData.password = $('#passwordName').val();
        $.ajax({
            url:"/enter.php",
            dataType:"json",
            method:'GET',
            data:Global.loginData,
            success:function(data){
                if(data.auth)userEnter(data.login);
                loginToggle(0);
                if(data.msg){
                    var state = false;
                    if(data.auth){
                        state=true;
                    } 
                    showSysMsg(data.msg,state);
                }
                refreshLog();
            },
            error:function(){
                console.log("error to load auth ajax");
            }
        });
    });
    $('.btnlogincl').on('click',function(){
        $('.btnlogin').removeClass('disabled active');
        $('#loginform').hide(500);
    });
    $('.btnlogout').on('click',function(){
        Global.authkey = false;
        Global.loggedAs = "";
        showSysMsg("Вы успешно вышли из системы",true);
        refreshLog();
    });
    $('.btn-arj-tube').on('click',function(){
        var num = $(this).data("num");
        console.log("btn_tube num = "+num);
        if(num){
            trendToggle(true,num);
        }
    });
    $('#btn_close_analize').on('click',function(){
        trendToggle(0);
    });
    $('#btn_close_result').on('click',function(){
        resultToggle(0);
    });
    $('#btn_calc').on('click',function(){
        resultToggle(1);
    });
});
function userEnter(user) {
    Global.authkey=true;
    Global.loggedAs = user;
}
function showSysMsg(msg,state) {
    if(state){
        $("#sysmsg").removeClass("sys_err");
        $("#sysmsg").addClass("sys_ok");
    }
    else {
        $("#sysmsg").removeClass("sys_ok");
        $("#sysmsg").addClass("sys_err");
    }
    //$("#sysmsg").show();
    $("#sysmsg").removeClass("myhide");
    $("#sysmsg_val").html(msg);
    setTimeout(hideSysMsg,5000);
    function hideSysMsg() {
        $("#sysmsg").addClass("myhide");
        
    }
    
}