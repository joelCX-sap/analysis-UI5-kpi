Organic Valley BI - HANA Data Reader

This project provides a complete module to read data from HANA Cloud, map technical columns to human-readable names, and prepare the data for consumption in applications.

📋 Features

✅ Connection to HANA Cloud using hana_ml

✅ Data reading from table PurchaseDocuments

✅ Automatic mapping of technical columns to readable names

✅ Generation of prepared data in JSON format

✅ Data filtering and analysis functions

✅ Full example of application data consumption

📊 Processed Data

Source table: COEAI.PurchaseDocuments

Total records: 28,988

Total columns: 24

Date range: 2024-03-25 to 2025-02-07

Unique companies: 1

Unique plants: 36

Unique materials: 164

🏗️ Project Structure
.
├── hana.py                 # Main connection and processing module
├── annotations.json        # Mapping of technical to readable column names
├── .env                    # HANA connection credentials
├── prepared_data.json      # Processed data ready for consumption (31.5MB)
├── ejemplo_consumo.py      # Example of how to use the data in applications
├── test.ipynb              # Original testing notebook
└── README.md               # This file

⚙️ Configuration
1. Credentials (.env)

### 2. Dependencies

```bash
pip install hana-ml pandas python-dotenv

🚀 Usage
Data Processing
from hana import HanaDataReader

# Initialize reader
reader = HanaDataReader()

# Get prepared data
prepared_data = reader.get_prepared_data()

# Save to JSON file
reader.save_prepared_data('prepared_data.json')

# Close connection
reader.disconnect()

Consuming Prepared Data
import json
import pandas as pd

# Load prepared data
with open('prepared_data.json', 'r') as f:
    data = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(data['data'])

# Filter by specific plant
plant_data = df[df['Plant'] == 1034]

# Basic analysis
print(f"Total records: {len(df):,}")
print(f"Columns: {list(df.columns)}")

📊 Column Mapping

Technical columns are automatically mapped using annotations.json:

Technical Name	Readable Name
MANDT	Client
EBELN	Purchasing Document Number
EBELP	Item Number of Purchasing Document
BUKRS	Company Code
WERKS	Plant
MATNR	Material Number
MENGE	Purchase Order Quantity (Requested)
EINDT	Delivery Date (Requested)
...	...
🔄 Prepared Data Structure
{
  "metadata": {
    "total_records": 28988,
    "columns_count": 24,
    "last_updated": "2025-09-27T09:15:23.616085",
    "table_name": "PurchaseDocuments",
    "schema": "COEAI",
    "original_columns": ["MANDT", "EBELN", ...],
    "mapped_columns": ["Client", "Purchasing Document Number", ...]
  },
  "column_mapping": {
    "MANDT": "Client",
    "EBELN": "Purchasing Document Number",
    ...
  },
  "data": [
    {
      "Client": 110,
      "Purchasing Document Number": 4500001887,
      "Company Code": 1710,
      "Plant": 1034,
      "Material Number": "000000000000100679",
      ...
    },
    ...
  ]
}

🧪 Tests and Examples
Run full processing:
python hana.py

Test data consumption:
python ejemplo_consumo.py

📈 HanaDataReader Module Features
Main Methods

connect(): Establishes connection to HANA Cloud

read_all_data(table_name, schema): Reads all data from a table

get_table_info(table_name, schema): Retrieves table information

get_column_mapping(): Gets column mapping

apply_column_mapping(df): Applies mapping to a DataFrame

get_prepared_data(): Generates data ready for consumption

save_prepared_data(output_file): Saves data to JSON file

disconnect(): Closes the connection

Consumption Functions (ejemplo_consumo.py)

load_prepared_data(file_path): Loads data from JSON

get_data_summary(prepared_data): Gets data summary

filter_data(prepared_data, filters): Filters data by criteria

get_analytics(prepared_data): Performs basic analytics

🎯 Use Cases

BI Dashboard – Consume data for visualizations

Procurement Analysis – Study purchasing patterns

Automated Reports – Generate periodic reports

Data APIs – Serve data to web applications

Machine Learning – Use data for predictive models

🔒 Security

Credentials are stored in the .env file (excluded from version control)

Secure connection to HANA Cloud using SSL

Credential validation before connection

📝 Logs and Debugging

The module includes complete logging:

INFO:__main__:Connection to HANA established successfully
INFO:__main__:Reading data from table: COEAI.PurchaseDocuments
INFO:__main__:Read 28,988 records from COEAI.PurchaseDocuments
INFO:__main__:Mapped 24 columns
INFO:__main__:Prepared data saved to: prepared_data.json

🚀 Next Steps

Automation – Set up automatic data updates

Cache – Implement caching for better performance

REST API – Create an API to serve the data

Validation – Add data quality validations

Alerts – Notifications when new data is available

👥 Maintenance

To update the data:

# Run full processing
python hana.py

# Check generated file
ls -la prepared_data.json

# Test data consumption
python ejemplo_consumo.py


Project successfully completed ✅

HANA Cloud data is now prepared and mapped, ready to be consumed directly by any application.
