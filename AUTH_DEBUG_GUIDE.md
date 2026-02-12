# Authentication Debugging Guide

## 🔍 **Debug Steps**

### **1. Check Browser Console**
Open browser console and run the debug script:

```javascript
// Copy and paste this in browser console
console.log('🔍 Token Check:', {
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  currentUser: localStorage.getItem('current_user')
});

// Check token validity
const token = localStorage.getItem('access_token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔑 Token Payload:', payload);
    console.log('⏰ Token Expires:', new Date(payload.exp * 1000));
    console.log('🚨 Token Expired:', Date.now() > payload.exp * 1000);
  } catch (e) {
    console.error('❌ Invalid token format:', e);
  }
} else {
  console.error('❌ No access token found');
}
```

### **2. Test API Call Manually**
```javascript
// Test API call with token
const token = localStorage.getItem('access_token');
fetch('https://backendrepo-5.onrender.com/api/accounts/profile/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('✅ API Response:', data))
.catch(error => console.error('❌ API Error:', error));
```

### **3. Common Issues & Solutions**

**Issue 1: Token not found**
- **Solution**: Login again to get a new token
- **Check**: Look at localStorage in browser dev tools

**Issue 2: Token expired**
- **Solution**: Token should auto-refresh, if not, logout and login again
- **Check**: Token expiration time in payload

**Issue 3: Invalid token format**
- **Solution**: Clear localStorage and login again
- **Check**: Token should have 3 parts separated by dots

**Issue 4: CORS issues**
- **Solution**: Backend CORS settings should include frontend URL
- **Check**: Network tab in browser dev tools

### **4. Backend Debugging**

Check Django logs for:
- Authentication errors
- CORS issues
- Token validation errors

### **5. Frontend Debugging**

Enhanced HTTP interceptor now logs:
- Token availability
- Token preview
- Request URLs
- Authentication status

## 🚀 **Testing Flow**

1. **Clear all localStorage**: `localStorage.clear()`
2. **Login with valid credentials**
3. **Check token is stored**: Look at localStorage
4. **Make API calls**: Should include Authorization header
5. **Monitor console logs**: Should show token being added to requests

## 🔧 **Quick Fix Commands**

```bash
# Clear browser storage
localStorage.clear();

# Force logout
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('current_user');

# Test login again
```

## 📱 **Expected Console Logs**

With enhanced debugging, you should see:
- `🌐 HTTP Request: https://backendrepo-5.onrender.com/api/accounts/profile/`
- `🔑 Token available: true`
- `🔐 Adding Bearer token to: https://backendrepo-5.onrender.com/api/accounts/profile/`
- `🔐 Token preview: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`

If you don't see these logs, the token is not being stored or retrieved properly.
