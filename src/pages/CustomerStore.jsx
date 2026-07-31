import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import CustomSelect from '../components/ui/CustomSelect';
import ImageKitUploader from '../components/ImageKitUploader';
import DatePicker from '../components/ui/DatePicker';
import { useAuth } from '../context/AuthContext';
import OrderReceiptModal from '../components/OrderReceiptModal';
import StoreFooter from '../components/StoreFooter';
import OrderLiveMap from '../components/OrderLiveMap';
import notify2Sound from '../../notification/notify2.mp3';
import {
  Navigation,
  Compass,
  ShoppingBag,
  Search,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  AlertCircle,
  IndianRupee,
  MapPin,
  Clock,
  PackageCheck,
  CreditCard,
  XCircle,
  ChevronDown,
  ShoppingCart,
  RefreshCw,
  User,
  Save,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Edit,
  Shield,
  Calendar,
  FileText,
  Plus,
  Minus,
  ArrowLeft,
  Home,
  Store as StoreIcon,
} from 'lucide-react';
import { io } from 'socket.io-client';

const CustomerStore = () => {
  const { user: authUser, updateUser } = useAuth();
  const [activeView, setActiveView] = useState('catalog'); // 'catalog' | 'orders' | 'profile'
  const [orderTab, setOrderTab] = useState('active'); // 'active' | 'completed'

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [liveLocation, setLiveLocation] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState(null);

  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [socketToast, setSocketToast] = useState(null);

  // Profile State
  const [profileData, setProfileData] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    password: '',
    phoneNumber: authUser?.phoneNumber || '',
    DOB: authUser?.DOB || '',
    profileImage: authUser?.profileImage || '',
  });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMyOrders();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/api/customer/profile');
      if (res.data.success) {
        setProfileData((prev) => ({
          ...prev,
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          phoneNumber: res.data.user.phoneNumber || '',
          DOB: res.data.user.DOB || '',
          profileImage: res.data.user.profileImage || '',
          password: '',
        }));
        updateUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        DOB: profileData.DOB,
        profileImage: profileData.profileImage,
      };
      if (profileData.password.trim()) {
        payload.password = profileData.password.trim();
      }

      const res = await axiosInstance.put('/api/customer/profile', payload);

      if (res.data.success) {
        setMessage('Profile details updated successfully!');
        setProfileData((prev) => ({ ...prev, password: '' }));
        updateUser(res.data.user);
        setIsEditingProfile(false);
        setTimeout(() => setMessage(''), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    // Socket.io Real-Time Client Connection — use env var in production
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    // Order status changed by admin (e.g. Pending → Dispatched → Delivered)
    socket.on('order_status_updated', (data) => {
      setSocketToast(`📦 Order Update: Status changed to ${(data.orderStatus || 'updated').toUpperCase()}`);
      fetchMyOrders();
      setTimeout(() => setSocketToast(null), 5000);
    });

    // Admin updated/added/deleted a product → refresh catalog
    socket.on('stock_updated', () => {
      fetchProducts();
    });

    socket.on('product_updated', () => {
      fetchProducts();
    });

    socket.on('product_added', () => {
      fetchProducts();
      fetchCategories();
    });

    socket.on('product_deleted', () => {
      fetchProducts();
    });

    // Admin toggled category active/inactive → hide/show products
    socket.on('category_status_updated', () => {
      fetchProducts();
      fetchCategories();
    });

    // Customer's own order was placed successfully (cross-tab sync)
    socket.on('new_order', (data) => {
      if (data?.customerId === authUser?._id) {
        fetchMyOrders();
      }
    });

    // Auto-refresh every 30 seconds as safety net (catches any missed socket events)
    const autoRefresh = setInterval(() => {
      fetchProducts();
      fetchMyOrders();
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(autoRefresh);
    };
  }, []);


  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/api/customer/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/api/customer/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await axiosInstance.get('/api/customer/orders');
      if (res.data.success) {
        setMyOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((i) => i.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        setError(`Cannot add more than ${product.stock} units of ${product.name}`);
        return;
      }
      setCart(
        cart.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl || '',
        },
      ]);
    }
    setMessage(`Added '${product.name}' to cart!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateCartQuantity = (index, delta) => {
    const targetItem = cart[index];
    if (!targetItem) return;
    const prod = products.find((p) => p._id === targetItem.productId);
    const maxStock = prod ? prod.stock : 999;

    const newQty = targetItem.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    if (newQty > maxStock) {
      setError(`Cannot add more than ${maxStock} units of ${targetItem.name}`);
      return;
    }
    setError('');
    setCart(
      cart.map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setMessage('Shopping cart cleared!');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingGps(true);
    setError('');
    setMessage('Detecting live GPS location...');

    const processPosition = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const addressText =
          data?.display_name || `GPS Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setShippingAddress(addressText);
        const locObj = {
          latitude: lat,
          longitude: lng,
          address: addressText,
          updatedAt: new Date().toISOString(),
        };
        setLiveLocation(locObj);
        setMessage('Live GPS location detected & address updated!');
      } catch (err) {
        const fallbackText = `GPS Position (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        setShippingAddress(fallbackText);
        setLiveLocation({
          latitude: lat,
          longitude: lng,
          address: fallbackText,
          updatedAt: new Date().toISOString(),
        });
        setMessage('Live GPS position captured!');
      } finally {
        setDetectingGps(false);
      }
    };

    const onError = (err) => {
      if (err.code === err.TIMEOUT || err.code === 3) {
        // High-accuracy timed out — retry with low accuracy (works better on mobile)
        setMessage('Retrying with network location...');
        navigator.geolocation.getCurrentPosition(
          processPosition,
          (err2) => {
            setError(`GPS Error: ${err2.message}. Please allow location access.`);
            setDetectingGps(false);
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      } else {
        setError(`GPS Error: ${err.message}. Please allow location access.`);
        setDetectingGps(false);
      }
    };

    // First attempt: high accuracy (GPS chip)
    navigator.geolocation.getCurrentPosition(
      processPosition,
      onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };


  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setError('');
      setCheckoutProcessing(true);

      const orderRes = await axiosInstance.post('/api/customer/orders', {
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        shippingAddress: shippingAddress || 'Home Address',
        paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : 'cash',
        liveLocation: liveLocation || null,
      });

      if (!orderRes.data.success) {
        setError(orderRes.data.message || 'Failed to place order');
        setCheckoutProcessing(false);
        return;
      }

      const createdDbOrder = orderRes.data.order;

      // Handle Razorpay Online Payment Flow
      if (paymentMethod === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          setError('Razorpay SDK failed to load. Please check internet connection.');
          setCheckoutProcessing(false);
          return;
        }

        const payOrderRes = await axiosInstance.post('/api/payment/create-order', {
          dbOrderId: createdDbOrder._id,
          amount: createdDbOrder.totalAmount,
        });

        if (!payOrderRes.data.success) {
          setError(payOrderRes.data.message || 'Failed to create Razorpay Order');
          setCheckoutProcessing(false);
          return;
        }

        const { keyId, razorpayOrder } = payOrderRes.data;

        const options = {
          key: keyId || 'rzp_test_SuTbMm0NMt6r8b',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'SmartStore POS',
          description: `Order #${createdDbOrder._id.slice(-6).toUpperCase()} Payment`,
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              const verifyRes = await axiosInstance.post('/api/payment/verify', {
                dbOrderId: createdDbOrder._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                setMessage('Payment Verified & Order Confirmed Successfully!');
                setCart([]);
                fetchProducts();
                fetchMyOrders();
                setActiveView('orders');
                setOrderTab('active');
                setSelectedOrderReceipt(verifyRes.data.order || createdDbOrder);
                try {
                  const audio = new Audio(notify2Sound);
                  audio.play().catch((e) => console.log('Notify2 sound info:', e));
                } catch (e) {
                  console.error(e);
                }
              }
            } catch (vErr) {
              setError(vErr.response?.data?.message || 'Payment signature verification failed');
            } finally {
              setCheckoutProcessing(false);
            }
          },
          prefill: {
            name: authUser?.name || 'Customer',
            email: authUser?.email || '',
            contact: authUser?.phoneNumber || '',
          },
          theme: {
            color: '#38bdf8',
          },
          modal: {
            ondismiss: function () {
              setCheckoutProcessing(false);
              setMessage('Payment window closed. Order is saved in My Orders tab.');
              setCart([]);
              fetchMyOrders();
              setActiveView('orders');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Cash on Delivery Flow
        setMessage('COD Order placed successfully!');
        setCart([]);
        fetchProducts();
        fetchMyOrders();
        setActiveView('orders');
        setOrderTab('active');
        setSelectedOrderReceipt(createdDbOrder);
        setCheckoutProcessing(false);
        try {
          const audio = new Audio(notify2Sound);
          audio.play().catch((e) => console.log('Notify2 sound info:', e));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
      setCheckoutProcessing(false);
    }
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // Filter Active vs Completed Orders
  const activeOrders = myOrders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'processing'
  );
  const completedOrders = myOrders.filter(
    (o) => o.orderStatus === 'delivered' || o.orderStatus === 'completed' || o.orderStatus === 'cancelled'
  );

  return (
    <div className="storefront-main-container" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 16 }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 16px', flex: 1 }}>
        {/* Real-time Socket Toast Alert */}
        {socketToast && (
          <div
            className="alert-box"
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{socketToast}</span>
            <button onClick={() => setSocketToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {/* Header Bar with View Switcher */}
        <div
          className="neo-card"
          style={{
            padding: '16px 20px',
            marginBottom: 16,
            background: 'var(--neo-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-badge" style={{ background: '#0f172a', color: '#ffffff', padding: '6px 8px' }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Smart Storefront</h2>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                Browse store products, build cart, and track live order status
              </p>
            </div>
          </div>

          <div className="storefront-nav-buttons">
            <button
              onClick={() => setActiveView('catalog')}
              className={`shadcn-btn ${activeView === 'catalog' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <StoreIcon size={16} /> Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveView('cart')}
              className={`shadcn-btn ${activeView === 'cart' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={16} /> Shopping Cart
              {cart.length > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: 999,
                    padding: '2px 7px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    marginLeft: 6,
                    border: '1.5px solid #0f172a',
                  }}
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveView('orders');
                fetchMyOrders();
              }}
              className={`shadcn-btn ${activeView === 'orders' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <PackageCheck size={16} /> My Orders ({myOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveView('profile');
                fetchProfile();
              }}
              className={`shadcn-btn ${activeView === 'profile' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <User size={16} /> My Profile
            </button>
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

        {/* VIEW 1: PRODUCT CATALOG & SHOPPING CART */}
        {activeView === 'catalog' && (
          <>
            <style>{`
              @keyframes skeletonPulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
              .skeleton-card {
                animation: skeletonPulse 1.5s infinite ease-in-out;
              }
            `}</style>

            {/* Search Bar + Category Pill Filter — Deeply Responsive & Sticky */}
            <div
              className="neo-card"
              style={{
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'sticky',
                top: 70, // Sticks below the 70px sticky main navbar
                zIndex: 50,
                background: '#ffffff',
              }}
            >
              {/* Search Input - full width */}
              <Input
                placeholder="Search store catalog..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />

              {/* Category Pills - horizontally scrollable on mobile */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  flexWrap: 'nowrap',
                }}
              >
                {/* All Categories pill */}
                <button
                  onClick={() => setSelectedCategory('')}
                  style={{
                    flexShrink: 0,
                    padding: '6px 16px',
                    borderRadius: 999,
                    border: '2px solid #0f172a',
                    background: selectedCategory === '' ? '#0f172a' : '#ffffff',
                    color: selectedCategory === '' ? '#fbbf24' : '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedCategory === '' ? '2px 2px 0px #f59e0b' : '2px 2px 0px #e2e8f0',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Items
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 16px',
                      borderRadius: 999,
                      border: '2px solid #0f172a',
                      background: selectedCategory === cat._id ? '#0f172a' : '#ffffff',
                      color: selectedCategory === cat._id ? '#fbbf24' : '#0f172a',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: selectedCategory === cat._id ? '2px 2px 0px #f59e0b' : '2px 2px 0px #e2e8f0',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.name || cat.categoryName}
                  </button>
                ))}
              </div>
            </div>

            {/* Full-width Deeply Responsive Grid with Skeleton Loading State */}
            {loading ? (
              <div className="store-products-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="neo-card skeleton-card"
                    style={{
                      padding: 0,
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 14,
                      overflow: 'hidden',
                      height: 330,
                    }}
                  >
                    <div style={{ width: '100%', height: 170, background: '#e2e8f0', borderBottom: '2.5px solid #0f172a' }} />
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ height: 16, background: '#cbd5e1', borderRadius: 4, width: '70%', marginBottom: 8 }} />
                        <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '90%', marginBottom: 4 }} />
                        <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '50%' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ height: 20, background: '#cbd5e1', borderRadius: 4, width: '40%' }} />
                          <div style={{ height: 20, background: '#cbd5e1', borderRadius: 4, width: '30%' }} />
                        </div>
                        <div style={{ height: 36, background: '#cbd5e1', borderRadius: 8, width: '100%' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="store-products-grid">
                {products
                  .filter((prod) => {
                    const lowerSearch = search.toLowerCase();
                    const matchesSearch = prod.name.toLowerCase().includes(lowerSearch) || prod.description?.toLowerCase().includes(lowerSearch);
                    
                    // Extract category ID (handles populated category object or raw ID string/ObjectId)
                    const prodCatId = prod.category?._id || prod.category;
                    const matchesCategory = !selectedCategory || selectedCategory === 'all'
                      ? true
                      : (prodCatId && prodCatId.toString() === selectedCategory.toString());

                    return matchesSearch && matchesCategory;
                  })
                  .map((prod) => (
                    <div
                      key={prod._id}
                      className="neo-card"
                      style={{
                        padding: 0,
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        opacity: (prod.stock <= 0 || prod.category?.isActive === false) ? 0.85 : 1,
                      }}
                    >
                      {/* Product Image or Default Icon */}
                      <div style={{ position: 'relative', width: '100%', height: 170, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '12px', flexShrink: 0, borderBottom: '2.5px solid #0f172a' }}>
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--neo-yellow)' }}>
                            <ShoppingBag size={48} color="#0f172a" style={{ opacity: 0.4 }} />
                          </div>
                        )}

                        {/* Out of Stock Overlay Banner */}
                        {(prod.stock <= 0 || prod.category?.isActive === false) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(15, 23, 42, 0.45)',
                              backdropFilter: 'blur(4px)',
                              WebkitBackdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                            }}
                          >
                            <span
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: '2.5px solid #0f172a',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                boxShadow: '3px 3px 0px #0f172a',
                              }}
                            >
                              {prod.category?.isActive === false ? 'Not Available' : 'Out of Stock'}
                            </span>
                          </div>
                        )}

                        {/* Low Stock Badge */}
                        {prod.stock > 0 && prod.stock <= 5 && prod.category?.isActive !== false && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: '#fca5a5',
                              color: '#7f1d1d',
                              fontWeight: 900,
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: '1.5px solid #0f172a',
                              zIndex: 10,
                            }}
                          >
                            Low Stock!
                          </span>
                        )}
                      </div>

                      {/* Product Info Body */}
                      <div style={{ padding: '14px 14px 12px 14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 4, lineHeight: 1.3 }}>{prod.name}</h4>
                          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 0, lineHeight: 1.5 }}>
                            {prod.description || 'Quality store product'}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                              ₹{prod.price}
                            </span>
                            <span
                              style={{
                                background: (prod.stock <= 0 || prod.category?.isActive === false) ? '#fca5a5' : prod.stock <= 5 ? '#fef08a' : '#38bdf8',
                                color: '#0f172a',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                border: '1.5px solid #0f172a',
                              }}
                            >
                              {prod.category?.isActive === false ? 'Not Available' : prod.stock <= 0 ? 'Out of Stock' : `${prod.stock} in stock`}
                            </span>
                          </div>

                          <Button
                            onClick={() => {
                              if (prod.category?.isActive === false) {
                                setError(`⚠️ "${prod.name}" is currently unavailable because its category has been deactivated by the store administrator.`);
                                setTimeout(() => setError(''), 4500);
                                return;
                              }
                              if (prod.stock <= 0) {
                                setError(`⚠️ "${prod.name}" is currently out of stock. Please check back later.`);
                                setTimeout(() => setError(''), 4500);
                                return;
                              }
                              addToCart(prod);
                            }}
                            className={(prod.stock > 0 && prod.category?.isActive !== false) ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}
                            style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', cursor: (prod.stock <= 0 || prod.category?.isActive === false) ? 'not-allowed' : 'pointer' }}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {products.length === 0 && !loading && (
              <div className="neo-card" style={{ padding: 28, textAlign: 'center', fontWeight: 700, color: '#64748b', marginTop: 16 }}>
                No products found matching your search.
              </div>
            )}
          </>
        )}

        {/* VIEW 1.5: DEDICATED FULL SHOPPING CART DESK */}
        {activeView === 'cart' && (
          <div className="neo-card" style={{ padding: 20 }}>
            {/* Header with Back to Store / Home and Clear Cart */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button
                  onClick={() => setActiveView('catalog')}
                  className="shadcn-btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  <ArrowLeft size={16} /> Back to Store
                </Button>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Shopping Cart Desk</h3>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                    Review selected products, adjust quantities, and checkout with Razorpay or COD
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <Button
                  onClick={clearCart}
                  className="shadcn-btn-danger"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Trash2 size={15} /> Clear Entire Cart
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 14, border: '2px dashed #cbd5e1' }}>
                <ShoppingCart size={54} color="#94a3b8" style={{ marginBottom: 12 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Your Shopping Cart is Empty</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: 18 }}>
                  Explore our products catalog and add items to your cart!
                </p>
                <Button onClick={() => setActiveView('catalog')} className="shadcn-btn-primary" style={{ padding: '10px 20px' }}>
                  <Home size={16} /> Go to Store Catalog
                </Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Left Column: Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Cart Items ({cart.length})</h4>
                  {cart.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#ffffff',
                        border: '2px solid #0f172a',
                        borderRadius: 12,
                        padding: '12px 14px',
                        boxShadow: '3px 3px 0px #0f172a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {/* Top Row: Product Icon/Image + Name + Price/unit + Trash Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1.5px solid #0f172a', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: 'var(--neo-yellow)',
                                border: '1.5px solid #0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                flexShrink: 0,
                              }}
                            >
                              <ShoppingBag size={18} />
                            </div>
                          )}

                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <strong style={{ fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>₹{item.price} / unit</span>
                          </div>
                        </div>

                        {/* Trash Delete Button */}
                        <button
                          onClick={() => removeFromCart(i)}
                          className="shadcn-btn shadcn-btn-danger"
                          style={{ padding: '5px 8px', flexShrink: 0 }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Bottom Row: Stepper Controls (Left) & Line Total (Right) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          paddingTop: 8,
                          borderTop: '1px dashed #e2e8f0',
                          gap: 10,
                        }}
                      >
                        {/* Stepper (+ / -) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '3px 6px', borderRadius: 8, border: '1.5px solid #0f172a' }}>
                          <button
                            onClick={() => updateCartQuantity(i, -1)}
                            className="shadcn-btn-secondary"
                            style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, cursor: 'pointer' }}
                            title="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontWeight: 900, fontSize: '0.9rem', minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(i, 1)}
                            className="shadcn-btn-secondary"
                            style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, cursor: 'pointer' }}
                            title="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Line Total Amount */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Subtotal:</span>
                          <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            ₹{item.price * item.quantity}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Checkout Summary Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '2px solid #0f172a',
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: '4px 4px 0px #0f172a',
                    height: 'fit-content',
                  }}
                >
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 14 }}>Order Summary</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <label className="shadcn-label" style={{ margin: 0 }}>DELIVERY SHIPPING ADDRESS</label>
                    <button
                      type="button"
                      onClick={handleDetectGpsLocation}
                      disabled={detectingGps}
                      style={{
                        background: 'var(--neo-cyan, #38bdf8)',
                        color: '#0f172a',
                        border: '1.5px solid #0f172a',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: '0.74rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '2px 2px 0px #0f172a',
                      }}
                    >
                      <Navigation size={12} color="#0f172a" /> {detectingGps ? 'Detecting...' : 'Detect Live GPS Location'}
                    </button>
                  </div>

                  <Input
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    icon={MapPin}
                    placeholder="Enter street, city, landmark, pincode"
                  />

                  {liveLocation && (
                    <>
                      <div
                        style={{
                          background: '#e0f2fe',
                          border: '1.5px solid #0f172a',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: '#0369a1',
                          marginTop: 6,
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Sparkles size={13} color="#0284c7" /> Live GPS Tracked: Lat {liveLocation.latitude?.toFixed(4)}, Lng {liveLocation.longitude?.toFixed(4)}
                      </div>

                      {/* Customer Interactive OpenStreetMap Live Map */}
                      <OrderLiveMap
                        location={liveLocation}
                        customerName={authUser?.name || 'Customer'}
                        height={220}
                      />
                    </>
                  )}

                  <div className="shadcn-input-group" style={{ marginTop: 12 }}>
                    <label className="shadcn-label">Select Payment Method</label>
                    <CustomSelect
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      options={[
                        { value: 'razorpay', label: 'Pay with Razorpay (UPI, Cards, NetBanking)' },
                        { value: 'cash', label: 'Pay with Cash on Delivery (COD)' },
                      ]}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--neo-yellow)',
                      border: '2px solid #0f172a',
                      boxShadow: '3px 3px 0px #0f172a',
                      borderRadius: 10,
                      margin: '16px 0',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>GRAND TOTAL:</span>
                    <strong style={{ fontWeight: 900, fontSize: '1.35rem' }}>₹{cartTotal}</strong>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    loading={checkoutProcessing}
                    className="shadcn-btn-primary"
                    style={{ width: '100%', padding: 12, fontSize: '0.9rem' }}
                  >
                    {paymentMethod === 'razorpay' ? (
                      <>
                        <CreditCard size={18} /> Pay with Razorpay (₹{cartTotal})
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} /> Pay with COD (₹{cartTotal})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MY ORDERS (ACTIVE & COMPLETED TABS) */}
        {activeView === 'orders' && (
          <div className="neo-card" style={{ padding: 20 }}>
            {/* Orders Sub-Tab Switcher */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setOrderTab('active')}
                className={`shadcn-btn ${orderTab === 'active' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Clock size={15} /> Active Orders ({activeOrders.length})
              </button>
              <button
                onClick={() => setOrderTab('completed')}
                className={`shadcn-btn ${orderTab === 'completed' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <PackageCheck size={15} /> Completed Orders ({completedOrders.length})
              </button>
            </div>

            {/* ACTIVE ORDERS LIST */}
            {orderTab === 'active' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeOrders.map((ord) => (
                  <div
                    key={ord._id}
                    style={{
                      background: '#fffbeb',
                      border: '2px solid #0f172a',
                      boxShadow: '3px 3px 0px #0f172a',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>Order #{ord._id.toString().slice(-6).toUpperCase()}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                          Placed on {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                        <span
                          style={{
                            background: '#fef08a',
                            color: '#854d0e',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: '1.5px solid #0f172a',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={12} /> {ord.orderStatus}
                        </span>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 0', margin: '8px 0' }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
                          <span>{it.name} (×{it.quantity})</span>
                          <span>₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-card-footer-top">
                        <span style={{ color: '#475569' }}>Payment: {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus})</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>Total: ₹{ord.totalAmount}</span>
                      </div>
                      <div className="order-card-footer-bottom">
                        <Button
                          onClick={() => setSelectedOrderReceipt(ord)}
                          className="shadcn-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <FileText size={14} /> View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {activeOrders.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 700, padding: 24 }}>
                    No active pending orders. Your placed orders will appear here!
                  </p>
                )}
              </div>
            )}

            {/* COMPLETED ORDERS LIST */}
            {orderTab === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completedOrders.map((ord) => (
                  <div
                    key={ord._id}
                    style={{
                      background: '#f0fdf4',
                      border: '2px solid #0f172a',
                      boxShadow: '3px 3px 0px #0f172a',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>Order #{ord._id.toString().slice(-6).toUpperCase()}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                          Placed on {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        style={{
                          background: ord.orderStatus === 'cancelled' ? '#fca5a5' : '#4ade80',
                          color: '#0f172a',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          border: '1.5px solid #0f172a',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {ord.orderStatus === 'cancelled' ? (
                          <>
                            <AlertCircle size={12} /> Cancelled
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} /> Completed
                          </>
                        )}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '10px 0', margin: '8px 0' }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
                          <span>{it.name} (×{it.quantity})</span>
                          <span>₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-card-footer-top">
                        <span style={{ color: '#475569' }}>Payment: {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus})</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>Total: ₹{ord.totalAmount}</span>
                      </div>
                      <div className="order-card-footer-bottom">
                        <Button
                          onClick={() => setSelectedOrderReceipt(ord)}
                          className="shadcn-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <FileText size={14} /> View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {completedOrders.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 700, padding: 24 }}>
                    No completed or past order history yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY PROFILE SECTION */}
        {activeView === 'profile' && (
          <div className="neo-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {profileData.profileImage && !profileData.profileImage.startsWith('blob:') ? (
                  <img
                    src={profileData.profileImage}
                    alt={profileData.name}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #0f172a' }}
                  />
                ) : (
                  <div
                    className="brand-badge"
                    style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--neo-yellow)' }}
                  >
                    <User size={24} color="#0f172a" />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profileData.name || authUser?.name || 'Customer User'}</h3>
                  <span
                    style={{
                      background: 'var(--neo-cyan)',
                      color: '#0f172a',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 11,
                      border: '1.5px solid #0f172a',
                      textTransform: 'uppercase',
                    }}
                  >
                    Customer Account
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="shadcn-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Edit size={14} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Customer Profile'}
              </Button>
            </div>

            {/* EDIT PROFILE FORM */}
            {isEditingProfile ? (
              <form
                onSubmit={handleProfileSubmit}
                style={{
                  background: '#f8fafc',
                  border: 'var(--neo-border)',
                  boxShadow: '4px 4px 0px var(--neo-dark)',
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 12,
                }}
              >
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>Update Customer Profile Details</h4>

                {/* Profile Image Uploader */}
                <div style={{ marginBottom: 14 }}>
                  <ImageKitUploader
                    label="Upload Profile Photo (ImageKit)"
                    currentImage={profileData.profileImage}
                    onUploadSuccess={(url) => setProfileData({ ...profileData, profileImage: url })}
                  />
                </div>

                <div className="form-grid-2col">
                  <Input
                    label="Full Name *"
                    icon={User}
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Email Address *"
                    type="email"
                    icon={Mail}
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2col" style={{ marginTop: 12 }}>
                  <Input
                    label="Phone Number"
                    icon={Phone}
                    placeholder="e.g. 9876543210"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  />

                  <div>
                    <DatePicker
                      label="Date of Birth"
                      value={profileData.DOB}
                      onChange={(date) => setProfileData({ ...profileData, DOB: date })}
                    />
                  </div>
                </div>

                {/* Optional Password Field */}
                <div style={{ marginTop: 12, position: 'relative' }}>
                  <Input
                    label="Change Password (Optional - Leave blank to keep current)"
                    type={showProfilePassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="Enter new strong password"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: 36,
                      background: 'none',
                      border: 'none',
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    {showProfilePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <Button type="button" onClick={() => setIsEditingProfile(false)} className="shadcn-btn-secondary" style={{ padding: '6px 12px' }}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={profileSaving} className="shadcn-btn-primary" style={{ padding: '6px 14px' }}>
                    <CheckCircle2 size={15} /> Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              /* DISPLAY PROFILE CARDS (Exact match to screenshot!) */
              <div className="form-grid-2col" style={{ gap: 12 }}>
                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={16} color="#0f172a" />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Email Address</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {profileData.email || authUser?.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={16} color="#0f172a" />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>User Role</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                        {authUser?.role || 'Customer'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Phone size={16} color="#0f172a" />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Phone Number</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        {profileData.phoneNumber || authUser?.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar size={16} color="#0f172a" />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Date of Birth</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        {profileData.DOB
                          ? new Date(profileData.DOB).toLocaleDateString()
                          : authUser?.DOB
                          ? new Date(authUser.DOB).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Receipt Modal for PDF, PNG, and JPG Downloads */}
        {selectedOrderReceipt && (
          <OrderReceiptModal
            order={selectedOrderReceipt}
            onClose={() => setSelectedOrderReceipt(null)}
          />
        )}
      </div>
      <div style={{ width: '100%', marginTop: 24 }}>
        <StoreFooter />
      </div>
    </div>
  );
};

export default CustomerStore;