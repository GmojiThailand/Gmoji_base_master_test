#!/bin/sh

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

# Get region name
EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"

# Get Environment Variables
APISECONDARY=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/APISECONDARY --region $EC2_REGION --output text --query Parameters[0].Value`
APPFQDN=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/APPFQDN --region $EC2_REGION --output text --query Parameters[0].Value`
APPFQDNSECONDARY=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/APPFQDNSECONDARY --region $EC2_REGION --output text --query Parameters[0].Value`
MONGODBPRIVATEIP=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/MONGODBPRIVATEIP --region $EC2_REGION --output text --query Parameters[0].Value`
ENVIRONMENT=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/ENVIRONMENT --region $EC2_REGION --output text --query Parameters[0].Value`

if [ "$ENVIRONMENT" = "production" ]
then
  API_DOMAIN="api.$APPFQDN"
  if [ -z "$APISECONDARY" ]
  then
    API_DOMAIN_NGINX="api.$APPFQDN api.$APPFQDNSECONDARY"
  else
    API_DOMAIN_NGINX="api.$APPFQDN api.$APPFQDNSECONDARY $APISECONDARY.$APPFQDN $APISECONDARY.$APPFQDNSECONDARY"
  fi
  CONFIG_FILE="production.js"
else
  API_DOMAIN="api-develop.$APPFQDN"
  if [ -z "$APISECONDARY" ]
  then
    API_DOMAIN_NGINX="api-develop.$APPFQDN api-develop.$APPFQDNSECONDARY"
  else
    API_DOMAIN_NGINX="api-develop.$APPFQDN api-develop.$APPFQDNSECONDARY $APISECONDARY-develop.$APPFQDN $APISECONDARY-develop.$APPFQDNSECONDARY"
  fi
  CONFIG_FILE="develop.js"
fi

sed -i "s/==API_DOMAIN_PRIMARY/$APPFQDN/" /etc/nginx/conf.d/api.gmoji.conf
sed -i "s/==API_DOMAIN/$API_DOMAIN_NGINX/" /etc/nginx/conf.d/api.gmoji.conf
sed -i "s/==API_DOMAIN/$API_DOMAIN/" $DEPLOY_DIR/config/sdk/$CONFIG_FILE
sed -i "s/==API_DOMAIN/$API_DOMAIN/" $DEPLOY_DIR/pm2.json
sed -i "s/==ENVIRONMENT/$ENVIRONMENT/" $DEPLOY_DIR/pm2.json

sed -i "s/==ENVIRONMENT/$ENVIRONMENT/" /opt/gmoji/csv-parser/current/pm2.json
sed -i "s/==ENVIRONMENT/$ENVIRONMENT/" /opt/gmoji/file-exporter/current/pm2.json
sed -i "s/==API_DOMAIN/$API_DOMAIN/" /opt/gmoji/file-exporter/current/pm2.json
sed -i "s/==ENVIRONMENT/$ENVIRONMENT/" /opt/gmoji/url-cutter/current/pm2.json
sed -i "s/==API_DOMAIN/$API_DOMAIN/" /opt/gmoji/url-cutter/current/pm2.json

sed -i "s/==MONGODBPRIVATEIP/$MONGODBPRIVATEIP/" $DEPLOY_DIR/config/sdk/$CONFIG_FILE

exit 0
