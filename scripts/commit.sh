#!/bin/bash

set -e

yarn run test
git add .
git-cz
