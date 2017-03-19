import os.path

import pandas as pd
import numpy as np
from datetime import datetime

CSV = os.path.join('..', 'data', 'rhi.csv')
JSON = os.path.join('..', 'data', 'application_dates.json')

headers = ['Business Name', 'Date of Application', 'Company Location by Trimmed Postcode', 'Technology Type',
           'Installation Capacity (kWth)', 'Total of payments made at 28 February 2017 (£)']
use_cols = ['Date of Application', 'Total of payments made at 28 February 2017 (£)']
parse_dates = ['Date of Application']
dtypes={'Date of Application': 'str', 'Total of payments made at 28 February 2017 (£)': 'str'}

df = pd.read_csv(CSV, sep=',', header=0, index_col=parse_dates, usecols=use_cols, parse_dates=parse_dates)

df.columns = ['payments']
df.index.names = ['dates']
df['payments'] = df['payments'].replace('[£,]', '', regex=True).astype(float)

unique_days  = (df.groupby(lambda x: datetime.strftime(x, '%Y-%m-%d')).aggregate(np.sum))
unique_days.index.names = ['dates']
unique_days.index = pd.to_datetime(unique_days.index)
print(unique_days)

weekly_summary = pd.DataFrame()
weekly_summary['payments'] = unique_days['payments'].resample('W').sum()
weekly_summary['cumulative_payments'] = unique_days['payments'].cumsum(skipna=False).resample('W').last()
pd.set_option('display.max_rows', len(weekly_summary))
print(weekly_summary)
