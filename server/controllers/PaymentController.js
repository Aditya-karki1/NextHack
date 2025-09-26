const Ngo = require("../models/Ngo");
const crypto = require("crypto");
const instance = require("../config/razorpay");

const subscribe = async (type, userId, res) => {
  try {
    if (!userId || !type) {
      return res.status(403).json({
        success: false,
        message: "fields are empty",
      });
    }

    const user = await Ngo.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user does not exist",
      });
    }

    if (type === "first") user.requestCall += 5;
    else if (type === "second") user.requestCall += 50;
    else if (type === "third") user.requestCall += 120;

    // Also increment credits balance in same proportion as requests (developer choice)
    const added = type === 'first' ? 5 : type === 'second' ? 50 : 120;
    user.credits = user.credits || {};
    user.credits.balance = (user.credits.balance || 0) + added;
    user.credits.lastUpdated = new Date();

    await user.save();

    // Return updated NGO object so frontend can refresh state without an extra fetch
    const fresh = await Ngo.findById(userId).lean();

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      requestCall: user.requestCall,
      ngo: fresh,
    });
  } catch (err) {
    console.error('[subscribe] error:', err && (err.stack || err));
    // Attempt to extract useful message from Razorpay error
    const msg = (err && err.error && (err.error.description || err.error.reason)) || err.message || 'Could not initiate order.';
    // Return structured debug info for development (avoid leaking sensitive info in production)
    return res.status(500).json({ success: false, message: msg, details: { error: err?.error || null, stack: err?.stack || null } });
  }
};

