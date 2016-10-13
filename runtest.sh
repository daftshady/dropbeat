#!/bin/bash

# XXX: this will kill others as well as dropbeat containers.
docker-compose rm -f
docker-compose -f docker-compose.yml -p dropbeat up --build
