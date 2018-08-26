#!/bin/bash

set -e

rm -vrf dist/* menu.json recent-posts.json

yarn static
node dist/recent
