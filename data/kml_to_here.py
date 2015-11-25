import sys
import csv
import xml.etree.ElementTree as xml

def parse_csv(filename):
    # https://www.google.com/fusiontables/DataSource?docid=1fzwSGnxD0xzJaiYXYX66zuYvG0c5wcEUi5ZI0Q
    with open(filename, 'rb') as csvfile:
        header()
        reader = csv.reader(csvfile)
        for row in reader:
            if not row[3] == 'ZIP':
                parsed = parse(row[3], row[11])
                formatted = format(row[2], row[3], {'lat':row[4], 'lng':row[9]}, parsed)
                print(formatted)
        footer()

def parse(zip, kml):
    response = []
    try:
        root = xml.fromstring(kml)
    except xml.ParseError:
        return None
    elements = root.findall('.//coordinates')
    for element in elements:
        for coord in element.text.split():
            # KML format is [longitude, latitude, and optional altitude]
            values = coord.split(',')
            response.append({'lng':values[0], 'lat':values[1], 'alt':values[2]})
    return response

def header():
    print('zipcodes = {')

def footer():
    print('};')
    print('')
    print('//fix for NPM')
    print('//if (exports !== undefined) {')
    print('//  exports = zipcodes;')
    print('//}')

def format(name, zip, center, coords):
    response = []
    response.append("  '%s': {\n" % zip)
    response.append("    name: '%s',\n" % name)
    response.append('    center: {lat:%(lat)s, lng:%(lng)s},\n' % (center))
    response.append('    poly: [\n')
    if not coords is None:
        for coord in coords:
            # Here format is [lattude, longtude, and optional altitude]
            response.append('      {lat:%(lat)s, lng:%(lng)s},\n' % (coord))
    response.append('    ]\n')
    response.append('  },\n')
    return ''.join(response)

parse_csv(sys.argv[1])
