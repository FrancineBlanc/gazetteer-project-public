<?php
    include './envVariables.php';

    ini_set("display_errors", "on");

    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $cities_array = $_REQUEST["citiesInfo"];

    $cities_array_length = count($cities_array);

    $results_array = array();

    for ($i = 0; $i < $cities_array_length; $i++) {
        $url = "https://api.tomtom.com/search/2/nearbySearch/.json?lat=" . $cities_array[$i]["lat"] . "&lon=" . $cities_array[$i]["lng"] . "&limit=25&radius=10000&language=en-GB&categorySet=9902%2C9927%2C7318%2C9362%2C8099%2C7376%2C7339&key=$TOMTOM_KEY";

        $curl_init_session = curl_init();

        curl_setopt($curl_init_session, CURLOPT_SSL_VERIFYPEER, false);

        curl_setopt($curl_init_session, CURLOPT_RETURNTRANSFER, true);

        curl_setopt($curl_init_session, CURLOPT_URL, $url);

        $curl_execute_session = curl_exec($curl_init_session);
        
        curl_close($curl_init_session);

        if (strpos($curl_execute_session, "summary") !== false) {
            array_push($results_array, $curl_execute_session);
        }
    }
    
    $city_landmarks = $results_array;

    $output["status"]["code"] = "200";
    
    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"] = $city_landmarks;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);
?>
