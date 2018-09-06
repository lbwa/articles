#!/bin/bash

set -e

rm -vrf dist/* recent-posts.json writings/*

yarn static
node dist/recent
