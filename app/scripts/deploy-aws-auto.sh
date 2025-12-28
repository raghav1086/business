#!/bin/bash
set -e

# Configuration
REGION=${1:-ap-south-1}
KEY_NAME=${2:-business-app-key}
INSTANCE_TYPE=${3:-t3.small}
GIT_REPO="https://github.com/ashishnimrot/business.git"

echo "🚀 Automated AWS Deployment for Business App"
echo "=============================================="
echo "Region: $REGION"
echo "Key Name: $KEY_NAME"
echo "Instance Type: $INSTANCE_TYPE"
echo "Git Repo: $GIT_REPO"
echo ""

# Step 1: Verify AWS credentials
echo "🔍 Step 1/8: Verifying AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Step 2: Setup IAM (if needed)
echo "🔐 Step 2/8: Setting up IAM user..."
if ! aws iam get-user --user-name business-app-deployer &>/dev/null; then
    echo "Creating IAM user..."
    aws iam create-user --user-name business-app-deployer &>/dev/null
    
    # Create and attach policy
    cat > /tmp/business-app-policy.json << 'POLICY_EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "iam:GetUser",
        "iam:ListAttachedUserPolicies"
      ],
      "Resource": "*"
    }
  ]
}
POLICY_EOF
    
    POLICY_ARN=$(aws iam create-policy \
        --policy-name BusinessAppDeployPolicy \
        --policy-document file:///tmp/business-app-policy.json \
        --query 'Policy.Arn' --output text 2>/dev/null || \
        aws iam list-policies --query 'Policies[?PolicyName==`BusinessAppDeployPolicy`].Arn' --output text | head -1)
    
    aws iam attach-user-policy --user-name business-app-deployer --policy-arn "$POLICY_ARN" &>/dev/null
    echo "✅ IAM user created"
else
    echo "✅ IAM user exists"
fi
echo ""

# Step 3: Create/Check Key Pair
echo "🔑 Step 3/8: Setting up Key Pair..."
if ! aws ec2 describe-key-pairs --region $REGION --key-names $KEY_NAME &>/dev/null; then
    echo "Creating key pair..."
    mkdir -p ~/.ssh
    aws ec2 create-key-pair --region $REGION --key-name $KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/$KEY_NAME.pem
    chmod 400 ~/.ssh/$KEY_NAME.pem
    echo "✅ Key pair created: ~/.ssh/$KEY_NAME.pem"
else
    echo "✅ Key pair exists"
fi
echo ""

# Step 4: Get VPC and Subnet
echo "🌐 Step 4/8: Finding VPC and Subnet..."
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    VPC_ID=$(aws ec2 describe-vpcs --region $REGION --query 'Vpcs[0].VpcId' --output text)
fi
SUBNET_ID=$(aws ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text)
echo "✅ VPC: $VPC_ID, Subnet: $SUBNET_ID"
echo ""

