# Mobile Access Guide for eTally

## 📱 **Accessing eTally from Mobile Devices**

Your eTally application is fully configured for mobile access on your local area network.

### 🌐 **Access URLs**

**Main Application**: http://192.168.178.72

### 🔐 **Login Credentials**

**Election Manager** (Recommended for mobile):

- **Email**: `manager@elections.ke`
- **Password**: `Manager@2024!Secure`

**Super Admin** (If needed):

- **Email**: `admin@elections.ke`
- **Password**: `Admin@2024!Secure`

### 📱 **How to Access from Mobile**

1. **Connect your mobile device to the same WiFi network** as your computer
2. **Open any mobile browser** (Safari, Chrome, Firefox, etc.)
3. **Navigate to**: `http://192.168.178.72`
4. **Login** with the credentials above
5. **The application will work normally** with full mobile responsiveness

### 🔧 **Troubleshooting Mobile Access**

#### If you can't access the application:

1. **Check WiFi Connection**

   - Ensure your mobile device is connected to the same WiFi network
   - Try accessing other websites to verify internet connectivity

2. **Check the URL**

   - Make sure you're using: `http://192.168.178.72` (not https)
   - Don't add any port numbers to the main URL

3. **Clear Browser Cache**

   - Clear your mobile browser's cache and cookies
   - Try opening in an incognito/private browsing mode

4. **Check Network Connectivity**
   ```bash
   # From your computer, verify the server is running
   curl http://192.168.178.72:3000/health
   ```

#### If login fails:

1. **Use the correct credentials** (see above)
2. **Check for typos** in email and password
3. **Try the Election Manager account** first: `manager@elections.ke`
4. **Clear browser data** and try again

#### If the page doesn't load:

1. **Check if the server is running**:

   ```bash
   docker ps | grep etally
   ```

2. **Restart services if needed**:

   ```bash
   docker-compose restart
   ```

3. **Check firewall settings** on your computer

### 📊 **Mobile Features**

The eTally application is fully responsive and includes:

- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **Touch-Friendly Interface** - Optimized for touch interactions
- ✅ **Mobile Navigation** - Collapsible sidebar for mobile
- ✅ **Party Management** - Full CRUD operations
- ✅ **File Uploads** - Party logo uploads work on mobile
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Offline Capability** - Some features work offline

### 🔒 **Security Considerations**

- **LAN Only**: The application is only accessible on your local network
- **No Internet Required**: Works completely offline once loaded
- **Secure Authentication**: JWT-based authentication
- **HTTPS Available**: Can be configured for HTTPS in production

### 📱 **Supported Mobile Browsers**

- ✅ **Safari** (iOS)
- ✅ **Chrome** (Android/iOS)
- ✅ **Firefox** (Android/iOS)
- ✅ **Edge** (Android/iOS)
- ✅ **Samsung Internet** (Android)

### 🎯 **Mobile-Specific Tips**

1. **Add to Home Screen**: You can add the app to your home screen for quick access
2. **Landscape Mode**: Some features work better in landscape orientation
3. **Zoom**: Pinch to zoom if needed for better visibility
4. **Refresh**: Pull down to refresh data if needed

### 🚨 **Common Issues & Solutions**

#### Issue: "This site can't be reached"

**Solution**: Check WiFi connection and ensure you're using the correct IP address

#### Issue: "Login failed"

**Solution**: Use the correct credentials and clear browser cache

#### Issue: "Images not loading"

**Solution**: This was fixed - party logos should now load correctly on mobile

#### Issue: "Page looks broken"

**Solution**: Clear browser cache and refresh the page

### 📞 **Getting Help**

If you encounter issues:

1. **Check the server logs**:

   ```bash
   docker logs etally-api
   docker logs etally-frontend
   ```

2. **Verify network connectivity**:

   ```bash
   ping 192.168.178.72
   ```

3. **Test from computer first** to ensure the application is working

### 🎉 **Ready to Use!**

Your eTally application is now fully accessible from mobile devices. Simply navigate to `http://192.168.178.72` on any mobile device connected to your WiFi network and login with the provided credentials.

---

**Note**: The application is optimized for mobile use and provides the same functionality as the desktop version with a mobile-friendly interface.
