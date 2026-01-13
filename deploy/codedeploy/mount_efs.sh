#!/bin/sh

# Deployment variables
DEPLOY_DIR="/opt/gmoji/base/current"

# EFS Variables
MOUNT_DIR="/efs"

# Mount EFS
mkdir -p $MOUNT_DIR
chmod 775 $MOUNT_DIR

EC2_INSTANCE_ID=`curl -s http://169.254.169.254/latest/meta-data/instance-id`

# First run check
if [ ! -d "$MOUNT_DIR/static-content" ]
then
    # Get region name
    EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
    EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"

    # Get EFS mount point from the EC2 Parameter Store
    MOUNT_POINT=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/EFS_MOUNT_POINT --region $EC2_REGION --output text --query Parameters[0].Value`
    CODE_DEPLOY_BUCKET=`aws ssm get-parameters --no-with-decryption --names /$APPLICATION_NAME/$DEPLOYMENT_GROUP_NAME/CODE_DEPLOY_BUCKET --region $EC2_REGION --output text --query Parameters[0].Value`
    mount -t nfs -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport $MOUNT_POINT:/ $MOUNT_DIR || true 2>/dev/null

    mkdir -p $MOUNT_DIR/static-content
    aws s3 sync s3://$CODE_DEPLOY_BUCKET/static-content/ $MOUNT_DIR/static-content --region $EC2_REGION
    chown -R gmoji:gmoji $MOUNT_DIR/static-content
fi

# Create symlinks
rm -Rf $DEPLOY_DIR/files
ln -s $MOUNT_DIR/static-content/base-files $DEPLOY_DIR/files

rm -Rf $DEPLOY_DIR/json-storage
ln -s $MOUNT_DIR/static-content/json-storage $DEPLOY_DIR/json-storage

# Migrate logs to the shared storage
if [ ! -d "$MOUNT_DIR/logs/$EC2_INSTANCE_ID" ]
then
    mkdir -p $MOUNT_DIR/logs/$EC2_INSTANCE_ID/es $MOUNT_DIR/logs/$EC2_INSTANCE_ID/pm2 $MOUNT_DIR/logs/$EC2_INSTANCE_ID/nginx
    mv -f /var/log/es/* $MOUNT_DIR/logs/$EC2_INSTANCE_ID/es/
    rm -Rf /var/log/es
    ln -s $MOUNT_DIR/logs/$EC2_INSTANCE_ID/es /var/log/es
    systemctl restart gmoji-legacy-release gmoji-web-release gmoji-payment-release

    mv -f /home/gmoji/.pm2/logs/* $MOUNT_DIR/logs/$EC2_INSTANCE_ID/pm2/
    rm -Rf /home/gmoji/.pm2/logs
    ln -s $MOUNT_DIR/logs/$EC2_INSTANCE_ID/pm2 /home/gmoji/.pm2/logs
    chown -R gmoji:gmoji $MOUNT_DIR/logs/$EC2_INSTANCE_ID/pm2

    mv -f /var/log/nginx/* $MOUNT_DIR/logs/$EC2_INSTANCE_ID/nginx/
    rm -Rf /var/log/nginx
    ln -s $MOUNT_DIR/logs/$EC2_INSTANCE_ID/nginx /var/log/nginx
    chown -R nginx:nginx $MOUNT_DIR/logs/$EC2_INSTANCE_ID/nginx
fi

exit 0
