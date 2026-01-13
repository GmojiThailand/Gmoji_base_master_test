#!/bin/bash

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

# Get region name
EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"

# Get Environment Variables
ENVIRONMENT=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/ENVIRONMENT --region $EC2_REGION --output text --query Parameters[0].Value`

cd $DEPLOY_DIR
pm2 start --env=$ENVIRONMENT $DEPLOY_DIR/pm2.json

cd /opt/gmoji/file-exporter/current/
pm2 start --env=$ENVIRONMENT pm2.json

cd /opt/gmoji/url-cutter/current/
pm2 start --env=$ENVIRONMENT pm2.json

cd /opt/gmoji/csv-parser/current/
pm2 start --env=$ENVIRONMENT pm2.json

exit 0
