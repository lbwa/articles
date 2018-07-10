#!/bin/bash

set -e

yarn run ts
git add .
git-cz
