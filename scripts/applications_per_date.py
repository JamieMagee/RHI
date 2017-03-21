import csv
import os.path

import pandas as pd

CSV = os.path.join('..', 'data', 'rhi.csv')
JSON = os.path.join('..', 'data', 'application_dates.json')

with open(CSV, newline='', encoding='utf-8') as csvfile:
    csv_rows = []
    reader = csv.DictReader(csvfile)
    title = reader.fieldnames
    for row in reader:
        csv_rows.extend([{title[i]: row[title[i]] for i in range(len(title))}])

dates = [row['Date of Application'] for row in csv_rows]

df = pd.DataFrame(pd.Series(dates).value_counts())
df.index.name = 'd'
df.columns = ['a']
df.index = pd.to_datetime(df.index)

weekly_applications = df.resample('W').sum().fillna(0)
weekly_applications = weekly_applications.astype('int')
weekly_applications.reset_index().to_json(JSON, orient='records', date_unit='s')
