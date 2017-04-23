#!/bin/bash
REMOTE_IP="$1"
REMOTE_USER="$2"
INSTALL_PATH="~/herms/backend"

REMOTE="$REMOTE_USER@$REMOTE_IP" 

# Main progrma
ssh $REMOTE "mkdir -p $INSTALL_PATH"

echo "Removing backend from PM2..."
ssh $REMOTE "pm2 stop Backend && pm2 delete Backend"

echo "SCP files in root repo..."
scp -Cq ../* $REMOTE:$INSTALL_PATH

echo "SCP ./src ..."
scp -rCq ../src $REMOTE:$INSTALL_PATH

echo "Running npm install.. this may take a while.."
ssh $REMOTE "cd $INSTALL_PATH && npm install"

echo "Starting backend..."
ssh $REMOTE "cd $INSTALL_PATH && pm2 start ./ecosystem.config.js && pm2 save"

echo "---------------------------------"
echo "       install done              "
echo "---------------------------------"