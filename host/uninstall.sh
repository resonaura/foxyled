#!/bin/bash

# Service name
SERVICE_NAME="foxyled"

# Stopping the service
echo "Stopping $SERVICE_NAME service..."
sudo systemctl stop $SERVICE_NAME

# Disabling the service from autostart
echo "Disabling $SERVICE_NAME service..."
sudo systemctl disable $SERVICE_NAME

# Removing the service file
echo "Removing $SERVICE_NAME service file..."
sudo rm /etc/systemd/system/$SERVICE_NAME.service

# Reloading systemd to update the configuration
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Removing aliases from .bashrc
echo "Removing aliases from .bashrc..."

if [ -f ~/.bashrc ]; then
    # Removing aliases for foxy, foxy-start, foxy-stop, and foxy-reboot
    sed -i '/alias foxy-start=/d' ~/.bashrc
    sed -i '/alias foxy-stop=/d' ~/.bashrc
    sed -i '/alias foxy-reboot=/d' ~/.bashrc
    sed -i '/alias foxy=/d' ~/.bashrc
fi

# Removing the stored working directory file
echo "Removing stored working directory..."
rm -f ~/.foxyled

# Applying the changes to the current session
echo "Reloading .bashrc to apply changes..."
source ~/.bashrc

echo "Uninstallation complete! The $SERVICE_NAME service and related aliases have been removed."
