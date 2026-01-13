#!/bin/bash

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

mkdir -p $DEPLOY_DIR

/bin/rm -Rf $DEPLOY_DIR/*

exit 0
