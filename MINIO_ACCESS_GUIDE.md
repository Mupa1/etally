# MinIO Access Guide

## 🗄️ **MinIO Object Storage Access**

MinIO is the file storage system used by eTally for storing party logos, observer documents, and other files.

### 🌐 **Web Interface Access**

**URL**: http://192.168.178.72:9001

**Login Credentials**:

- **Username**: `admin`
- **Password**: `secure_minio_password_123`

### 📁 **Available Buckets**

1. **`party-logos`** - Political party logos
2. **`observer-documents`** - Observer registration documents
3. **`form-34a-photos`** - Election form photos

### 🔧 **API Access**

**Endpoint**: http://192.168.178.72:9000

**Access Key**: `admin`
**Secret Key**: `secure_minio_password_123`

### 📱 **How to Access from Any Device**

1. **Open a web browser** on any device connected to your WiFi
2. **Navigate to**: `http://192.168.178.72:9001`
3. **Login** with the credentials above
4. **Browse files** in the different buckets

### 🖥️ **Command Line Access (Advanced)**

If you have MinIO client (`mc`) installed:

```bash
# Configure alias
mc alias set etally http://192.168.178.72:9000 admin secure_minio_password_123

# List buckets
mc ls etally

# List files in party-logos bucket
mc ls etally/party-logos

# Download a file
mc cp etally/party-logos/party-id/filename.jpg ./local-file.jpg

# Upload a file
mc cp ./local-file.jpg etally/party-logos/party-id/
```

### 🔍 **Troubleshooting**

#### If you can't access MinIO:

1. **Check if the service is running**:

   ```bash
   docker ps | grep minio
   ```

2. **Check MinIO logs**:

   ```bash
   docker logs etally-minio
   ```

3. **Verify network connectivity**:
   ```bash
   ping 192.168.178.72
   curl http://192.168.178.72:9001
   ```

#### If party logos aren't loading:

1. **Check the presigned URL** - it should start with `http://192.168.178.72:9000`
2. **Verify the file exists** in the `party-logos` bucket
3. **Check browser console** for any CORS or network errors

### 📊 **File Management**

- **Upload**: Use the web interface or API
- **Download**: Click on files in the web interface
- **Delete**: Use the web interface (be careful!)
- **Organize**: Files are organized by party ID in subdirectories

### 🔒 **Security Notes**

- **Change default passwords** for production use
- **MinIO is only accessible on your LAN** (not exposed to internet)
- **Files are stored locally** on your machine
- **Backup important files** regularly

### 🎯 **Common Use Cases**

1. **View uploaded party logos**:

   - Go to `party-logos` bucket
   - Browse by party ID folders
   - Click to view/download

2. **Upload files manually**:

   - Use the web interface upload button
   - Organize in appropriate bucket/folder

3. **Monitor storage usage**:
   - Check bucket sizes in the web interface
   - Clean up old/unused files

---

**Note**: MinIO is now properly configured to work with LAN access. Party logo uploads should work correctly from any device on your network.
