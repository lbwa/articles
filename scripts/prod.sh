#!/bin/bash

set -e

yarn run ts

# It will generate new menu list, so we can omit command `node dist/index skip``
npx mocha test/http.spec.js
now
now alias
