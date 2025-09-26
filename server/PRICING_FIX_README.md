# Carbon Credit Pricing Fix - Database Update Guide

## Problem Identified
The marketplace was showing inconsistent pricing:
- Some places showed `price * 2`
- Others showed just `price`
- Real carbon credit prices should be ₹1000-₹2500 per tonne (not ₹2-₹20)

## Frontend Fixed
✅ All pricing now uses consistent `credit.price` values
✅ Removed multipliers (*2, *20000) that caused confusion
✅ Changed currency symbol to ₹ (INR) throughout
✅ Cart totals now match individual item prices

## Database Updates Needed

### Option 1: Use the Seeding Script
Run the seeding script to populate realistic carbon credit data:

```bash
cd server
node scripts/seedCarbonCredits.js
```

This will:
- Clear existing credit listings
- Create 5 realistic credit listings with prices ₹1000-₹2000 per tonne
- Associate them with an existing or new NGO

### Option 2: Manual Database Update (MongoDB)

If you want to update existing data instead of replacing:

```javascript
// Connect to your MongoDB and run these queries

// Update existing credit listings to have realistic prices
db.creditListings.updateMany(
  {},
  { $mul: { price: 500 } } // Multiply current prices by 500 to make them realistic
)

// Or set specific realistic prices:
db.creditListings.updateMany(
  { price: { $lt: 100 } },
  { $set: { price: 1500 } } // Set low prices to ₹1500 per tonne
)
```

### Option 3: Quick Test Data
If you just want to test, you can manually create one credit:

```javascript
// Create a single test credit with realistic pricing
db.creditListings.insertOne({
  amount: 100,
  price: 1500, // ₹1500 per tonne
  status: 'FOR_SALE',
  ngoId: ObjectId("your_ngo_id_here"), // Replace with actual NGO ID
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Realistic Carbon Credit Prices (Global Reference)
- Forestry projects: ₹800-₹1,200 per tonne CO₂
- Renewable energy: ₹1,200-₹1,800 per tonne CO₂
- Clean technology: ₹1,800-₹2,500 per tonne CO₂
- Agricultural projects: ₹1,000-₹1,500 per tonne CO₂

## Payment Flow Verification
After updating the database:

1. **Marketplace Display**: Should show realistic prices (₹1000+ per tonne)
2. **Cart Total**: Should match sum of individual items  
3. **Payment Confirmation**: Should show correct subtotal before fees
4. **Final Payment**: Total = Subtotal + Platform Fee (5%) + GST (18%)

## Example Calculation
- 10 credits at ₹1,500/tonne = ₹15,000
- Platform fee (5%) = ₹750  
- GST on ₹15,750 (18%) = ₹2,835
- **Total Payment = ₹18,585**

The payment modal and receipt will now show realistic amounts that match actual carbon credit market prices.