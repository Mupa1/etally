# eTally LAN Access Guide

## 🌐 Accessing eTally on Your Local Area Network

Your eTally application is now configured to be accessible from other devices on your local network.

### 📍 Your Server Information

- **Server IP Address**: `192.168.178.72`
- **Main Application**: http://192.168.178.72
- **API Endpoint**: http://192.168.178.72:3000/api/v1

### 🔗 Access URLs

#### For Users (Main Application)

- **Primary URL**: http://192.168.178.72
- **Alternative**: http://192.168.178.72:80

#### For Developers/Administrators

- **API Documentation**: http://192.168.178.72:3000/api/v1
- **Database Admin (pgAdmin)**: http://192.168.178.72:5050
- **Monitoring (Grafana)**: http://192.168.178.72:3001
- **File Storage (MinIO)**: http://192.168.178.72:9001
- **Metrics (Prometheus)**: http://192.168.178.72:9090

### 🖥️ How to Access from Other Devices

1. **Ensure devices are on the same network**

   - All devices must be connected to the same WiFi network
   - Or connected to the same router/switch

2. **Open a web browser on any device**

   - Desktop computers
   - Laptops
   - Tablets
   - Mobile phones

3. **Navigate to the main application**
   - Type: `http://192.168.178.72` in the browser
   - The application should load normally

### 🔧 Troubleshooting

#### If you can't access the application:

1. **Check your IP address**

   ```bash
   # On Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows
   ipconfig
   ```

2. **Verify the services are running**

   ```bash
   docker ps
   ```

3. **Check firewall settings**

   - Ensure ports 80, 3000, 5050, 3001, 9000, 9001, 9090 are not blocked
   - On Mac: System Preferences > Security & Privacy > Firewall
   - On Windows: Windows Defender Firewall

4. **Test connectivity**

   ```bash
   # From another device, test if the server is reachable
   ping 192.168.178.72

   # Test if the web server is responding
   curl http://192.168.178.72
   ```

### 🔒 Security Considerations

#### Current Configuration

- The application is configured for LAN access only
- No external internet access required
- All services are bound to your local network

#### Recommended Security Measures

1. **Change default passwords** in the `.env` file
2. **Use HTTPS** for production deployments
3. **Restrict access** to specific IP ranges if needed
4. **Regular updates** of Docker images

### 📱 Mobile Access

The application is fully responsive and works on:

- **iOS Safari**
- **Android Chrome**
- **Tablet browsers**
- **Mobile web browsers**

### 🔄 Service Management

#### Start Services

```bash
docker-compose up -d
```

#### Stop Services

```bash
docker-compose down
```

#### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker logs etally-api
docker logs etally-frontend
```

#### Restart Services

```bash
docker-compose restart
```

### 🐛 Common Issues & Solutions

#### Issue: "This site can't be reached"

**Solution**: Check if the IP address is correct and services are running

#### Issue: Images not loading

**Solution**: The MinIO configuration has been updated to work with LAN access

#### Issue: CORS errors

**Solution**: CORS has been configured to allow LAN access

#### Issue: Database connection errors

**Solution**: Ensure all database services are healthy:

```bash
docker ps | grep -E "(database|redis|minio)"
```

### 📊 Service Status Check

Run this command to check all services:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output should show all services as "Up" or "Healthy".

### 🎯 Next Steps

1. **Test access** from different devices on your network
2. **Bookmark the URLs** for easy access
3. **Share the main URL** with team members: `http://192.168.178.72`
4. **Monitor logs** if you encounter any issues

### 📞 Support

If you encounter issues:

1. Check the service logs: `docker logs etally-api`
2. Verify network connectivity: `ping 192.168.178.72`
3. Ensure all services are running: `docker ps`

---

**Note**: This configuration is optimized for local network access. For production deployment with external access, additional security measures and configuration changes would be required.
