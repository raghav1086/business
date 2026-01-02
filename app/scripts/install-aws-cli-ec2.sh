#!/bin/bash

# Install AWS CLI on EC2 (Amazon Linux, CentOS, RHEL)
# This script installs AWS CLI v2 (recommended) or falls back to yum package
# Usage: ./install-aws-cli-ec2.sh [method]
#   method: "v2" (default, recommended) or "yum" (older version)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

METHOD="${1:-v2}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}AWS CLI Installation for EC2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if AWS CLI is already installed
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    echo -e "${GREEN}✓ AWS CLI is already installed: $AWS_VERSION${NC}"
    echo -e "${YELLOW}  If you want to reinstall, uninstall first:${NC}"
    echo -e "${YELLOW}    sudo yum remove awscli -y  # For yum version${NC}"
    echo -e "${YELLOW}    sudo rm -rf /usr/local/bin/aws /usr/local/bin/aws_completer /usr/local/aws-cli  # For v2${NC}"
    exit 0
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    echo -e "${RED}✗ Cannot detect OS version${NC}"
    exit 1
fi

echo -e "${BLUE}Detected OS: $OS $OS_VERSION${NC}"
echo ""

if [ "$METHOD" = "v2" ]; then
    echo -e "${BLUE}Installing AWS CLI v2 (Recommended)...${NC}"
    echo ""
    
    # Install dependencies
    echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
    if command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y unzip curl
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update -y
        sudo apt-get install -y unzip curl
    else
        echo -e "${RED}✗ Package manager not found (yum or apt-get)${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
    echo ""
    
    # Download AWS CLI v2
    echo -e "${YELLOW}Step 2: Downloading AWS CLI v2...${NC}"
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    echo -e "${GREEN}  ✓ Download complete${NC}"
    echo ""
    
    # Unzip and install
    echo -e "${YELLOW}Step 3: Installing AWS CLI v2...${NC}"
    unzip -q awscliv2.zip
    sudo ./aws/install
    echo -e "${GREEN}  ✓ Installation complete${NC}"
    echo ""
    
    # Cleanup
    rm -rf awscliv2.zip aws/
    echo -e "${GREEN}  ✓ Cleanup complete${NC}"
    
elif [ "$METHOD" = "yum" ]; then
    echo -e "${BLUE}Installing AWS CLI using Yum (Older version)...${NC}"
    echo ""
    
    if ! command -v yum &> /dev/null; then
        echo -e "${RED}✗ Yum package manager not found${NC}"
        echo -e "${YELLOW}  This method only works on Amazon Linux, CentOS, or RHEL${NC}"
        exit 1
    fi
    
    # For Amazon Linux 2, AWS CLI v1 is available in yum
    if [ "$OS" = "amzn" ]; then
        echo -e "${YELLOW}Installing AWS CLI from Amazon Linux repositories...${NC}"
        sudo yum update -y
        sudo yum install -y aws-cli
    else
        # For CentOS/RHEL, need to add EPEL or use pip
        echo -e "${YELLOW}Installing AWS CLI using pip (yum method not available)...${NC}"
        sudo yum install -y python3 python3-pip
        sudo pip3 install awscli --upgrade
    fi
    
    echo -e "${GREEN}  ✓ Installation complete${NC}"
    
else
    echo -e "${RED}✗ Invalid method: $METHOD${NC}"
    echo -e "${YELLOW}  Use 'v2' (recommended) or 'yum'${NC}"
    exit 1
fi

# Verify installation
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Verifying installation...${NC}"

if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    echo -e "${GREEN}✓ AWS CLI installed successfully!${NC}"
    echo -e "${GREEN}  Version: $AWS_VERSION${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "${YELLOW}  1. Configure AWS credentials:${NC}"
    echo -e "${BLUE}     aws configure${NC}"
    echo ""
    echo -e "${YELLOW}  2. Or set environment variables:${NC}"
    echo -e "${BLUE}     export AWS_ACCESS_KEY_ID='your-key'${NC}"
    echo -e "${BLUE}     export AWS_SECRET_ACCESS_KEY='your-secret'${NC}"
    echo -e "${BLUE}     export AWS_DEFAULT_REGION='ap-south-1'${NC}"
    echo ""
    echo -e "${YELLOW}  3. Test the installation:${NC}"
    echo -e "${BLUE}     aws sts get-caller-identity${NC}"
else
    echo -e "${RED}✗ Installation failed - AWS CLI not found in PATH${NC}"
    exit 1
fi

