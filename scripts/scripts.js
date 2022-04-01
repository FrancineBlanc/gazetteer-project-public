$(window).on("load", function () {
    $(".spinner-border").hide();
    if ($("#preloader").length) {
        $("#preloader").delay(3000).fadeOut("slow", function () {
            $(this).remove();
        });
    }
});

$(document).ready(function () {
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, useIp, { timeout: 7000 });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    const myMap = L.map("mainMapId", { tap: false }).setView([51.01, -0.09], 5).locate({ setView: true, maxZoom: 5 });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 19,
    }).addTo(myMap);

    let latLong = {};
    function showPosition(position) {
        latLong.latitude = position.coords.latitude;
        latLong.longitude = position.coords.longitude;
        returnlocalData();
    }

    function useIp() {
        $.ajax({
            url: "./php/ipInfo.php",
            type: "GET",
            dataType: "json",
            success: function (result) {
                if (result.status.name == "ok") {
                    latLong.latitude = result["data"]["latitude"];
                    latLong.longitude = result["data"]["longitude"];
                    returnlocalData();
                } else {
                    $("#content").html(result.data.status.message);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            }
        });
    }

    getLocation();

    let userSelectedCountry;
    let iso3Code;
    
    $.ajax({
        url: "./php/countryBorders.php",
        type: "GET",
        dataType: "json",
        success: function (result) {
            $.each(result.data, function (index, value) {
                $("#countries").append(`<option value=${value["iso3code"]}>${value["name"]}</option>`);
            });
            iso3Code = $("#countries").val();
            userSelectedCountry = $("#countries option:selected").text();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
        }
    });
    
    function returnlocalData() {
        $.ajax({
            url: "./php/locationData.php",
            type: "POST",
            dataType: "json",
            data: {
                lat: latLong.latitude,
                lng: latLong.longitude,
            },
            beforeSend: function () {
                $(".spinner-border").show();
            },
            success: function (result) {
                myMap.panTo([latLong.latitude, latLong.longitude], 5);
                $("#countries").val(result.data.iso_code);
                iso3Code = result.data.iso_code;
                returnLayers(iso3Code);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            }
        });
    }

    let linesFeatureLayer;
    let countryEasyButton = null;
    let holidayEasyButton = null;
    let humanDevValuesEasyButton = null;
    let newsEasyButton = null;
    let weatherEasyButton = null;

    function returnLayers(countryCode) {
        convertCountryCode();
        $.ajax({
            url: "https://francineblanc.github.io/Data/countries.json",
            type: "GET",
            dataType: "json",
            data: {
                selectedCountry: countryCode,
            },
            beforeSend: function () {
                $(".spinner-border").show();
            },
            success: function (result) {
                let chosenCountry = iso3Code;
                let country = result.features.find(function (feature) {
                    return feature.properties["ISO_A3"] == chosenCountry;
                });
                citiesMarker.clearLayers();
                landmarksMarker.clearLayers();
                if (countryEasyButton) {
                    myMap.removeControl(countryEasyButton);
                }
                if (holidayEasyButton) {
                    myMap.removeControl(holidayEasyButton);
                }
                if (humanDevValuesEasyButton) {
                    myMap.removeControl(humanDevValuesEasyButton);
                }
                if (newsEasyButton) {
                    myMap.removeControl(newsEasyButton);
                }
                if (weatherEasyButton) {
                    myMap.removeControl(weatherEasyButton);
                }
                if (myMap.hasLayer(linesFeatureLayer)) {
                    myMap.removeLayer(linesFeatureLayer);
                }
                const linesStyle = {
                    "color": "#a142f5",
                    "weight": 3,
                    "opacity": 0.45,
                };
                linesFeatureLayer = L.geoJSON(country, {
                    style: linesStyle
                }).addTo(myMap);
                returnCountryData();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            },
        });
    }

    $("#countries").change(function () {
        userSelectedCountry = $("#countries option:selected").text();
        iso3Code = $("#countries").val();
        returnLayers(iso3Code);
    });

    let iso2Code;
    function convertCountryCode() {
        $.ajax({
            url: "./php/countryCodeConvert.php",
            type: "GET",
            data: {
                iso3CountryCode: iso3Code,
            },
            success: function (result) {
                iso2Code = result.data;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            }
        });
    }

    let flag;
    let citiesArray;
    let capitalCities;
    const citiesMarker = L.markerClusterGroup();
    const landmarksMarker = L.markerClusterGroup();

    const customCityMarker = L.ExtraMarkers.icon({
        icon: 'bi-building',
        innerHTML: '<img src="./assets/bootstrap-icons-1.4.0/building.svg">',
        markerColor: 'white',
        shape: 'square',
    });
    const customLandmarksMarker = L.ExtraMarkers.icon({
        icon: 'bi-binoculars',
        innerHTML: '<img src="./assets/bootstrap-icons-1.4.0/binoculars.svg">',
        markerColor: 'green-light',
        shape: 'penta',
    });
    function commaSeparate(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function returnCountryData() {
        $("#holiday-details").html("");
        $("#news-details").html("");
        userSelectedCountry = $("#countries option:selected").text();
        iso3Code = $("#countries").val();
        $.ajax({
            url: "./php/cities.php",
            type: "GET",
            dataType: "json",
            data: {
                countryName: userSelectedCountry,
            },
            success: function (result) {
                citiesArray = [];
                result.cities.forEach(function (city) {
                    let citiesData = {};
                    citiesData.city = city.city;
                    citiesData.lat = city.lat;
                    citiesData.lng = city.lng;
                    citiesData.population = city.population;
                    if (Number(city.population) >= 350000 && citiesArray.length < 20) {
                        citiesArray.push(citiesData);
                        citiesMarker.addLayer(L.marker([city.lat, city.lng], { icon: customCityMarker }).bindPopup(city.city));
                        myMap.addLayer(citiesMarker);
                    }
                });
                sendCitiesData();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            },
        });
        
        $.ajax({
            url: "./php/countryData.php",
            type: "POST",
            dataType: "json",
            data: {
                iso2CountryCode: iso2Code,
                iso3CountryCode: iso3Code,
                countryName: userSelectedCountry,
            },
            success: function (result) {
                capitalCities = result.data.capital;
                myMap.panTo([result.data.countryLatLng[0], result.data.countryLatLng[1]], 5);
                if (result.status.name == "ok") {
                    flag = result.data.flag;
                    let indicatorNameObj;
                    let indicatorValueObj;
                    let humanDevValuesObj;
                    if (result.data.humanDevValues.length !== 0) {
                        humanDevValuesObj = {};
                        indicatorNameObj = result.data.humanDevValues.indicator_name;
                        indicatorValueObj = result.data.humanDevValues.indicator_value[iso3Code];
                        for (const [key, value] of Object.entries(indicatorNameObj)) {
                            if (indicatorValueObj[key]) {
                                humanDevValuesObj[value] = indicatorValueObj[key]["2019"];
                            }
                        }
                    }
                    $("#country-modal-label").html(`<span id="modal-header-text">${result.data.countryName}</span><img id="header-flag" src="${flag}" width="50px" height="50px">`);
                    $("#capital").html(`${result.data.capital}`);
                    $("#continent").html(`${result.data.continent}`);
                    $("#currency").html(`${result.data.currency}`);
                    $("#area").html(`${commaSeparate(Number(result.data.area))}km<sup>2</sup>`);
                    $("#population").html(`${commaSeparate(result.data.population)}`);
                    $("#language").html(`${result.data.languages.join(", ")}`);
                    $("#demonym").html(`${result.data.demonym}`);
                    $("#flag").attr("src", flag);

                    let codesString = "";

                    if (result.data.callingCodes["suffixes"].length > 1) {
                        codesString = `${result.data.callingCodes["root"]}`
                    } else {
                        codesString = `${result.data.callingCodes["root"]}${result.data.callingCodes["suffixes"][0]}`;
                    }
                    $("#codes").html(codesString);

                    let neighboursString = "";
                    for (let i = 0; i < result.data.neighbours.length; i++) {
                        if (result.data.neighbours[i] && result.data.neighbours[0].country_name !== "") {
                            let punctuation = i < result.data.neighbours.length - 1 ? ", " : "";
                            neighboursString += result.data.neighbours[i].country_name + punctuation;
                        } else {
                            neighboursString += "This country has no neighbouring countries";
                        }
                    }
                    $("#neighbours").html(`${neighboursString}`);

                    $("#holidays-modal-label").html(`<span id="modal-header-text">Public Holiday Data</span><img id="header-flag" src="${flag}" width="50px" height="50px">`);
                    for (let i = 0; i < result.data.holidayName.length; i++) {
                        if (result.data.holidayName[i]) {
                            let holidayInfo = result.data.holidayName[i];
                            let holidayDate = `${holidayInfo.date.datetime.day}/${holidayInfo.date.datetime.month}/${holidayInfo.date.datetime.year.toString().slice(-2)}`;
                            $("#no-holiday-data").hide();
                            $("#holiday-details").append(`<tr><td>${holidayInfo.name}</td><td colspan="2">${holidayDate}</td><td>${holidayInfo.description}</td></tr>`);
                            $("#holiday-table").show();
                        } else {
                            $("#no-holiday-data").show();
                            $("#holiday-table").hide();
                        }
                    }

                    $("#top-news-modal-label").html(`<span id="modal-header-text">Top News</span><img id="header-flag" src="${result.data.flag}" width="50px" height="50px">`);
                    if (result.data.topNews.length) {
                        let maxArticles = Math.min(result.data.topNews.length, 5);
                        for (let i = 0; i < maxArticles; i++) {
                            $("#no-news-data").hide();
                            $("#news-details").append(`<tr><td>${result.data.topNews[i].title}</td><td>${result.data.topNews[i].description}</td><td><a href="${result.data.topNews[i].url}" target="_blank">${result.data.topNews[i].name}</td></a></tr>`);
                            $("#news-table").show();
                        }
                    } else {
                        $("#no-news-data").show();
                        $("#news-table").hide();
                    }

                    $("#human-dev-modal-label").html(`<span id="modal-header-text">Human Development Values</span><img id="header-flag" src="${flag}" width="50px" height="50px">`);
                    if (humanDevValuesObj !== undefined) {
                        $("#no-human-dev-data").hide();
                        $("#female-life").html(`${Math.round(humanDevValuesObj["Life expectancy at birth, female (years)"])} years`);
                        $("#male-life").html(`${Math.round(humanDevValuesObj["Life expectancy at birth, male (years)"])} years`);
                        $("#expected-schooling").html(`${Math.round(humanDevValuesObj["Expected years of schooling (years)"])} years`);
                        $("#mean-schooling").html(`${Math.round(humanDevValuesObj["Mean years of schooling (years)"])} years`);
                        $("#gdp").html(`${commaSeparate(humanDevValuesObj["Gross domestic product (GDP), total (2017 PPP $ billions)"])}`);
                        $("#gni").html(`${commaSeparate(humanDevValuesObj["Gross national income (GNI) per capita (constant 2017 PPP$)"])}`);
                        $("#human-dev-rank").html(`${humanDevValuesObj["HDI rank"]}`)
                        $("#human-dev-data").show();
                    } else {
                        $("#no-human-dev-data").show();
                        $("#human-dev-data").hide();
                    }

                    countryEasyButton = L.easyButton(`<img src="./assets/bootstrap-icons-1.4.0/globe.svg">`, function () {
                        $("#countryModal").modal("show");
                    });
                    holidayEasyButton = L.easyButton(`<img src="./assets/bootstrap-icons-1.4.0/calendar-check.svg">`, function () {
                        $("#holidaysModal").modal("show");
                    });
                    humanDevValuesEasyButton = L.easyButton(`<img src="./assets/bootstrap-icons-1.4.0/person-fill.svg">`, function () {
                        $("#humanDevModal").modal("show");
                    });
                    newsEasyButton = L.easyButton(`<img src="./assets/bootstrap-icons-1.4.0/newspaper.svg">`, function () {
                        $("#topNewsModal").modal("show");
                    });

                    countryEasyButton.addTo(myMap);
                    holidayEasyButton.addTo(myMap);
                    humanDevValuesEasyButton.addTo(myMap);
                    newsEasyButton.addTo(myMap);

                    linesFeatureLayer.on("click", function (event) {
                        $("#countryModal").modal("show");
                    });
                    sendWeatherData();
                } else {
                    console.log(result.data.status.message);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            }
        });
    }

    function sendCitiesData() {
        if (citiesArray.length > 0) {
            $.ajax({
                url: "./php/landmarks.php",
                type: "POST",
                dataType: "json",
                data: {
                    citiesInfo: citiesArray,
                },
                complete: function () {
                    $(".spinner-border").hide();
                },
                success: function (result) {
                    let parsedResult = [];
                    for (let i = 0; i < result.data.length; i++) {
                        parsedResult.push(...JSON.parse(result.data[i]).results);
                    }
                    parsedResult.forEach(function (landmark) {
                        landmarksMarker.addLayer(L.marker([landmark.position.lat, landmark.position.lon], { icon: customLandmarksMarker }).bindPopup(landmark.poi.name));
                        myMap.addLayer(landmarksMarker);
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
                }
            });
        } else {
            $(".spinner-border").hide();
        }
    }
    function sendWeatherData() {
        $("#weather-details").html("");
        $.ajax({
            url: "./php/weather.php",
            type: "POST",
            dataType: "json",
            data: {
                capitals: capitalCities,
            },
            success: function (result) {
                $("#weather-modal-label").html(`<span id="modal-header-text">Weather in ${capitalCities}</span><img id="header-flag" src="${flag}" width="50px" height="50px">`);
                if (result.weather) {
                    let forecastSnippets = [];
                    let time;
                    forecastSnippets.push(result.weather[0]);
                    result.weather.forEach(function (forecast) {
                        const date = new Date(forecast["dt_txt"].replace(/\s/, 'T')).getDate();
                        const todaysDate = new Date().getDate();
                        if (date !== todaysDate) {
                            time = new Date(forecast["dt_txt"].replace(/\s/, 'T')).getHours();
                            if (time === 12) {
                                forecastSnippets.push(forecast);
                            }
                        }
                    });
                    const days = ["Sun","Mon","Tues","Weds","Thurs","Fri","Sat"];                    
                    for (let i = 0; i < forecastSnippets.length; i++) {
                        const date = new Date(forecastSnippets[i]["dt_txt"].replace(/\s/, 'T'));
                        const day = new Date(date).getDay();
                        const displayDate = `${days[day]} ${date.getDate()}/${date.getMonth() + 1}`;
                        const forecastInfo = `${Math.round(forecastSnippets[i].main.temp)}&deg;C - ${forecastSnippets[i].weather[0].main}`;
                        $("#weather-details").append(`<tr><td class="align-middle">${displayDate}</td><td class="align-middle">${forecastInfo}</td><td><img src="https://openweathermap.org/img/wn/${forecastSnippets[i].weather[0].icon}.png"></td></tr>`);
                    }
                    weatherEasyButton = L.easyButton(`<img src="./assets/bootstrap-icons-1.4.0/cloud-sun.svg">`, function () {
                        $("#weather-modal").modal("show");
                        
                    });
                    weatherEasyButton.addTo(myMap);
                    $("#no-weather-data").hide();
                    $("#weather-table").show();
                } else {
                    $("#no-weather-data").show();
                    $("#weather-table").hide();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error message:\nStatus Code: " + jqXHR.status + "Issue: " + errorThrown);
            }
        });
    }
});