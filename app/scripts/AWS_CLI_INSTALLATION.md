# AWS CLI Installation Guide for EC2

This guide shows how to install AWS CLI on EC2 instances (Amazon Linux, CentOS, RHEL) using Yum or the recommended AWS CLI v2 installer.

## Quick Installation

### Option 1: Using the Installation Script (Recommended)

```bash
# Download and run the installation script
cd /opt/business-app/app/scripts
chmod +x install-aws-cli-ec2.sh
sudo ./install-aws-cli-ec2.sh v2    # Recommended: AWS CLI v2
# OR
sudo ./install-aws-cli-ec2.sh yum   # Older version via yum
```

### Option 2: Manual Installation

## Method 1: AWS CLI v2 (Recommended - Latest Version)

This is the recommended method as it provides the latest features and better performance.

### For Amazon Linux 2 / CentOS / RHEL:

```bash
# Step 1: Install dependencies
sudo yum update -y
sudo yum install -y unzip curl

# Step 2: Download AWS CLI v2
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Step 3: Unzip and install
unzip awscliv2.zip
sudo ./aws/install

# Step 4: Verify installation
aws --version

# Step 5: Cleanup
rm -rf awscliv2.zip aws/
```

## Method 2: Using Yum (Older Version)

### For Amazon Linux 2:

```bash
sudo yum update -y
sudo yum install -y aws-cli
aws --version
```

### For CentOS / RHEL:

Yum doesn't have AWS CLI in default repositories. Use pip instead:

```bash
sudo yum install -y python3 python3-pip
sudo pip3 install awscli --upgrade
aws --version
```

## Configure AWS Credentials

After installation, configure your AWS credentials:

### Option 1: Interactive Configuration

```bash
aws configure
```

You'll be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (e.g., `ap-south-1`)
- Default output format (e.g., `json`)

### Option 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID='your-access-key-id'
export AWS_SECRET_ACCESS_KEY='your-secret-access-key'
export AWS_DEFAULT_REGION='ap-south-1'
```

To make these permanent, add to `~/.bashrc` or `~/.bash_profile`:

```bash
echo 'export AWS_ACCESS_KEY_ID="your-access-key-id"' >> ~/.bashrc
echo 'export AWS_SECRET_ACCESS_KEY="your-secret-access-key"' >> ~/.bashrc
echo 'export AWS_DEFAULT_REGION="ap-south-1"' >> ~/.bashrc
source ~/.bashrc
```

### Option 3: IAM Role (Best for EC2)

If your EC2 instance has an IAM role with S3 permissions, you don't need to configure credentials manually. The AWS CLI will automatically use the instance's IAM role.

## Verify Installation

```bash
# Check version
aws --version

# Test credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls
```

## Troubleshooting

### "aws: command not found"

- Make sure the installation completed successfully
- Check if `/usr/local/bin` is in your PATH: `echo $PATH`
- Try: `sudo ln -s /usr/local/bin/aws /usr/bin/aws`

### "Unable to locate credentials"

- Run `aws configure` to set up credentials
- Or set environment variables (see above)
- Or attach an IAM role to your EC2 instance

### "Access Denied" errors

- Check your IAM user/role has S3 permissions
- Verify the bucket name is correct
- Check region matches your bucket region

## Using with Backup Scripts

Once AWS CLI is installed and configured, you can use the backup upload scripts:

```bash
cd /opt/business-app/app/scripts

# Backup and upload to S3
./backup-and-upload-to-s3.sh

# Or just upload existing backups
./upload-backup-to-s3.sh my-backup-bucket
```

## Uninstall (if needed)

### AWS CLI v2:
```bash
sudo rm -rf /usr/local/bin/aws
sudo rm -rf /usr/local/bin/aws_completer
sudo rm -rf /usr/local/aws-cli
```

### Yum version:
```bash
sudo yum remove aws-cli -y
```

### Pip version:
```bash
sudo pip3 uninstall awscli -y
```

