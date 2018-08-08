#!/bin/bash

set -e

yarn clean

yarn run test
git add .
git-cz
