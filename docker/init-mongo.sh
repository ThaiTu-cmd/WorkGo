#!/bin/sh
set -eu
# Replica election is handled by the database healthcheck. Apply replay-safe runtime indexes.
mongosh "mongodb://mongodb-communication:27017/$COMMUNICATION_DB?replicaSet=rs0&directConnection=true" --quiet /workgo/mongo-indexes.js
