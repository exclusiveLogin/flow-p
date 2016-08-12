<?php
  
require_once("db.php");
$query = "SELECT * FROM `tube1_dump`";
$res = $mysql->query($query);
$row = $res->fetch_assoc();
echo "[";
while($row){
    echo json_encode($row);
    $row = $res->fetch_assoc();
    if($row)echo ",";
}
echo "]";