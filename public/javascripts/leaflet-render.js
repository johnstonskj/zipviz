
/**
 * Return a key that can be used for UI control and the zipPolygons hash
 *
 * @param group the index into the group array
 * @param zipcode the zipcode itself
 */
function mkKey(group, zipcode) {
    return group + '_' + zipcode;
}

/**
 * Split a UI control key into a group and zipcode pair
 */
function fromKey(key) {
    return [
            key.substring(0, key.indexOf('_')),
            key.substring(key.indexOf('_')+1)
            ];
}

/**
 * UI event handler to turn zipcode polygon on/off
 *
 * context: <input type="checkbox">
 */
function onZipToggle() {
    var group = Number(this.attributes['data-group'].value);
    var zipcode = Number(this.attributes['data-code'].value);
    if (this.checked) {
        addZipToMap(zipcode, group);
    } else {
        removeZipFromMap(zipcode, group);
    }
}

/**
 * UI event handler to focus the map on the center of a zipcode
 *
 * context: <label>
 */
function onZipFocus() {
    if (this['for'] !== undefined) {
        var zipcode = fromKey(this.for)[1];
        var zipData = zipcodes[zipcode];
        if (zipData.center !== undefined) {
            map.setView(zipData.center);
        }
    }
}

/**
 * Create the UI for selecting and displaying zip codes.
 *
 * @param zipContainer {<div>} container to add zip selection UI into
 */
function enumerateZipCodes(zipsContainer) {
    $.each(zipGroups, function(groupId, group) {
            var groupNode = document.createElement('div');
            var groupName = document.createElement('h3');
            var groupText = document.createTextNode(group.name);
            groupName.appendChild(groupText);
            groupNode.appendChild(groupName);
            $.each(group.zipCodes, function(idx, zipcode) {
                    if (zipcodes.hasOwnProperty(Number(zipcode))) {
                        var zipData = zipcodes[Number(zipcode)];
                        var zipNode = document.createElement('div');
                        zipNode.className = 'zip';
                        var cbox = document.createElement('input');
                        var key = mkKey(groupId, zipcode);
                        cbox.id = key;
                        cbox.value = key;
                        cbox.type = 'checkbox';
                        cbox.setAttribute('data-group', groupId);
                        cbox.setAttribute('data-code', zipcode);
                        if (zipData.poly === undefined || zipData.poly.length == 0) {
                            cbox.disabled = true;
                        } else {
                            cbox.onchange = onZipToggle;
                        }
                        zipNode.appendChild(cbox);
                        var label = document.createElement('label');
                        label.for = key;
                        label.title = zipcodes[zipcode].name;
                        if (zipData.center !== undefined) {
                            label.className = 'center';
                            label.onclick = onZipFocus;
                        }
                        var space = document.createTextNode(' ');
                        label.appendChild(space);
                        var text = document.createTextNode(zipcode);
                        label.appendChild(text);
                        zipNode.appendChild(label);
                        groupNode.appendChild(zipNode);
                    }
                });
            zipsContainer.appendChild(groupNode);
        });
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
        var zipPoly = L.polyline(zipData.poly);
        var color = zipGroups[group].color;
        zipPoly.setStyle({color: color, weight: 1, fill: true, fillColor: color, fillOpacity: 0.2});
        zipPolygons[mkKey(group, zipcode)] = zipPoly;
        zipPoly.addTo(zipGroups[group].mapGroup);
        zipPoly.__group = group;
    }
}

/**
 * Remove a zipcode polygon from the map
 *
 * @param zipcode {string} the zip code identifier
 */
function removeZipFromMap(zipcode, group) {
    var key = mkKey(group, zipcode);
    if (zipPolygons[key] !== undefined) {
        var group = zipPolygons[key].__group;
        zipGroups[group].mapGroup.removeLayer(zipPolygons[key]);
        delete zipPolygons[key];
    }
}

/**
 * For each group create a layer and add the individual polygons.
 *
 */
function populateGroups() {
    var overlayMaps = {};
    $.each(zipGroups, function(groupKey, group) {
            group.mapGroup = L.featureGroup();
            $.each(group.zipCodes, function(idx, zipcode) {
                    addZipToMap(zipcode, groupKey);
                    var cbox = document.getElementById(mkKey(groupKey, zipcode));
                    if (cbox !== null && cbox.disabled === false) {
                        cbox.checked = true;
                    }
                });
            group.mapGroup.addTo(map);
            overlayMaps[group.name] = group.mapGroup;
            map.fitBounds(group.mapGroup.getBounds());
        });
    L.control.layers(null, overlayMaps).addTo(map);
}

/*
 * Boilerplate map initialization
 */

// Step 1: Create the map
var map = L.map('map', {
        center: [47.5581, -122.1466],
        zoom: 13
    });

// Step 2: Add a tile layer
var osmDataProvider = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a>'
    });
            
osmDataProvider.addTo(map);

/*
 * Application initialization
 */

// grab the container element
var locationsContainer = document.getElementById('panel');

// Hold a reference to any infobubble opened
var bubble;

// track all the zipcodes currently on the map.
var zipGroups = {};
var zipPolygons = {};

// configured colors
var zipColors = ['red', 'blue', 'green', 'yellow'];

// create default zip code display group
var zipGroups = [];

// decode query parameters
var params = {};
var fetchCodes = [];
if (location.search) {
    var parts = location.search.substring(1).split('&');
    
    for (var i = 0; i < parts.length; i++) {
        var nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
}
$.each(zipColors, function(grp) {
        var group = 'group' + String(grp+1);
        if (params[group + 'Name'] !== undefined && params[group + 'Codes'] !== undefined) {
            zipGroups[grp] = {name: '', color: zipColors[grp], zipCodes: []};
            zipGroups[grp].name = params[group + 'Name'].replace(/\+/g, ' ');
            zipGroups[grp].color = zipColors[grp];
            var codes = params[group + 'Codes'].replace(/%2C/g,',').split(',');
            zipGroups[grp].zipCodes = codes;
            Array.prototype.push.apply(fetchCodes, codes);
        }
    });

/*
 * Go do it ...
 */
$(document).ready(function() {
        // go fetch the required zip codes and render...
        $.get('/api/zipcodes?q=' + fetchCodes.join(','), function(data) {
                zipcodes = data;
                // populate the zip code selection UI
                enumerateZipCodes(locationsContainer);
                
                populateGroups();
            });
    });
