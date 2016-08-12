<?php
$logindb="root";
$passdb="123";
$dbhost="localhost";
$dbname="flow_p";
$mysql= new mysqli($dbhost,$logindb,$passdb,$dbname);
if($mysql->connect_errno){
    die('{"errors":true,"errormsg":"error db":"'.$mysql->connect_error.'"}');
}
$mysql->query("SET NAMES 'UTF8';");