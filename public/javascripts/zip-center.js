function geocode2(platform, where) {
    var geocoder = platform.getGeocodingService();
    var geocodingParameters = {
        jsonattributes : 1
    };

    $.each(where, function(key, value) {
            geocodingParameters[key] = value;
        });
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
    } else if (zipData.poly === undefined || zipData.poly.length === 0) {
        console.log('Zip code ' + zipcode + ' has no associated polygon');
    } else {
        var zipCoords = new H.geo.Strip(); 
        zipData.poly.forEach(function(coord) {
                zipCoords.pushPoint(coord);
            });
        var zipPoly = new H.map.Polygon(
                                        zipCoords,
                                        zipGroups[group].displayOptions);
        zipPoly.setData(group); /* remember this */
        zipPolygons[zipcode] = zipPoly;
        zipGroups[group].mapGroup.addObject(zipPoly);
    }
}

/**
 * Remove a zipcode polygon from the map
 *
 * @param zipcode {string} the zip code identifier
 */
function removeZipFromMap(zipcode) {
    if (zipPolygons[zipcode] !== undefined) {
        var group = zipPolygons[zipcode].getData();
        zipGroups[group].mapGroup.removeObject(zipPolygons[zipcode]);
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
function enumerateZipCodes(group, zipsContainer) {
    var groupNode = document.createElement('div');
    var groupName = document.createElement('h3');
    var groupText = document.createTextNode(group.name);
    groupName.appendChild(groupText);
    groupNode.appendChild(groupName);
    $.each(group.zipCodes, function(idx, key) {
            if (zipcodes.hasOwnProperty(Number(key))) {
                var zipData = zipcodes[Number(key)];
                var zipNode = document.createElement('div');
                zipNode.className = 'zip';
                var cbox = document.createElement('input');
                cbox.id = key;
                cbox.value = key;
                cbox.type = 'checkbox';
                if (zipData.poly === undefined || zipData.poly.length == 0) {
                    cbox.disabled = true;
                } else {
                    cbox.onchange = onZipToggle;
                }
                zipNode.appendChild(cbox);
                var label = document.createElement('label');
                label.for = key;
                label.title = zipcodes[key].name;
                if (zipData.center === undefined) {
                    label.disabled = true;
                } else {
                    label.onclick = onZipFocus;
                }
                var space = document.createTextNode(' ');
                label.appendChild(space);
                var text = document.createTextNode(key);
                label.appendChild(text);
                zipNode.appendChild(label);
                groupNode.appendChild(zipNode);
            }
        });
    zipsContainer.appendChild(groupNode);
}

function populateGroups() {
    $.each(zipGroups, function(groupKey, group) {
            group.mapGroup = new H.map.Group();
            $.each(group.zipCodes, function(idx, zipcode) {
                    addZipToMap(zipcode, groupKey);
                    var cbox = document.getElementById(zipcode);
                    if (cbox !== null && cbox.disabled === false) {
                        cbox.checked = true;
                    }
                });
            map.addObject(group.mapGroup);
            map.setViewBounds(group.mapGroup.getBounds());
        });
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

//Step 2: initialize a map
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

// decode query parameters
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
    zipGroups['default'].zipCodes = params['default'].split(',');
}

// go fetch the required zip codes and render...
$.get('/api/zipcodes?q=' + params['default'], function(data) {
        zipcodes = data;
        // populate the zip code selection UI
        enumerateZipCodes(zipGroups['default'], locationsContainer);

        populateGroups();
    });

