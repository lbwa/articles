#!/bin/bash

set -e

rm -vrf dist/* recent-posts.json writings/*

# should run `yarn dev` to create new menu.json
yarn static
node dist/recent
