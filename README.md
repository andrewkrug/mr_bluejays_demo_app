# Securing the Cloud - Course Project

This project is part of the "Securing the Cloud" class curriculum.

## Project Files

- [Vulnerable Version](worst-version.yml) - Contains security vulnerabilities for educational purposes
- [Secure Version](best-version.yml) - Demonstrates security best practices

## Security Analysis - cfn_nag Scan Recommendations

### Running cfn_nag

To scan the CloudFormation templates for security vulnerabilities, install and run cfn_nag:

```bash
# Install cfn_nag (requires Ruby >= 2.7)
gem install cfn-nag

# Scan the vulnerable template
cfn_nag_scan --input-path worst-version.yml

# Scan the secure template for comparison
cfn_nag_scan --input-path best-version.yml
```

### Critical Security Vulnerabilities in worst-version.yml

#### 1. **S3 Bucket Public Access (Lines 13-17)**
- **Issue**: S3 bucket has all public access block settings disabled
- **Line Numbers**:
  - `BlockPublicAcls: false` (Line 14)
  - `BlockPublicPolicy: false` (Line 15)
  - `IgnorePublicAcls: false` (Line 16)
  - `RestrictPublicBuckets: false` (Line 17)
- **Risk**: HIGH - Allows unrestricted public access to bucket contents
- **Recommendation**: Enable all public access block settings to `true`

#### 2. **S3 Bucket Policy with Wildcard Principal (Line 28)**
- **Issue**: Bucket policy grants access to all principals (`"*"`)
- **Line Number**: `Principal: "*"` (Line 28)
- **Risk**: CRITICAL - Anyone on the internet can access objects in the Reports folder
- **Recommendation**: Restrict principal to specific AWS accounts, users, or roles

#### 3. **Missing S3 Bucket Encryption**
- **Issue**: No server-side encryption configured for S3 bucket
- **Line Numbers**: Properties block (Lines 12-17) lacks encryption configuration
- **Risk**: HIGH - Data at rest is not encrypted
- **Recommendation**: Add `BucketEncryption` property with AES256 or KMS encryption

#### 4. **Missing S3 Bucket Versioning**
- **Issue**: No versioning enabled on S3 bucket
- **Line Numbers**: Properties block (Lines 12-17) lacks versioning configuration
- **Risk**: MEDIUM - Cannot recover from accidental deletions or overwrites
- **Recommendation**: Add `VersioningConfiguration` with `Status: Enabled`

#### 5. **Security Group SSH Access from Internet (Lines 151-154)**
- **Issue**: SSH port 22 open to 0.0.0.0/0
- **Line Numbers**:
  - `FromPort: '22'` (Line 152)
  - `ToPort: '22'` (Line 153)
  - `CidrIp: 0.0.0.0/0` (Line 154)
- **Risk**: CRITICAL - Allows SSH brute force attacks from anywhere
- **Recommendation**: Restrict SSH access to specific IP ranges or use Systems Manager Session Manager

#### 6. **Overly Permissive IAM Policy (Lines 186-194)**
- **Issue**: IAM policy grants wildcard permissions
- **Line Numbers**:
  - `"logs:*"` with `Resource: "*"` (Lines 188-189)
  - `"s3:*"` on bucket (Lines 192-194)
- **Risk**: HIGH - Violates principle of least privilege
- **Recommendation**: Grant only specific required actions (e.g., `s3:GetObject`, `s3:PutObject`)

#### 7. **Missing ALB HTTPS Listener**
- **Issue**: Load balancer only has HTTP listener (Lines 292-303), no HTTPS
- **Line Number**: `Protocol: HTTP` (Line 303)
- **Risk**: HIGH - Traffic is not encrypted in transit
- **Recommendation**: Add HTTPS listener with TLS certificate

#### 8. **Hardcoded AMI ID (Line 7)**
- **Issue**: AMI ID hardcoded as default value
- **Line Number**: `Default: "ami-05676382cb2cd06ac"` (Line 7)
- **Risk**: MEDIUM - AMI may become outdated with unpatched vulnerabilities
- **Recommendation**: Use Systems Manager Parameter Store for dynamic AMI lookup

#### 9. **Hardcoded Sensitive Information in UserData (Line 258)**
- **Issue**: External API endpoint hardcoded in UserData script
- **Line Number**: `"echo export IRON_BANK_BACKUP_LOC=\"https://qvnq4nrle9.execute-api.us-east-1.amazonaws.com/dev/\""` (Line 258)
- **Risk**: MEDIUM - Sensitive configuration exposed in instance metadata
- **Recommendation**: Use Secrets Manager or Parameter Store for sensitive configuration

#### 10. **Missing CloudWatch Logs Configuration**
- **Issue**: No CloudWatch log groups or log streams configured
- **Risk**: MEDIUM - Limited visibility for security monitoring and compliance
- **Recommendation**: Configure CloudWatch Logs for application and system logs

#### 11. **No Network Segmentation**
- **Issue**: All resources in public subnets (Lines 81, 93, 105 - `MapPublicIpOnLaunch: True`)
- **Line Numbers**:
  - BlueJaysSubnet1: Line 81
  - BlueJaysSubnet2: Line 93
  - BlueJaysSubnet3: Line 105
- **Risk**: HIGH - Increases attack surface
- **Recommendation**: Use private subnets for compute resources with NAT Gateway for outbound traffic

#### 12. **Missing Security Group Egress Rules**
- **Issue**: No explicit egress rules defined for security groups
- **Risk**: LOW - Default allows all outbound traffic
- **Recommendation**: Define explicit egress rules for better control

### Summary of cfn_nag Severity Counts

Based on typical cfn_nag analysis of worst-version.yml:
- **Critical Violations**: 3 (SSH from internet, wildcard S3 principal, public S3 bucket)
- **High Violations**: 5 (No encryption, overly permissive IAM, no HTTPS, etc.)
- **Medium Violations**: 4 (Hardcoded values, missing versioning, no logs, etc.)
- **Low Violations**: 1 (Missing egress rules)

### Best Practices for Remediation

1. **Enable all S3 security features**: Encryption, versioning, access logging, and public access blocks
2. **Implement least privilege IAM**: Use specific actions and resource ARNs
3. **Secure network access**: Use private subnets, restrict SSH, implement HTTPS
4. **Use AWS services for secrets**: Parameter Store or Secrets Manager for sensitive data
5. **Enable comprehensive logging**: CloudWatch, S3 access logs, VPC Flow Logs
6. **Regular security scanning**: Integrate cfn_nag into CI/CD pipeline

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.