# Makefile for Mr. BlueJays Demo App CloudFormation Deployments

# Variables
STACK_NAME = bluejays-demo-stack
REGION = us-west-2
CAPABILITIES = CAPABILITY_IAM

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

.PHONY: help deploy-worst deploy-best update-to-best delete status validate-templates

# Default target - show help
help:
	@echo "$(GREEN)Mr. BlueJays CloudFormation Stack Management$(NC)"
	@echo ""
	@echo "Available targets:"
	@echo "  $(YELLOW)make deploy-worst$(NC)     - Deploy the vulnerable (worst) version"
	@echo "  $(YELLOW)make deploy-best$(NC)      - Deploy the secure (best) version (fresh deployment)"
	@echo "  $(YELLOW)make update-to-best$(NC)   - Update existing stack from worst to best version"
	@echo "  $(YELLOW)make delete$(NC)           - Delete the CloudFormation stack"
	@echo "  $(YELLOW)make status$(NC)           - Show current stack status"
	@echo "  $(YELLOW)make validate$(NC)         - Validate both CloudFormation templates"
	@echo ""
	@echo "Stack Name: $(STACK_NAME)"
	@echo "Region: $(REGION)"

# Deploy the worst (vulnerable) version
deploy-worst:
	@echo "$(YELLOW)Deploying worst version CloudFormation stack...$(NC)"
	@aws cloudformation create-stack \
		--stack-name $(STACK_NAME) \
		--template-body file://worst-version.yml \
		--region $(REGION) \
		--capabilities $(CAPABILITIES) \
		--on-failure ROLLBACK
	@echo "$(GREEN)Stack creation initiated. Use 'make status' to monitor progress.$(NC)"
	@echo "$(RED)WARNING: This deploys the VULNERABLE version with security issues!$(NC)"

# Deploy the best (secure) version as a new stack
deploy-best:
	@echo "$(GREEN)Deploying best version CloudFormation stack...$(NC)"
	@aws cloudformation create-stack \
		--stack-name $(STACK_NAME) \
		--template-body file://best-version.yml \
		--region $(REGION) \
		--capabilities $(CAPABILITIES) \
		--on-failure ROLLBACK
	@echo "$(GREEN)Secure stack creation initiated. Use 'make status' to monitor progress.$(NC)"

# Update existing stack from worst to best version
update-to-best:
	@echo "$(GREEN)Updating stack to best (secure) version...$(NC)"
	@aws cloudformation update-stack \
		--stack-name $(STACK_NAME) \
		--template-body file://best-version.yml \
		--region $(REGION) \
		--capabilities $(CAPABILITIES)
	@echo "$(GREEN)Stack update initiated. Use 'make status' to monitor progress.$(NC)"
	@echo "$(GREEN)This updates the stack to the SECURE version.$(NC)"

# Delete the CloudFormation stack
delete:
	@echo "$(RED)Deleting CloudFormation stack $(STACK_NAME)...$(NC)"
	@read -p "Are you sure you want to delete the stack? (y/N): " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		aws cloudformation delete-stack \
			--stack-name $(STACK_NAME) \
			--region $(REGION); \
		echo "$(YELLOW)Stack deletion initiated. Use 'make status' to monitor progress.$(NC)"; \
	else \
		echo "$(GREEN)Stack deletion cancelled.$(NC)"; \
	fi

# Show current stack status
status:
	@echo "$(YELLOW)Checking stack status...$(NC)"
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].StackStatus' \
		--output text 2>/dev/null || echo "Stack $(STACK_NAME) not found"

# Validate CloudFormation templates
validate:
	@echo "$(YELLOW)Validating CloudFormation templates...$(NC)"
	@echo "Validating worst-version.yml..."
	@aws cloudformation validate-template \
		--template-body file://worst-version.yml \
		--region $(REGION) > /dev/null && \
		echo "$(GREEN)✓ worst-version.yml is valid$(NC)" || \
		echo "$(RED)✗ worst-version.yml validation failed$(NC)"
	@echo "Validating best-version.yml..."
	@aws cloudformation validate-template \
		--template-body file://best-version.yml \
		--region $(REGION) > /dev/null && \
		echo "$(GREEN)✓ best-version.yml is valid$(NC)" || \
		echo "$(RED)✗ best-version.yml validation failed$(NC)"

# Wait for stack creation/update to complete
wait-complete:
	@echo "$(YELLOW)Waiting for stack operation to complete...$(NC)"
	@aws cloudformation wait stack-create-complete \
		--stack-name $(STACK_NAME) \
		--region $(REGION) 2>/dev/null || \
	aws cloudformation wait stack-update-complete \
		--stack-name $(STACK_NAME) \
		--region $(REGION) 2>/dev/null
	@echo "$(GREEN)Stack operation completed successfully!$(NC)"

# Get stack outputs
outputs:
	@echo "$(YELLOW)Stack Outputs:$(NC)"
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
		--output table 2>/dev/null || echo "No outputs found or stack doesn't exist"

# Quick deployment workflow: deploy worst, then update to best
demo-workflow:
	@echo "$(YELLOW)Running demo workflow: Deploy worst -> Update to best$(NC)"
	@$(MAKE) deploy-worst
	@echo "$(YELLOW)Waiting for initial deployment...$(NC)"
	@$(MAKE) wait-complete
	@echo "$(YELLOW)Now updating to secure version...$(NC)"
	@$(MAKE) update-to-best
	@echo "$(YELLOW)Waiting for update...$(NC)"
	@$(MAKE) wait-complete
	@echo "$(GREEN)Demo workflow completed!$(NC)"