# Step 5: Create Security Group
echo "🔒 Step 5/8: Creating Security Group..."
SG_ID=$(aws ec2 create-security-group \
    --region $REGION \
    --group-name business-app-beta-sg \
    --description "Business App Beta - Web App Public" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups --region $REGION \
    --filters "Name=group-name,Values=business-app-beta-sg" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Configure security group rules
aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 2>/dev/null || true
echo "✅ Security Group: $SG_ID"
echo ""

# Step 6: Get AMI
echo "🖼️  Step 6/8: Finding latest AMI..."
AMI_ID=$(aws ec2 describe-images \
    --region $REGION \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)

if [ "$AMI_ID" = "None" ] || [ -z "$AMI_ID" ]; then
    AMI_ID=$(aws ec2 describe-images \
        --region $REGION \
        --owners amazon \
        --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" "Name=state,Values=available" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)
fi
echo "✅ AMI: $AMI_ID"
echo ""

# Step 7: Create User Data Script
echo "📝 Step 7/8: Preparing deployment script..."
USER_DATA=$(cat <<'USERDATA_EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

set -e

echo "🚀 Starting automated Business App deployment..."

# Update system
sudo yum update -y -q

# Install Docker
echo "📦 Installing Docker..."
sudo yum install -y docker git curl
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
sudo yum install -y nodejs >/dev/null 2>&1

# Create app directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/business-app
sudo chown ec2-user:ec2-user /opt/business-app
cd /opt/business-app

# Clone repository
echo "📥 Cloning repository..."
sudo -u ec2-user git clone https://github.com/ashishnimrot/business.git . || {
    echo "⚠️  Repository clone failed, will retry..."
    sleep 10
    sudo -u ec2-user git clone https://github.com/ashishnimrot/business.git .
}

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Create production environment file
echo "⚙️  Creating environment configuration..."
cd /opt/business-app/app
sudo -u ec2-user cat > .env.production <<ENV_EOF
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENABLE_SYNC=true
ENV_EOF

# Build and deploy
echo "🔨 Building and deploying services..."
cd /opt/business-app/app

# Wait for Docker to be ready
echo "⏳ Waiting for Docker to be ready..."
for i in {1..30}; do
    if sudo docker ps &>/dev/null; then
        break
    fi
    sleep 2
done

# Build services
echo "🔨 Building Docker images (this may take 10-15 minutes)..."
sudo -u ec2-user docker-compose -f docker-compose.prod.yml build --no-cache || {
    echo "⚠️  Build failed, retrying..."
    sleep 10
    sudo -u ec2-user docker-compose -f docker-compose.prod.yml build --no-cache
}

# Start services
echo "🚀 Starting services..."
sudo -u ec2-user docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."
for i in {1..60}; do
    if sudo docker ps | grep -q business-postgres && sudo docker ps | grep -q business-auth; then
        echo "✅ Core services are starting..."
        break
    fi
    sleep 3
done

# Wait additional time for all services
sleep 60

# Verify database tables are created
echo "🔍 Verifying database setup..."
echo "⏳ Waiting for services to create database tables (this may take 1-2 minutes)..."

# Wait for services to initialize and create tables
for i in {1..40}; do
    # Check if auth service has created users table
    if sudo docker exec business-postgres psql -U postgres -d auth_db -c "\dt" 2>/dev/null | grep -q "users"; then
        echo "✅ Database tables are being created..."
        break
    fi
    sleep 3
done

# Final wait for all tables
sleep 30

# Verify all databases have tables
echo "🔍 Verifying all databases..."
for db in auth_db business_db party_db inventory_db invoice_db payment_db; do
    TABLE_COUNT=$(sudo docker exec business-postgres psql -U postgres -d $db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$TABLE_COUNT" != "0" ]; then
        echo "✅ $db: $TABLE_COUNT tables created"
    else
        echo "⚠️  $db: Tables may still be creating..."
    fi
done

# Setup Nginx
echo "🔧 Configuring Nginx..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

sudo tee /etc/nginx/conf.d/business-app.conf <<NGINX_EOF
upstream auth_service { server localhost:3002; }
upstream business_service { server localhost:3003; }
upstream party_service { server localhost:3004; }
upstream inventory_service { server localhost:3005; }
upstream invoice_service { server localhost:3006; }
upstream payment_service { server localhost:3007; }
upstream web_app { server localhost:3000; }

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://web_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/v1/auth/ {
        proxy_pass http://auth_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/business/ {
        proxy_pass http://business_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/party/ {
        proxy_pass http://party_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/inventory/ {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/invoice/ {
        proxy_pass http://invoice_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/payment/ {
        proxy_pass http://payment_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

# Test and restart Nginx
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx configured and started"
else
    echo "⚠️  Nginx configuration test failed, but continuing..."
fi

# Setup automatic backups
echo "💾 Setting up backups..."
sudo mkdir -p /opt/backups
sudo tee /home/ec2-user/backup.sh <<BACKUP_EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p \$BACKUP_DIR
docker exec business-postgres pg_dumpall -U postgres | gzip > \$BACKUP_DIR/db_backup_\$DATE.sql.gz
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
BACKUP_EOF

sudo chmod +x /home/ec2-user/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup.sh") | crontab -

# Create verification script
echo "📝 Creating verification script..."
sudo tee /home/ec2-user/verify-deployment.sh <<VERIFY_EOF
#!/bin/bash
cd /opt/business-app/app
bash scripts/verify-deployment.sh
VERIFY_EOF

sudo chmod +x /home/ec2-user/verify-deployment.sh

echo "✅ Deployment complete!"
echo "🌐 Application will be available at: http://\${PUBLIC_IP}"
echo ""
echo "📋 To verify deployment, run:"
echo "   /home/ec2-user/verify-deployment.sh"
USERDATA_EOF
)

# Encode user data (handle both Linux and macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64)
else
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64 -w 0)
fi

# Step 8: Launch EC2 Instance
echo "🚀 Step 8/8: Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --region $REGION \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --subnet-id $SUBNET_ID \
    --user-data "$USER_DATA_ENCODED" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=business-app-beta},{Key=Environment,Value=beta}]" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --query 'Instances[0].InstanceId' --output text)

