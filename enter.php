<?php
include_once "db.php";

$auth=array("auth"=>false,"login"=>"");
$login = null;
if($_GET["login"]=="ssv"){
    $query = "SELECT `password` FROM `users` WHERE `login`='ssv'";
    $login = 'ssv';

}else if ($_GET["login"]=="msn"){
    $query = "SELECT * FROM `users` WHERE `login`='msn'";
    $login = 'msn';
}else{
    $auth['auth']=false;
    $auth["login"]=$login;
    $auth["msg"]="Пользователь ".$login." не найден";
    echo json_encode($auth);
    die();
}
$res = $mysql->query($query);
$row = $res->fetch_assoc();
$pass = null;
$user_id=0;
$user_title="";
while($row){
    $pass = $row['password'];
    $email = $row['email'];
    $user_id = $row['user_id'];
    $user_title = $row['title'];
    //echo 'password of user '.$login.': '.$pass;
    $row = $res->fetch_assoc();
}
$res->close();
$mysql->close();
if($_GET['password']==$pass){
    $auth['auth']=true;
    $auth["login"]=$login;
    $auth["user_id"] = $user_id;
    $auth["user_title"] = $user_title;
    $auth["msg"]="Авторизация для Пользователя ".$login." прошла успешно";
    echo json_encode($auth);
}
else{
    $auth['auth']=false;
    $auth["login"]=$login;
    $auth["msg"]="Неверный пароль для Пользователя ".$login;
    echo json_encode($auth);
}
