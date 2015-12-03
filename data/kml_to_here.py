import csv
import json
import logging
import os.path
import sys
import sqlite3
import xml.etree.ElementTree as xml

FORMAT = '%(asctime)-15s %(levelname)-7s %(funcName)s: %(message)s'
logging.basicConfig(format=FORMAT)
logger = logging.getLogger('zipviz')
logger.setLevel(logging.INFO)

def construct_database(filename='us_zip_codes.db'):
    # Use full KML for detailed boundaries
    zip_codes = parse_all_kml({})
    # Use deliverable zip CSV for names, centers, and KML?
    zip_codes = parse_deliverable_csv(zip_codes)
    # Use undeliverable for names, centers only?
    zip_codes = parse_undeliverable_csv(zip_codes)
    # Write output formats
    write_to_database(zip_codes)
    #write_to_json(zip_codes)

def write_to_database(zip_codes, filename='us_zip_codes.db'):
    logger.info('Creating database file %s' % filename)
    conn = sqlite3.connect(filename)
    c = conn.cursor()
    try:
        c.execute('''
CREATE TABLE geo_data (
    type char(10),
    key  char(10),
    special integer,
    has_poly integer,
    json text,
    PRIMARY KEY (type, key))''')
        conn.commit()
    except sqlite3.OperationalError:
        logger.warn('Error creating table, it probably exists')
    for zip_code in zip_codes:
        zip_data = zip_codes[zip_code]
        special = zip_data.has_key('undeliverable')
        has_poly = zip_data.has_key('poly')
        if special == has_poly:
            logger.info('Interesting, special == has_poly for %s' % zip_code)
        try:
            conn.execute(
                'insert into geo_data values ("uszip", ?, ?, ?, ?)', 
                (zip_code, special, has_poly, json.dumps(zip_data)))
            conn.commit()
        except:
            logger.warn('Error inserting row for zip %s' % zip_code)
    conn.close()

def write_to_json(zip_codes, directory='json'):
    logger.info('Creating JSON files in directory %s' % directory)
    for zip_code in zip_codes:
        filename = os.path.join(directory, '%s.json' % zip_code)
        with open(filename, 'wt') as json_file:
            json.dump(zip_codes[zip_code], json_file)

def parse_all_kml(zip_codes, filename='us_zip_codes.kml'):
    # Full KML:
    # http://www.filosophy.org/post/17/zipcodes_in_kml/
    # ...<Placemark>
    #      <name>!!
    #      <Polygon><OuterBoundaryIs><LinearRing><coordinates>!!
    logger.info('Parsing the KML for all zip codes')
    tree = xml.parse(filename)
    root = tree.getroot()
    entries = root.findall('.//{http://earth.google.com/kml/2.0}Placemark')
    logger.info('Found %d entries in KML' % len(entries))
    for entry in entries:
        zip_code = entry.find('{http://earth.google.com/kml/2.0}name').text
        if zip_code[3:] in ('HH', 'XX'):
            logger.debug('Ignoring entry for zip3 %s' % zip_code)
        else:
            logger.debug('Parsing entry for zip code %s' % zip_code)
            data = {}
            coordinates = entry.findall('.//{http://earth.google.com/kml/2.0}coordinates')
            pdata = parse_coordinates(coordinates)
            if not pdata is None:
                data['poly'] = pdata
            zip_codes[zip_code] = data
    return zip_codes

def parse_undeliverable_csv(zip_codes, filename='us_undeliverable_zip_codes.csv'):
    # Undeliverable:
    # https://www.google.com/fusiontables/data?docid=1XXhCde2p1ncNiUSdEgO-mApKRPJsUIidYHNa0KA
    logger.info('Parsing the CSV file for undeliverable zip data')
    with open(filename, 'rb') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if not row[0] == 'zip':
                if not zip_codes.has_key(row[0]):
                    logger.info('no data found for zip code %s' % row[0])
                    zip_codes[row[0]] = {'undeliverable': True}
                zip_code = zip_codes[row[0]]
                zip_code['name'] = row[1]
    return zip_codes

def parse_deliverable_csv(zip_codes, filename='us_zip_codes.csv'):
    # US Zip Codes (partial):
    # https://www.google.com/fusiontables/DataSource?docid=1fzwSGnxD0xzJaiYXYX66zuYvG0c5wcEUi5ZI0Q
    logger.info('Parsing the CSV file for deliverable zip data')
    with open(filename, 'rb') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if not row[3] == 'ZIP':
                if not zip_codes.has_key(row[3]):
                    logger.info('no data found for zip code %s' % row[3])
                    zip_codes[row[3]] = {}
                    if len(row[11]) > 0:
                        root = xml.fromstring(row[11])
                        coordinates = root.findall('.//coordinates')
                        pdata = parse_coordinates(coordinates)
                        if not pdata is None:
                            zip_codes[row[3]]['poly'] = pdata
                zip_code = zip_codes[row[3]]
                zip_code['name'] = row[2]
                zip_code['center'] = {'lat':row[4], 'lng':row[9]}
    return zip_codes

def parse_coordinates(coordinates):
    data = None
    if len(coordinates) > 0:
        data = []
        for element in coordinates:
            for coord in element.text.split():
                # KML format is [longitude, latitude, and optional altitude]
                values = coord.split(',')
                if len(values) == 2:
                    data.append({'lng':values[0], 'lat':values[1]})
                elif len(values) == 3:
                    data.append({'lng':values[0], 'lat':values[1], 'alt':values[2]})
    return data

construct_database()
