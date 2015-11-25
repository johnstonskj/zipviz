/**
 * Calculates and displays the address details of  425 Randolph St, Chicago, IL
 * based on a structured input
 *
 * @param   {H.service.Platform} platform    A stub class to access HERE services
 */
function geocode(platform) {
    var geocoder = platform.getGeocodingService(),
        geocodingParameters = {
        postalcode: '98006',
        country: 'usa',
        jsonattributes : 1
    };
    
    geocoder.geocode(geocodingParameters,
                     onSuccess,
                     onError
                     );
}

/**
 * This function will be called once the Geocoder REST API provides a response
 *
 * @param  {Object} result          A JSONP object representing the  location(s) found.
 *
 * see: http://developer.here.com/rest-apis/documentation/geocoder/topics/resource-type-response-geocode.html
 */
function onSuccess(result) {

    if (result.type === 'PermissionError') {
        console.log(result);
        locationsContainer.innerHTML = 'Error calling service: ' + result.details;
    } else {
        console.log(result);
        var locations = result.response.view[0].result;
        /*
         * The styling of the geocoding response on the map is entirely under the developer's control.
         * A representitive styling can be found the full JS + HTML code of this example
         * in the functions below:
         */
        addLocationsToMap(locations);
        addLocationsToPanel(locations);
        // ... etc.
    }
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 *
 * @param  {Object} error  The error message received.
 */
function onError(error) {
    alert('Ooops!');
}

/**
 * Opens/Closes a infobubble
 * @param  {H.geo.Point} position     The location on the map.
 * @param  {String} text              The contents of the infobubble.
 */
function openBubble(position, text){
    if(!bubble){
        bubble =  new H.ui.InfoBubble(
                                      position,
                                      {content: text});
        ui.addBubble(bubble);
    } else {
        bubble.setPosition(position);
        bubble.setContent(text);
        bubble.open();
    }
}

/**
 * Creates a series of list items for each location found, and adds it to the panel.
 *
 * @param {Object[]} locations An array of locations as received from the
 *                             H.service.GeocodingService
 */
function addLocationsToPanel(locations) {

    var nodeOL = document.createElement('ul'),
        i;

    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft ='5%';
    nodeOL.style.marginRight ='5%';
    
    
    for (i = 0;  i < locations.length; i += 1) {
        var li = document.createElement('li'),
            divLabel = document.createElement('div'),
            address = locations[i].location.address,
            content =  '<strong style="font-size: large;">' + address.label  + '</strong><br>';
        position = {
            lat: locations[i].location.displayPosition.latitude,
            lng: locations[i].location.displayPosition.longitude
        };
        
        content += '<strong>houseNumber:</strong> ' + address.houseNumber + '<br/>';
        content += '<strong>street:</strong> '  + address.street + '<br/>';
        content += '<strong>district:</strong> '  + address.district + '<br/>';
        content += '<strong>city:</strong> ' + address.city + '<br/>';
        content += '<strong>postalCode:</strong> ' + address.postalCode + '<br/>';
        content += '<strong>county:</strong> ' + address.county + '<br/>';
        content += '<strong>country:</strong> ' + address.country + '<br/>';
        content += '<br/><strong>position:</strong> ' +
            Math.abs(position.lat.toFixed(4)) + ((position.lat > 0) ? 'N' : 'S') +
            ' ' + Math.abs(position.lng.toFixed(4)) + ((position.lng > 0) ? 'E' : 'W');
        
        divLabel.innerHTML = content;
        li.appendChild(divLabel);
        
        nodeOL.appendChild(li);
    }

    locationsContainer.appendChild(nodeOL);
}

/**
 * Creates a series of H.map.Markers for each location found, and adds it to the map.
 *
 * @param {Object[]} locations An array of locations as received from the
 *                             H.service.GeocodingService
 */
function addLocationsToMap(locations) {
    var group = new  H.map.Group(),
        position,
        i;
    
    // Add a marker for each location found
    for (i = 0;  i < locations.length; i += 1) {
        position = {
            lat: locations[i].location.displayPosition.latitude,
            lng: locations[i].location.displayPosition.longitude
        };
        marker = new H.map.Marker(position);
        marker.label = locations[i].location.address.label;
        group.addObject(marker);
    }
    
    group.addEventListener('tap', function (evt) {
            map.setCenter(evt.target.getPosition());
            openBubble(
                       evt.target.getPosition(), evt.target.label);
        }, false);
    
    // Add the locations group to the map
    map.addObject(group);
    map.setViewBounds(group.getBounds());
}

/**
 * Add a zipcode polygon to the map
 *
 * @param zipcode {string} the zip code identifier
 * @param group {Object} a group to add to.
 */
function addZipToMap(zipcode, group) {
    var zipData = zipcodes[zipcode];
    if (zipData === undefined) {
        console.log('Zip code ' + zipcode + ' has no data');
    } else if (zipData.poly.length === 0) {
        console.log('Zip code ' + zipcode + ' has no associated polygon');
    } else {
        var zipCoords = new H.geo.Strip(); 
        zipData.poly.forEach(function(coord) {
                zipCoords.pushPoint(coord);
            });
        var zipPoly = new H.map.Polygon(
                                        zipCoords,
                                        zipGroups[group].displayOptions);
        zipPolygons[zipcode] = zipPoly;
        map.addObject(zipPoly);
    }
}

/**
 * Remove a zipcode polygon from the map
 *
 * @param zipcode {string} the zip code identifier
 */
function removeZipFromMap(zipcode) {
    if (zipPolygons[zipcode] !== undefined) {
        map.removeObject(zipPolygons[zipcode]);
        delete zipPolygons[zipcode];
    }
}

/**
 * UI event handler to turn zipcode polygon on/off
 *
 * context: <input type="checkbox">
 */
function onZipToggle() {
    if (this.checked) {
        addZipToMap(this.value, 'default');
    } else {
        removeZipFromMap(this.value);
    }
}

/**
 * UI event handler to focus the map on the center of a zipcode
 *
 * context: <label>
 */
function onZipFocus() {
    if (this['for'] !== undefined) {
        var zipData = zipcodes[this.for];
        if (zipData.center !== undefined) {
            map.setCenter(zipData.center);
        }
    }
}

/**
 * Create the UI for selecting and displaying zip codes.
 *
 * @param zipContainer {<div>} container to add zip selection UI into
 */
function enumerateZipCodes(zipsContainer) {
    for (var key in zipcodes) {
        if (zipcodes.hasOwnProperty(key)) {
            var zipNode = document.createElement('div');
            zipNode.className = 'zip';
            var cbox = document.createElement('input');
            cbox.id = key;
            cbox.value = key;
            cbox.type = 'checkbox';
            // TODO: disable if no polygon
            cbox.onchange = onZipToggle;
            zipNode.appendChild(cbox);
            var label = document.createElement('label');
            label.for = key;
            label.title = zipcodes[key].name;
            // TODO: disable if no location
            label.onclick = onZipFocus;
            var space = document.createTextNode(' ');
            label.appendChild(space);
            var text = document.createTextNode(key);
            label.appendChild(text);
            zipNode.appendChild(label);
            zipsContainer.appendChild(zipNode);
        }
    }
}

function populateGroups() {
    var params = {};

    if (location.search) {
        var parts = location.search.substring(1).split('&');

        for (var i = 0; i < parts.length; i++) {
            var nv = parts[i].split('=');
            if (!nv[0]) continue;
            params[nv[0]] = nv[1] || true;
        }
    }
    if (params['default'] !== undefined) {
        params['default'].split(',').forEach(function(z) {
                addZipToMap(z, 'default');
                var cbox = document.getElementById(z);
                if (cbox !== null) {
                    cbox.checked = true;
                }
            });
    }
}

/**
 * Boilerplate map initialization
 */

//Step 1: initialize communication with the platform
var platform = new H.service.Platform({
        app_id: HERE.APP_ID,
        app_code: HERE.APP_CODE,
        useCIT: true,
        useHTTPS: true
    });
var defaultLayers = platform.createDefaultLayers();

//Step 2: initialize a map - this map is centered over California
var map = new H.Map(document.getElementById('map'),
                    defaultLayers.normal.map,{
                        center: {lat:47.5581, lng:-122.1466},
                        zoom: 10
                    });

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var events = new H.mapevents.MapEvents(map);
var behavior = new H.mapevents.Behavior(events);
map.addEventListener('displayready', function () {
        console.log('map ready'); //afterHereMapLoad(map);
    }, false);

//Step 4: create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

/**
 * Application initialization
 */

// grab the container element
var locationsContainer = document.getElementById('panel');

// Hold a reference to any infobubble opened
var bubble;

// track all the zipcodes currently on the map.
var zipGroups = {};
var zipPolygons = {};

// create default zip code display group
zipGroups['default'] = {
    name: 'Default Group',
    displayOptions: {
        pen: {strokeColor: "#000", lineWidth: 1},
        brush: {color: "#2C2A"}
    }
};

// populate the zip code selection UI
enumerateZipCodes(locationsContainer);

populateGroups();

function geocode2(platform, where) {
    var geocoder = platform.getGeocodingService();
    var geocodingParameters = {
        jsonattributes : 1
    };

    for (key in where) {
        if (where.hasOwnProperty(key)) {
            geocodingParameters[key] = where[key];
        }
    }
    geocoder.geocode(geocodingParameters,
                     onGeocodeSuccess,
                     onGeocodeError
                     );
}

function onGeocodeSuccess(result) {
    console.log(result);
}

function onGeocodeError(error) {
    console.log(error);
}