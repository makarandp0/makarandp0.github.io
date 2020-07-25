# generate report for customers

### Step 1: create a working directory
```
md local_only/foo
```
### Step 2: download data files from kibana
- download data files basic.csv, tracks.csv and errors.csv

### Step 3: convert them to json
```
list = $(*.json)
source ../../convertToJson.sh
```

### generate report
```
node ../../merge.js
```
this will generate results.json

### convert the json to csv
```
../../node_modules/.bin/json2csv --input results.json > output.csv
```