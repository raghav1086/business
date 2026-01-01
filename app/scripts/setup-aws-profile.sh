#!/bin/bash
# Setup AWS Profile as Default
# This script adds AWS_PROFILE=business-app to your shell configuration

set -e

echo "🔧 Setting up AWS Profile as Default"
echo "====================================="
echo ""

# Detect shell
SHELL_NAME=$(basename "$SHELL")
CONFIG_FILE=""

if [ "$SHELL_NAME" = "zsh" ]; then
    CONFIG_FILE="$HOME/.zshrc"
elif [ "$SHELL_NAME" = "bash" ]; then
    CONFIG_FILE="$HOME/.bashrc"
else
    echo "⚠️  Unsupported shell: $SHELL_NAME"
    echo "   Please manually add to your shell config:"
    echo "   export AWS_PROFILE=business-app"
    exit 1
fi

# Check if already configured
if grep -q "export AWS_PROFILE=business-app" "$CONFIG_FILE" 2>/dev/null; then
    echo "✅ AWS_PROFILE=business-app is already configured in $CONFIG_FILE"
    echo ""
    echo "To apply changes, run:"
    echo "   source $CONFIG_FILE"
    echo ""
    echo "Or open a new terminal window"
    exit 0
fi

# Add to config file
echo "" >> "$CONFIG_FILE"
echo "# AWS Profile - Set business-app as default" >> "$CONFIG_FILE"
echo "export AWS_PROFILE=business-app" >> "$CONFIG_FILE"

echo "✅ Added AWS_PROFILE=business-app to $CONFIG_FILE"
echo ""
echo "📋 Next steps:"
echo "   1. Reload your shell configuration:"
echo "      source $CONFIG_FILE"
echo ""
echo "   2. Or open a new terminal window"
echo ""
echo "   3. Verify it's set:"
echo "      echo \$AWS_PROFILE"
echo "      # Should output: business-app"
echo ""
echo "   4. Test AWS CLI:"
echo "      aws sts get-caller-identity"
echo "      # Should work without --profile flag"
echo ""

