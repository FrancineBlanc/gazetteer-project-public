<?php
    include './envVariables.php';

    ini_set("display_errors", "on");

    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $url = "http://onyx6.co.uk/apis/geographical/cities?country=" . urlencode($_REQUEST["countryName"]) . "&key=$CITIES_KEY";

    $curl_init_session = curl_init();

    curl_setopt($curl_init_session, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($curl_init_session, CURLOPT_RETURNTRANSFER, true);

    curl_setopt($curl_init_session, CURLOPT_URL, $url);

    $curl_execute_session = curl_exec($curl_init_session);

    curl_close($curl_init_session);
    
    $decoded_cities = json_decode($curl_execute_session, true);

    $cities = array();

    foreach($decoded_cities["cities"] as $cityData) {
        if (isset($cityData["country"]) && $cityData["country"] == ($_REQUEST["countryName"])) {
            foreach($cityData as $key => $value) {
                $cityObject;
                if ($key == "city" || $key == "lat" || $key == "lng" || $key == "population") {
                    $cityObject[$key] = $value;
                }
            }
            array_push($cities, $cityObject);
        }
    }

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["cities"] = $cities;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);
?>