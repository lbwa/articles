#!/bin/bash

set -e

yarn run ts
node dist/index skip
npx mocha test/http.spec.js
now
now alias
