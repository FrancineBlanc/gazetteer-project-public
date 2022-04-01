<?php
    include './envVariables.php';

    ini_set("display_errors", "on");

    error_reporting(E_ALL);

    $execution_start_time = microtime(true)/1000;

    $urls = [
        "geonamesCountryInfo" => "http://api.geonames.org/countryInfoJSON?lang=en&country=" . $_REQUEST["iso2CountryCode"] . "&username=$GEONAMES_USER",

        "restCountries" => "https://restcountries.com/v3.1/alpha/" . $_REQUEST["iso2CountryCode"],

        "geoDataSource" => "https://api.geodatasource.com/neighboring-countries?key=$GEODATA_KEY&format=json&country_code=" . $_REQUEST["iso2CountryCode"],

        "calendarific" => "https://calendarific.com/api/v2/holidays?&api_key=$CALENDARIFIC_KEY&country=" . $_REQUEST["iso2CountryCode"] . "&year=2021&type=national",

        "humanDevelopment" => "http://ec2-54-174-131-205.compute-1.amazonaws.com/API/HDRO_API.php/country_code=" . $_REQUEST["iso3CountryCode"] ."/indicator_id=120606,121106,69706,194506,195706,146206,103006/year=2019/structure=ciy",

        "newsApi" => "https://newsapi.org/v2/top-headlines?country=" . $_REQUEST["iso2CountryCode"] . "&apiKey=$NEWS_KEY",
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

    foreach ($curl_handles_array as $curl_handle_array) {
        $response[] = curl_multi_getcontent($curl_handle_array);
        curl_multi_remove_handle($curl_multi_init, $curl_handle_array);
    }

    $decoded_geonames_country_info = json_decode($response[0], true);

    $decoded_rest_countries = json_decode($response[1], true);

    $decoded_geodata_source = json_decode($response[2], true);

    $decoded_calendarific = json_decode($response[3], true);

    $decoded_human_development = json_decode($response[4], true);

    $decoded_news = json_decode($response[5], true);
    
    curl_multi_close($curl_multi_init);

    $news = array();

    $languages = array();
    
    foreach($decoded_news["articles"] as $article) {
        foreach ($article as $key => $value) {
            $news_object;
            if ($key == "source") {
                $news_object["name"] = $value["name"];
            }
            if ($key == "title" || $key == "description" || $key == "url") {
                $news_object[$key] = $value;
            }
        }
        array_push($news, $news_object);
    }

    foreach($decoded_rest_countries[0]["languages"] as $key => $value) {
        array_push($languages, $value);
    }

    $output["status"]["code"] = "200";

    $output["status"]["name"] = "ok";

    $output["status"]["description"] = "success!";

    $output["status"]["returnedIn"] = (microtime(true) - $execution_start_time)/100 . "ms";

    $output["data"]["countryName"] = $decoded_geonames_country_info["geonames"][0]["countryName"];

    $output["data"]["capital"] = $decoded_geonames_country_info["geonames"][0]["capital"];

    $output["data"]["continent"] = $decoded_geonames_country_info["geonames"][0]["continentName"];

    $output["data"]["currency"] = $decoded_geonames_country_info["geonames"][0]["currencyCode"];

    $output["data"]["population"] = $decoded_geonames_country_info["geonames"][0]["population"];

    $output["data"]["area"] = $decoded_geonames_country_info["geonames"][0]["areaInSqKm"];

    $output["data"]["languages"] = $languages;

    $output["data"]["callingCodes"] = $decoded_rest_countries[0]["idd"];

    $output["data"]["demonym"] = $decoded_rest_countries[0]["demonyms"]["eng"]["f"];

    $output["data"]["flag"] = $decoded_rest_countries[0]["flags"]["svg"];

    $output["data"]["countryLatLng"] = $decoded_rest_countries[0]["latlng"];

    $output["data"]["neighbours"] = $decoded_geodata_source;

    $output["data"]["holidayName"] = $decoded_calendarific["response"]["holidays"];

    $output["data"]["humanDevValues"] = $decoded_human_development;

    $output["data"]["topNews"] = $news;

    header("Content-type: application/json; charset=UTF-8");

    echo json_encode($output);

?>