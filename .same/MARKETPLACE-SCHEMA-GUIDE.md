# ✅ Safe Marketplace Schema Guide

## 📋 What This SQL Does

The SQL file `SAFE-MARKETPLACE-SCHEMA.sql` safely adds marketplace features **WITHOUT breaking your portal!**

---

## ✅ **SAFE Changes (Won't Break Portal):**

### **1. Extends Existing `profiles` Table**
- ✅ Adds `user_type` column (officiant, professional-writer, guest)
- ✅ Adds `wedding_date` for guest users
- ✅ Adds `partner_name` for couples
- ✅ Adds `location` convenience field
- ✅ **DOES NOT recreate or delete existing data!**

### **2. Creates NEW Tables** (Marketplace-only)
- ✅ `purchases` - tracks script purchases
- ✅ `favorites` - tracks favorite scripts
- ✅ `cart` - shopping cart items
- ✅ `reviews` - script reviews and ratings

### **3. Extends `user_files` Table** (Your Scripts Table)
- ✅ Adds marketplace columns: `category`, `language`, `tags`, `rating`, `review_count`
- ✅ Keeps all existing portal columns
- ✅ Scripts work for BOTH portal AND marketplace

---

## 🎯 **How It Works:**

### **Portal Side:**
```
Officiant uploads script → Saves to user_files table → Sets is_published = true
```

### **Marketplace Side:**
```
Browse scripts → Reads from user_files WHERE is_published = true → Shows in marketplace
```

### **Real-Time Sync:**
```
Portal publishes script → Marketplace sees it immediately! ✨
```

---

## 🚀 **How to Use:**

### **Step 1: Run the SQL**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `SAFE-MARKETPLACE-SCHEMA.sql`
4. Paste it into the SQL editor
5. Click **"Run"**

### **Step 2: Verify Tables**

Check that these tables exist:
- ✅ `profiles` (extended, not recreated)
- ✅ `user_files` (extended, not recreated)
- ✅ `purchases` (new)
- ✅ `favorites` (new)
- ✅ `cart` (new)
- ✅ `reviews` (new)

### **Step 3: Test Portal**

1. Login to your officiant portal
2. Go to **Scripts** → Upload/publish a script
3. ✅ Should still work perfectly!

### **Step 4: Test Marketplace**

1. Open marketplace
2. Browse scripts
3. ✅ Should see published scripts from portal!

---

## 📊 **Table Mapping:**

| Marketplace Needs | Portal Has | Solution |
|-------------------|------------|----------|
| `profiles` | ✅ Already exists | Extended with marketplace columns |
| `scripts` | ✅ `user_files` table | Added marketplace columns |
| `purchases` | ❌ Doesn't exist | Created new table |
| `favorites` | ❌ Doesn't exist | Created new table |
| `cart` | ❌ Doesn't exist | Created new table |
| `reviews` | ❌ Doesn't exist | Created new table |

---

## 🔑 **Key Features:**

### **1. Shared Scripts Table**
Both portal and marketplace use `user_files`:
```sql
-- Portal uploads script
INSERT INTO user_files (file_name, price, is_published, user_id)
VALUES ('Beautiful Wedding Script', 29.99, true, 'user-id-here');

-- Marketplace reads published scripts
SELECT * FROM user_files WHERE is_published = true;
```

### **2. User Types**
```sql
-- Officiants (portal users)
user_type = 'officiant'

-- Professional script writers (marketplace vendors)
user_type = 'professional-writer'

-- Guests browsing marketplace
user_type = 'guest'
```

### **3. Purchases**
```sql
-- Track who bought which script
INSERT INTO purchases (user_id, script_id, amount_paid)
VALUES ('buyer-id', 123, 29.99);
```

### **4. Reviews**
```sql
-- Users can review scripts they purchased
INSERT INTO reviews (user_id, script_id, rating, comment)
VALUES ('user-id', 123, 5, 'Amazing script!');

-- Rating auto-updates on user_files table
```

---

## ⚠️ **What's DIFFERENT from Original Marketplace SQL:**

| Original (DANGEROUS) | Safe Version (OURS) |
|---------------------|---------------------|
| `CREATE TABLE profiles` | `ALTER TABLE profiles` (extends existing) |
| `CREATE TABLE scripts` | Uses existing `user_files` table |
| New `id` column | Uses existing `user_id` column |
| Overwrites policies | Adds policies carefully |

---

## 🧪 **Testing Checklist:**

After running the SQL:

### **Portal Tests:**
- [ ] Login still works
- [ ] Upload script still works
- [ ] Publish script still works
- [ ] Profile loads correctly
- [ ] No errors in console

### **Marketplace Tests:**
- [ ] Browse scripts (should see published ones)
- [ ] View script details
- [ ] Add to cart
- [ ] Checkout (create guest account)
- [ ] View purchased scripts

### **Integration Tests:**
- [ ] Publish script in portal → Appears in marketplace
- [ ] Unpublish script in portal → Disappears from marketplace
- [ ] Update script price in portal → Price updates in marketplace

---

## 🆘 **Rollback (If Needed):**

If something goes wrong, you can remove marketplace features:

```sql
-- Remove marketplace columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS user_type;
ALTER TABLE profiles DROP COLUMN IF EXISTS wedding_date;
ALTER TABLE profiles DROP COLUMN IF EXISTS partner_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS location;

-- Drop marketplace tables
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS reviews;

-- Remove marketplace columns from user_files
ALTER TABLE user_files DROP COLUMN IF EXISTS category;
ALTER TABLE user_files DROP COLUMN IF EXISTS language;
ALTER TABLE user_files DROP COLUMN IF EXISTS tags;
ALTER TABLE user_files DROP COLUMN IF EXISTS preview_content;
ALTER TABLE user_files DROP COLUMN IF EXISTS rating;
ALTER TABLE user_files DROP COLUMN IF EXISTS review_count;
ALTER TABLE user_files DROP COLUMN IF EXISTS is_popular;
```

---

## ✅ **Benefits:**

1. ✅ **No data loss** - Existing portal data untouched
2. ✅ **Real-time sync** - Portal and marketplace share database
3. ✅ **One source of truth** - Scripts in one table
4. ✅ **Future-proof** - Easy to extend later
5. ✅ **Rollback-able** - Can undo if needed

---

## 🎯 **Next Steps:**

1. ✅ Run the safe SQL in Supabase
2. ✅ Test portal to ensure nothing broke
3. ✅ Update marketplace code to use `user_files` table
4. ✅ Deploy marketplace
5. ✅ Test integration

---

**Ready to run the SQL? It's SAFE!** 🛡️
