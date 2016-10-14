#!/bin/bash
until $(curl --output /dev/null --silent --fail http://web:8000/api/v1/healthcheck); do
    printf '.'
    sleep 1
done

pyresttest http://web:8000/ test-api.yaml
