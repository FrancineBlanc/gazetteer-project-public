<?php
    include './envVariables.php';

    ini_set("display_errors", "on");

    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $url = "http://api.ipstack.com/check?access_key=$IPINFO_KEY";

    $curl_init_session = curl_init();

    curl_setopt($curl_init_session, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($curl_init_session, CURLOPT_RETURNTRANSFER, true);

    curl_setopt($curl_init_session, CURLOPT_URL, $url);

    $curl_execute_session = curl_exec($curl_init_session);

    curl_close($curl_init_session);
    
    $decode_json = json_decode($curl_execute_session, true);

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"] = $decode_json;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);
?>