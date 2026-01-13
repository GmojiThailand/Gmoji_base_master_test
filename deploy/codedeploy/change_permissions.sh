#!/bin/bash

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

chown -R gmoji:gmoji $DEPLOY_DIR

find $DEPLOY_DIR -type d -print0 | xargs -0 chmod 755
find $DEPLOY_DIR -type f -print0 | xargs -0 chmod 644

exit 0
