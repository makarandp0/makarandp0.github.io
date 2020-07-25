#!/bin/bash
echo this batch file copies type.
echo given a list of files $list, it will
echo 1. rename all files  replacing $1 with $2
echo 2. replace contents for all files replacing $1 with $2
echo you must collect the list of files outside this script
echo and invoke it with "source replace.sh search replace"

echo for example
echo list=$(ls *.csv)
echo source convert_to_json.sh

for fl in $list; do
	echo ../node_modules/.bin/csv2json $fl =\> ${fl/\.csv/\.json}
	../../node_modules/.bin/csv2json $fl > ${fl/\.csv/\.json}
done
