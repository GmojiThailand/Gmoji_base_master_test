#!/bin/bash

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

if [ -f "/etc/nginx/conf.d/default.conf" ]
then
    rm -Rf /etc/nginx/conf.d/default.conf
fi

if [ -f "/etc/nginx/conf.d/api.gmoji.conf.new" ]
then
    mv -f  /etc/nginx/conf.d/api.gmoji.conf.new /etc/nginx/conf.d/api.gmoji.conf
fi

touch /opt/gmoji/base/current/index.html

exit 0
