#!/bin/bash

set -e

yarn run ts
yarn run gen
git add .
git-cz
