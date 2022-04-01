<?php
    $execution_start_time = microtime(true)/1000;

    $country_data = json_decode(file_get_contents("countryBorders.geo.json"), true);

    $countries = array();

    foreach ($country_data["features"] as $feature) {

        $country["iso2code"] = $feature["properties"]["iso_a2"];
        $country["iso3code"] = $feature["properties"]["iso_a3"];
        $country["name"] = $feature["properties"]["name"];
        array_push($countries, $country);
    }

    usort($countries, function ($countryA, $countryB) {
        return $countryA["name"] <=> $countryB["name"];
    });

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";
    
    $output["data"] = $countries;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);

?>