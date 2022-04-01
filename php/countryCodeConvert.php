<?php
    ini_set("display_errors", "on");
    
    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $country_code = $_GET["iso3CountryCode"];

    $url = "https://francineblanc.github.io/Data/countryCodes.json";

    $curl_init_session = curl_init();

    curl_setopt($curl_init_session, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($curl_init_session, CURLOPT_RETURNTRANSFER, true);
    
    curl_setopt($curl_init_session, CURLOPT_URL, $url);

    $curl_execute_session = curl_exec($curl_init_session);

    curl_close($curl_init_session);

    $decode_json = json_decode($curl_execute_session, true);

    $selected_country_code = null;

    foreach ($decode_json as $key => $code) {
        if ($country_code == $key) {
            $selected_country_code = $code;
            break;
        }
    }

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"] = $selected_country_code;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);

?>