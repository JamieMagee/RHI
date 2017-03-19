import csv
import json
import os.path
from collections import Counter, OrderedDict
from datetime import datetime

CSV = os.path.join('..', 'data', 'rhi.csv')
JSON = os.path.join('..', 'data', 'application_dates.json')

with open(CSV, newline='', encoding='utf-8') as csvfile:
    csv_rows = []
    reader = csv.DictReader(csvfile)
    title = reader.fieldnames
    for row in reader:
        csv_rows.extend([{title[i]: row[title[i]] for i in range(len(title))}])

dates = Counter(row['Date of Application'] for row in csv_rows)
sorted_dates = OrderedDict(sorted(dates.items(), key=lambda x: datetime.strptime(x[0], "%d/%m/%Y")))
print(dates.most_common())
dates_list = []
for k, v in sorted_dates.items():
    dates_list.append({'date': k, 'value': v})
with open(JSON, 'w', encoding='utf-8') as jsonfile:
    jsonfile.write(
        json.dumps(dates_list, ensure_ascii=False))