echo "✅ Instance launched: $INSTANCE_ID"
echo ""

# Wait for instance
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT INITIATED!"
echo "═══════════════════════════════════════════════════════════════"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "⏳ Waiting for application to deploy (this may take 5-10 minutes)..."
echo "   The instance is:"
echo "   1. Installing Docker and dependencies"
echo "   2. Cloning repository from GitHub"
echo "   3. Building and deploying all services"
echo "   4. Configuring Nginx"
echo ""

# Monitor deployment
echo "📊 Monitoring deployment progress..."
for i in {1..60}; do
    sleep 10
    if ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 ec2-user@$PUBLIC_IP "docker ps | grep -q business-web-app" 2>/dev/null; then
        echo ""
        echo "✅ Services are running!"
        break
    fi
    if [ $((i % 6)) -eq 0 ]; then
        echo "   Still deploying... ($((i*10)) seconds elapsed)"
    fi
done

# Final check
echo ""
echo "🔍 Verifying deployment..."
sleep 10

if curl -s -f -m 5 "http://$PUBLIC_IP" > /dev/null 2>&1; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 Your application is live at:"
    echo "   http://$PUBLIC_IP"
    echo ""
    echo "📋 Access Information:"
    echo "   - Web App: http://$PUBLIC_IP"
    echo "   - API: http://$PUBLIC_IP/api/v1/*"
    echo "   - SSH: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
    echo ""
    echo "🔐 Security Notes:"
    echo "   - Backend services are internal only (not exposed)"
    echo "   - Only web app is accessible publicly"
    echo "   - All API calls go through Nginx reverse proxy"
    echo ""
    echo "📊 Check deployment status:"
    echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'docker ps'"
    echo ""
    echo "🔍 Verify deployment (recommended):"
    echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP '/home/ec2-user/verify-deployment.sh'"
    echo ""
    echo "📋 View logs:"
    echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs --tail=50'"
    echo ""
    echo "💡 Database tables are auto-created on service startup"
    echo "   All services use ENABLE_SYNC=true for automatic table creation"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
else
    echo ""
    echo "⚠️  Deployment may still be in progress..."
    echo "   Check status: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'docker ps'"
    echo "   View logs: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs'"
    echo "   Verify: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP '/home/ec2-user/verify-deployment.sh'"
    echo ""
    echo "🌐 Application URL: http://$PUBLIC_IP"
    echo "   (May take a few more minutes to be fully ready)"
    echo ""
    echo "💡 Note: Database tables are auto-created on first service start"
    echo "   Services will create tables automatically with ENABLE_SYNC=true"
fi

