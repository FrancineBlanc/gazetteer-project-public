<?php

    $execution_start_time = microtime(true)/1000;

    $chosen_country = $_GET["selectedCountry"];
    
    $country_data = json_decode(file_get_contents("https://francineblanc.github.io/Data/countries.json"), true);

    $selected_country = null;
    
    foreach ($country_data["features"] as $feature) {
        if ($chosen_country == $feature["properties"]["ISO_A3"]){
            $selected_country = $feature;
            break;
        }
    }

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"] = $selected_country;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);
    
?>