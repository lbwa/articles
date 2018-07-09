#!/bin/bash

set -e

yarn run compiler
git add .
git-cz
