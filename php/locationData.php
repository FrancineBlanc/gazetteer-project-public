<?php
    include './envVariables.php';

    ini_set("display_errors", "on");

    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $urls = [

        "openWeatherMap" => "http://api.openweathermap.org/data/2.5/weather?lat=" . $_REQUEST["lat"] . "&lon=" . $_REQUEST["lng"] . "&appid=$OPEN_WEATHER_KEY",

        "openCage" => "https://api.opencagedata.com/geocode/v1/json?key=$OPEN_CAGE_KEY&q=" . $_REQUEST["lat"] . "," . $_REQUEST["lng"] . "&pretty=1",

        "geonamesPopulation" => "http://api.geonames.org/extendedFindNearbyJSON?lat=" . $_REQUEST["lat"] . "&lng=" . $_REQUEST["lng"] . "&username=$GEONAMES_USER",

        "geonamesWiki" => "http://api.geonames.org/findNearbyWikipediaJSON?lat=" . $_REQUEST["lat"] . "&lng=" . $_REQUEST["lng"] . "&username=$GEONAMES_USER",
    ];

    $curl_multi_init = curl_multi_init();

    $curl_handles_array = array();

    foreach ($urls as $key => $url) {

        $curl_init_session = curl_init();
        curl_setopt($curl_init_session, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl_init_session, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl_init_session, CURLOPT_URL, $url);
        $curl_handles_array[$url] = $curl_init_session;
        curl_multi_add_handle($curl_multi_init, $curl_init_session);
    }

    $active = null;

    do {
        $curl_multi_exec = curl_multi_exec($curl_multi_init, $active);
    }
    while ($curl_multi_exec == CURLM_CALL_MULTI_PERFORM);

    while ($active && $curl_multi_exec == CURLM_OK) {
        if (curl_multi_select($curl_multi_init) != -1) {
            do {
                $curl_multi_exec = curl_multi_exec($curl_multi_init, $active);
            }
            while ($curl_multi_exec == CURLM_CALL_MULTI_PERFORM);
        }
    }

    $response;

    foreach ($curl_handles_array as $curl_handle) {
        $response[] = curl_multi_getcontent($curl_handle);
        curl_multi_remove_handle($curl_multi_init, $curl_handle);
    }

    $decoded_open_weather = json_decode($response[0], true);

    $decoded_open_cage = json_decode($response[1], true);

    $decoded_geonames_population = json_decode($response[2], true);

    $decoded_geonames_wikipedia = json_decode($response[3], true);
    
    curl_multi_close($curl_multi_init);

    $population;

    foreach ($decoded_geonames_population["geonames"] as $area) {
        foreach ($area as $key => $value) {
            if ($key == "adminCode1" && $value == "00") {
                $population = $area["population"];
            }
        }
    }

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"]["weather"] = $decoded_open_weather["weather"][0]["main"];

    $output["data"]["weather_icon"] = "https://openweathermap.org/img/wn/" . $decoded_open_weather["weather"][0]["icon"] . ".png";
    
    $output["data"]["timezone"] = $decoded_open_cage["results"][0]["annotations"]["timezone"]["offset_string"];

    $output["data"]["timezone_name"] = $decoded_open_cage["results"][0]["annotations"]["timezone"]["short_name"];
    
    $output["data"]["iso_code"] = $decoded_open_cage["results"][0]["components"]["ISO_3166-1_alpha-3"];

    $output["data"]["population"] = $population;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);

?>
