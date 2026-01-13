#!/bin/bash

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

pm2 stop base || true 2>/dev/null

exit 0
