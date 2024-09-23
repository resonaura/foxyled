#!/bin/bash

# Service name
SERVICE_NAME="foxyled"

# Automatically determine the path to Node.js
NODE_PATH=$(which node)

# Check if Node.js is installed
if [ -z "$NODE_PATH" ]; then
    echo "Node.js not found. Please make sure Node.js is installed."
    exit 1
fi

# Path to NPM
NPM_PATH=$(which npm)

# Check if npm is installed
if [ -z "$NPM_PATH" ]; then
    echo "npm not found. Please make sure npm is installed."
    exit 1
fi

# Working directory — current directory
WORKING_DIRECTORY=$(pwd)

# User name
USER=$(whoami)

# Save the current directory to a file for the `foxy` command
echo $WORKING_DIRECTORY > ~/.foxyled

# Create the service file
echo "Creating service file for $SERVICE_NAME..."

sudo bash -c "cat > /etc/systemd/system/$SERVICE_NAME.service << EOL
[Unit]
Description=FoxyLED Node.js Service
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=$WORKING_DIRECTORY
ExecStart=$NPM_PATH start
Restart=always
RestartSec=10
User=$USER
Environment=PATH=$(dirname $NODE_PATH):/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL"

# Reload systemd to update the configuration
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable the service to start on boot
echo "Enabling $SERVICE_NAME service to start on boot..."
sudo systemctl enable $SERVICE_NAME

# Start the service
echo "Starting $SERVICE_NAME service..."
sudo systemctl start $SERVICE_NAME

# Adding aliases to .bashrc
echo "Adding aliases for foxy-start, foxy-stop, foxy-reboot, and foxy..."

# Check if .bashrc exists
if [ -f ~/.bashrc ]; then
    # Add aliases to the end of .bashrc if they are not already there
    if ! grep -q "alias foxy-start=" ~/.bashrc; then
        echo "alias foxy-start='sudo systemctl start $SERVICE_NAME'" >> ~/.bashrc
        echo "alias foxy-stop='sudo systemctl stop $SERVICE_NAME'" >> ~/.bashrc
        echo "alias foxy-reboot='sudo systemctl restart $SERVICE_NAME'" >> ~/.bashrc
        echo "alias foxy='cd \$(cat ~/.foxyled)'" >> ~/.bashrc
    else
        echo "Aliases for FoxyLED already exist in .bashrc"
    fi
else
    # If .bashrc doesn't exist, create it and add aliases
    echo "alias foxy-start='sudo systemctl start $SERVICE_NAME'" >> ~/.bashrc
    echo "alias foxy-stop='sudo systemctl stop $SERVICE_NAME'" >> ~/.bashrc
    echo "alias foxy-reboot='sudo systemctl restart $SERVICE_NAME'" >> ~/.bashrc
    echo "alias foxy='cd \$(cat ~/.foxyled)'" >> ~/.bashrc
fi

# Apply the aliases to the current session
echo "Reloading .bashrc to apply aliases..."
source ~/.bashrc

echo "Setup complete! You can now use foxy, foxy-start, foxy-stop, and foxy-reboot."
