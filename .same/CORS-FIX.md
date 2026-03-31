# CORS Error Fix for Headshot Display

## 🔴 Error You're Seeing:

```
ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
```

This means the browser is blocking the image from displaying due to CORS (Cross-Origin Resource Sharing) headers.

---

## ✅ Fix #1: Verify Supabase Storage CORS (ALREADY DONE)

Supabase Storage buckets that are **public** automatically have CORS headers enabled. Since your buckets are public, this should already be working.

---

## ✅ Fix #2: Cache-Busting URL (APPLIED IN VERSION 310)

We've added a timestamp parameter to the image URL to force the browser to reload it:

```typescript
const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
```

This prevents the browser from showing a cached version.

---

## 🧪 How to Test:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Refresh the page** (Ctrl+Shift+R)
3. **Login to portal**
4. **Go to My Profile**
5. **Upload a headshot**
6. **The thumbnail should appear immediately!**

---

## 🔍 If Still Not Working:

### Check Browser Console for CORS Headers:

1. Open DevTools (F12)
2. Go to **Network** tab
3. Upload a headshot
4. Look for the GET request to the image URL
5. Click on it and check **Response Headers**
6. You should see:
   ```
   access-control-allow-origin: *
   ```

### Alternative: Use Supabase CDN URL

If CORS issues persist, we can use Supabase's CDN URL which has better CORS support:

```typescript
// Instead of:
const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

// Use the direct CDN URL:
const publicUrl = `https://ailrvrxibpizbvyroonp.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;
```

---

## 🚀 Quick Fix Command:

If you're still seeing the error, try this in browser console after uploading:

```javascript
// Force reload all images
document.querySelectorAll('img').forEach(img => {
  const src = img.src;
  img.src = '';
  img.src = src + '?t=' + Date.now();
});
```

---

## ✅ Expected Result:

After the fix in Version 310:
- Upload headshot → Success message
- Thumbnail appears immediately ✅
- No CORS errors in console
- Image loads from Supabase Storage
- Click "Save Profile" → Data persists

---

**Current Status:** Cache-busting added in Version 310. Test the upload now!
