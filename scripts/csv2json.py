import csv
import json
import os.path

import requests

CSV = os.path.join('..', 'data', 'rhi.csv')
JSON = os.path.join('..', 'data', 'rhi.json')

with open(CSV, newline='', encoding='utf-8') as csvfile:
    csv_rows = []
    reader = csv.DictReader(csvfile)
    title = reader.fieldnames
    for row in reader:
        csv_rows.extend([{title[i]: row[title[i]] for i in range(len(title))}])

rhi_list = []
for row in csv_rows:
    company_dict = next((item for item in rhi_list if item['name'] == row['Business Name']), None)
    installation = {
        'date': row['Date of Application'],
        'type': row['Technology Type'],
        'capacity': row['Installation Capacity (kWth)'],
        'payments': row['Total of payments made at 28 February 2017 (£)']
    }
    if company_dict is not None:
        [v.append(installation.copy()) for k, v in company_dict.items() if k == 'installations']
    else:
        company_dict = {
            'name': row['Business Name'],
            'postcode': row['Company Location by Trimmed Postcode'],
            'installations': [installation]
        }
        rhi_list.append(company_dict)

api_url = 'https://api.opencorporates.com/v0.4/companies/search'

for index in range(len(rhi_list)):
    postcode = rhi_list[index]['postcode']
    company_name = rhi_list[index]['name']
    payload = {'q': company_name, 'normalise_company_name': 'true', 'jurisdiction_code': 'gb', 'inactive': 'false',
               'registered_address': postcode}
    r = requests.get(api_url, params=payload)
    if r.status_code != 200:
        continue
    companies = r.json()['results']['companies']
    if len(companies) != 1:
        continue
    url = companies[0]['company']['opencorporates_url']
    rhi_list[index]['url'] = url

with open(JSON, 'w', encoding='utf-8') as jsonfile:
    jsonfile.write(
        json.dumps(rhi_list, ensure_ascii=False))
