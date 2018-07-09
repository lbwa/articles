#!/bin/bash

set -e

yarn run gen
git add .
git-cz
