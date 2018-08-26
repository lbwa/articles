#!/bin/bash

set -e

rm -vrf dist/* recent-posts.json

yarn static
node dist/recent
