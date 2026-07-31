import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import CustomSelect from '../components/ui/CustomSelect';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  IndianRupee,
  User,
  Phone,
  Package,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const BillingDesk = () => {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [taxPercent, setTaxPercent] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [generatedBill, setGeneratedBill] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const triggerSuccessToast = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const prod = products.find((p) => p._id === selectedProduct);
    if (!prod) return;

    if (prod.stock < quantity) {
      setError(`Only ${prod.stock} items available in stock for ${prod.name}`);
      return;
    }
    setError('');

    const existingIndex = cart.findIndex((item) => item.productId === prod._id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += Number(quantity);
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: prod._id,
          name: prod.name,
          price: prod.price,
          quantity: Number(quantity),
        },
      ]);
    }
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - Number(discount));

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Please add at least one product to the bill.');
      return;
    }

    try {
      setError('');
      const payload = {
        customerName,
        customerPhone,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        taxPercent: Number(taxPercent),
        discount: Number(discount),
        paymentMethod,
      };

      const res = await axiosInstance.post('/api/admin/billing', payload);
      if (res.data.success) {
        setGeneratedBill(res.data.bill);
        triggerSuccessToast('Invoice generated successfully!');
        setCart([]);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bill');
    }
  };

  return (
    <div className="neo-auth-wrapper" style={{ alignItems: 'flex-start', paddingTop: 24 }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>
        {/* Header */}
        <div
          className="neo-card"
          style={{
            padding: '18px 24px',
            marginBottom: 20,
            background: 'var(--neo-yellow)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div className="brand-badge" style={{ background: '#0f172a', color: '#ffffff' }}>
            <Receipt size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Store Billing Desk (POS)</h2>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
              Create customer invoices, calculate totals, and reduce stock automatically
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="alert-box" style={{ background: '#4ade80', color: '#0f172a' }}>
            <Sparkles size={18} /> <span>{message}</span>
          </div>
        )}

        <div className="billing-responsive-grid">
          {/* Left Side: Cart Builder */}
          <div className="neo-card" style={{ padding: 20, overflow: 'visible' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16 }}>
              1. Customer & Inventory Item Selection
            </h3>

            <div className="form-grid-2col" style={{ marginBottom: 16 }}>
              <Input
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                icon={User}
              />
              <Input
                label="Customer Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                icon={Phone}
                placeholder="9876543210"
              />
            </div>

            {/* Product Selection Row with Pixel-Perfect Alignment */}
            <div className="item-select-row-responsive" style={{ marginTop: 8, marginBottom: 20 }}>
              <div className="shadcn-input-group" style={{ marginBottom: 0, flex: 2 }}>
                <label className="shadcn-label">Select Inventory Product</label>
                <CustomSelect
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  placeholder="-- Select Product --"
                  options={products.map((p) => ({
                    value: p._id,
                    label: `${p.name} (Price: ₹${p.price} | Stock: ${p.stock})`,
                    disabled: p.stock <= 0,
                  }))}
                />
              </div>

              <div className="shadcn-input-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="shadcn-label">QTY</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="shadcn-input"
                  style={{ height: 46, fontWeight: 700 }}
                />
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                className="shadcn-btn-primary"
                style={{ height: 46, padding: '0 20px', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add
              </Button>
            </div>

            {/* Cart Items Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 280 }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: 10, fontWeight: 800 }}>Product</th>
                    <th style={{ padding: 10, fontWeight: 800 }}>Price</th>
                    <th style={{ padding: 10, fontWeight: 800 }}>Qty</th>
                    <th style={{ padding: 10, fontWeight: 800 }}>Total</th>
                    <th style={{ padding: 10, fontWeight: 800 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{item.name}</td>
                      <td style={{ padding: 10, fontWeight: 800 }}>₹{item.price}</td>
                      <td style={{ padding: 10, fontWeight: 800 }}>{item.quantity}</td>
                      <td style={{ padding: 10, fontWeight: 800 }}>₹{item.price * item.quantity}</td>
                      <td style={{ padding: 10 }}>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="shadcn-btn shadcn-btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: 20, textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        No items added to billing cart yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Invoice Summary */}
          <div className="neo-card" style={{ padding: 20, background: '#ffffff', overflow: 'visible' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16 }}>
              2. Invoice Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1rem', fontWeight: 800 }}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="form-grid-2col" style={{ margin: '12px 0' }}>
              <Input
                label="Tax (%)"
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
              />

              <Input
                label="Discount (₹)"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="shadcn-input-group">
              <label className="shadcn-label">Payment Method</label>
              <CustomSelect
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'razorpay', label: 'Razorpay Online (UPI, Card, NetBanking)' },
                ]}
              />
            </div>

            <div
              style={{
                background: 'var(--neo-yellow)',
                border: '2px solid #0f172a',
                boxShadow: '3px 3px 0px #0f172a',
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Grand Total</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                ₹{grandTotal.toFixed(2)}
              </h2>
            </div>

            <Button
              onClick={handleGenerateBill}
              className="shadcn-btn-primary"
              style={{ width: '100%', marginTop: 20, padding: 14 }}
            >
              <CheckCircle size={18} /> Print & Save Invoice
            </Button>

            {/* Generated Bill Display Receipt */}
            {generatedBill && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: '#f8fafc',
                  border: '2px solid #0f172a',
                  borderRadius: 12,
                }}
              >
                <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>Invoice #{generatedBill.invoiceNumber}</h4>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Customer: {generatedBill.customerName}
                </p>
                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  Total Paid: ₹{generatedBill.grandTotal}
                </p>
                <Button
                  onClick={() => window.print()}
                  className="shadcn-btn-secondary"
                  style={{ width: '100%', marginTop: 10, padding: '8px 12px' }}
                >
                  <Printer size={16} /> Print Receipt
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDesk;