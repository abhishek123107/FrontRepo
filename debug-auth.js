// Debug Authentication Script
// Run this in browser console to debug authentication

// 1. Check if token exists
console.log('🔍 Token Check:', {
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  currentUser: localStorage.getItem('current_user')
});

// 2. Check if token is valid
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

// 3. Test API call manually
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
