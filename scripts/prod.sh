#!/bin/bash

set -e

yarn clean
yarn run ts

npx mocha test/http.spec.js
now rm blog-api
now
now alias
