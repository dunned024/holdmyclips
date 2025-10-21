#!/usr/bin/env bash

f=${1}

TABLE_NAME=HMCClipdex-ClipdexTable1E11C0C6-1WNIC4CPONKL7

while IFS=, read -r clip timestamp; do
    echo ${clip}
    aws dynamodb update-item \
        --table-name ${TABLE_NAME} \
        --key "{\"id\": {\"S\": \"${clip}\"}}" \
        --update-expression "SET uploadedOn=:t" \
        --expression-attribute-values "{\":t\": {\"N\": \"${timestamp}\"}}"
done < ${f}