exports.capturePayment = async (req, res) => {
  console.log("IN CAPTURE PAYMENT BACKEND");
  const { type, amount } = req.body;
  const userId = req.user && req.user.id;

  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!type) return res.status(400).json({ success: false, message: 'Please select plan' });

  // Validate amount
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  console.log('AMOUNT (INR):', numericAmount);
  const options = {
    amount: Math.round(numericAmount * 100), // amount in paise
    currency: 'INR',
    receipt: (Date.now() + Math.floor(Math.random() * 10000)).toString(),
  };

  // Debug: environment and instance
  try {
    const keyPresent = !!process.env.RAZORPAY_KEY;
    const secretPresent = !!process.env.RAZORPAY_SECRET;
    console.log('[capturePayment] RAZORPAY_KEY present:', keyPresent, 'RAZORPAY_KEY (masked):', process.env.RAZORPAY_KEY ? String(process.env.RAZORPAY_KEY).slice(0, 6) + '***' : null);
    console.log('[capturePayment] RAZORPAY_SECRET present:', secretPresent, 'RAZORPAY_SECRET (masked):', process.env.RAZORPAY_SECRET ? '***' : null);
  } catch (e) {
    console.warn('[capturePayment] failed to read env vars', e);
  }

  console.log('OPTIONS: ', options);
  // Debug: inspect razorpay instance shape
  try {
    console.log('[capturePayment] razorpay instance exists?', !!instance, 'type:', typeof instance);
    if (instance) {
      try {
        console.log('[capturePayment] instance keys:', Object.keys(instance));
        console.log('[capturePayment] instance.orders present?', !!instance.orders, 'ordersType:', instance.orders ? typeof instance.orders : 'n/a');
        if (instance.orders) console.log('[capturePayment] orders keys:', Object.keys(instance.orders));
      } catch (e) {
        console.warn('[capturePayment] could not inspect instance keys', e);
      }
    }
  } catch (e) {
    console.warn('[capturePayment] error while logging instance', e);
  }
  try {
    if (!instance || !instance.orders || typeof instance.orders.create !== 'function') {
      console.error('[capturePayment] razorpay instance/orders.create not available', { instanceAvailable: !!instance, ordersAvailable: !!(instance && instance.orders) });
      return res.status(500).json({ success: false, message: 'Razorpay instance is not initialized on server (orders.create missing).' });
    }

    const paymentResponse = await instance.orders.create(options);
    console.log('PAYMENT RESPONSE: ', paymentResponse);
    return res.json({ success: true, order: paymentResponse });
  } catch (err) {
    console.error('[capturePayment] Razorpay error:', err && (err.stack || err));
    // Attempt to extract useful message from Razorpay error
    const msg = (err && err.error && (err.error.description || err.error.reason)) || err.message || 'Could not initiate order.';
    // Return structured debug info for development (avoid leaking in production)
    return res.status(500).json({ success: false, message: msg, details: err?.error || null });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type } = req.body;
  const userId = req.user && req.user.id;
  console.log('[verifyPayment] incoming payload:', { razorpay_order_id, razorpay_payment_id, razorpay_signature: !!razorpay_signature, type, userId });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !type) {
    console.warn('[verifyPayment] missing fields in verify payload');
    return res.status(400).json({ success: false, message: 'Payment Failed: missing fields' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(body.toString()).digest('hex');

  console.log('[verifyPayment] expectedSignature:', expectedSignature, 'provided:', razorpay_signature);

  if (expectedSignature === razorpay_signature) {
    console.log('[verifyPayment] signature match, subscribing user');
    await subscribe(type, userId, res);
    return; // subscribe already sent response
  }

  console.warn('[verifyPayment] signature mismatch');
  return res.status(400).json({ success: false, message: 'Payment Failed: signature mismatch' });
};

// --- Company payment handlers (reuse capture logic but do not perform NGO-specific subscribe) ---
exports.captureCompanyPayment = async (req, res) => {
  console.log('IN CAPTURE COMPANY PAYMENT BACKEND');
  console.log('[captureCompanyPayment] incoming request headers:', Object.keys(req.headers).reduce((acc, k) => ({ ...acc, [k]: req.headers[k]}), {}));
  console.log('[captureCompanyPayment] body snapshot:', { amount: req.body?.amount, metadata: req.body?.metadata });
  const { amount, metadata } = req.body;
  const userId = req.user && req.user.id;

  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  const options = {
    amount: Math.round(numericAmount * 100),
    currency: 'INR',
    receipt: (Date.now() + Math.floor(Math.random() * 10000)).toString(),
    notes: { metadata: JSON.stringify(metadata || {}) },
  };

  // Razorpay upper limit sanity check: ensure amount in paise is within reasonable bounds
  // Razorpay expects amount as integer paise; extremely large values will cause SDK/server to error.
  const amountInPaise = options.amount;
  const RAZORPAY_MAX_PAISA = 10000000000; // example: ₹100,000,000.00 in paise (10 billion paise)
  if (amountInPaise > RAZORPAY_MAX_PAISA) {
    console.warn('[captureCompanyPayment] requested amount exceeds server-side maximum', { amountInPaise });
    return res.status(400).json({ success: false, message: 'Amount exceeds maximum amount allowed.' });
  }

  try {
    console.log('[captureCompanyPayment] creating order with options:', options);
    if (!instance || !instance.orders || typeof instance.orders.create !== 'function') {
      console.error('[captureCompanyPayment] razorpay instance/orders.create not available');
      return res.status(500).json({ success: false, message: 'Razorpay instance is not initialized on server (orders.create missing).' });
    }

    const paymentResponse = await instance.orders.create(options);
    console.log('[captureCompanyPayment] PAYMENT RESPONSE: ', paymentResponse);
    return res.json({ success: true, order: paymentResponse });
  } catch (err) {
    console.error('[captureCompanyPayment] Razorpay error:', err && (err.stack || err));
    const msg = (err && err.error && (err.error.description || err.error.reason)) || err.message || 'Could not initiate order.';
    return res.status(500).json({ success: false, message: msg, details: err?.error || null });
  }
};

exports.verifyCompanyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata } = req.body;
  const userId = req.user && req.user.id;
  console.log('[verifyCompanyPayment] incoming payload sample:', { razorpay_order_id, razorpay_payment_id, razorpay_signature: !!razorpay_signature, metadata, userId });
  console.log('[verifyCompanyPayment] headers snapshot:', { authorization: req.headers['authorization'] });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    console.warn('[verifyCompanyPayment] missing fields in verify payload');
    return res.status(400).json({ success: false, message: 'Payment Failed: missing fields' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(body.toString()).digest('hex');

  console.log('[verifyCompanyPayment] expectedSignature:', expectedSignature, 'provided:', razorpay_signature);

  if (expectedSignature === razorpay_signature) {
    console.log('[verifyCompanyPayment] signature match');
    // Return success so frontend can proceed to call purchase route
    return res.status(200).json({ success: true, message: 'Payment verified', payment: { razorpay_order_id, razorpay_payment_id }, metadata: metadata || null });
  }

  console.warn('[verifyCompanyPayment] signature mismatch');
  return res.status(400).json({ success: false, message: 'Payment Failed: signature mismatch' });
};
