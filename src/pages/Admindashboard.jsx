import React, { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import StoreFooter from '../components/StoreFooter';
import CustomSelect from '../components/ui/CustomSelect';
import ImageKitUploader from '../components/ImageKitUploader';
import OrderLiveMap from '../components/OrderLiveMap';
import notify1Sound from '../../notification/notify1.mp3';
import {
  IndianRupee,
  Package,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Clock,
  PackageCheck,
  PieChart,
  TrendingUp,
  Bell,
  Check,
  MapPin,
  X,
} from 'lucide-react';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'products' | 'categories' | 'orders' | 'profile'
  const [orderFilterTab, setOrderFilterTab] = useState('active'); // 'active' | 'completed'

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderLocations, setOrderLocations] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ===== NEW: Category Search State =====
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // ===== NEW: Mobile tab drawer state for deep responsiveness =====
  const [mobileTabOpen, setMobileTabOpen] = useState(false);


  // Audio unlock tracking — browsers block audio without user interaction
  const audioUnlockedRef = useRef(false);
  const pendingAudioRef = useRef(null);

  // Unlock audio on first user interaction anywhere on the page
  useEffect(() => {
    const unlock = () => {
      if (!audioUnlockedRef.current) {
        audioUnlockedRef.current = true;
        setSoundEnabled(true);
        // If there's a queued sound, play it now
        if (pendingAudioRef.current) {
          pendingAudioRef.current.play().catch(() => {});
          pendingAudioRef.current = null;
        }
      }
    };
    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const playNotify1 = useCallback(() => {
    try {
      const audio = new Audio(notify1Sound);
      audio.volume = 1;
      if (audioUnlockedRef.current) {
        audio.play().catch((e) => console.log('Audio play error:', e));
      } else {
        // Queue it — will play on next user interaction
        pendingAudioRef.current = audio;
      }
    } catch (e) {
      console.error('Audio init error:', e);
    }
  }, []);

  // Add Product Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
  });

  // Edit Product Form state
  const [editingProduct, setEditingProduct] = useState(null);

  // Add Category Form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', categoryName: '', description: '' });

  // Admin Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    DOB: user?.DOB ? new Date(user.DOB).toISOString().split('T')[0] : '',
    profileImage: user?.profileImage || '',
  });

  const triggerSuccessToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, prodRes, catRes, ordersRes] = await Promise.all([
        axiosInstance.get('/api/admin/dashboard'),
        axiosInstance.get('/api/admin/products'),
        axiosInstance.get('/api/admin/categories'),
        axiosInstance.get('/api/admin/orders'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-Time Admin Connection
    const socket = io('http://localhost:3001');

    socket.on('new_order', (data) => {
      setRealtimeNotification(
        `REAL-TIME ALERT: New Order #${data.orderNumber} placed by ${data.customerName} for ₹${data.totalAmount} (${data.paymentMethod.toUpperCase()})`
      );
      playNotify1();
      fetchData();
    });

    socket.on('order_location_update', (data) => {
      if (data.orderId) {
        setOrderLocations((prev) => ({
          ...prev,
          [data.orderId]: {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            updatedAt: data.updatedAt || new Date().toISOString(),
          },
        }));
      }
    });

    socket.on('order_status_updated', () => {
      fetchData();
    });

    socket.on('stock_updated', () => {
      fetchData();
    });

    socket.on('category_status_updated', () => {
      fetchData();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        DOB: user.DOB ? new Date(user.DOB).toISOString().split('T')[0] : '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  // Filter products by search query and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'all' ||
      (p.category && (p.category._id === selectedCategory || p.category === selectedCategory));

    return matchesSearch && matchesCat;
  });

  // ===== NEW: Filter categories by search query + status filter =====
  const filteredCategories = categories.filter((c) => {
    const q = categorySearchQuery.trim().toLowerCase();
    const name = (c.name || c.categoryName || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || desc.includes(q);

    const isActive = c.isActive !== false;
    const matchesStatus =
      categoryStatusFilter === 'all' ||
      (categoryStatusFilter === 'active' && isActive) ||
      (categoryStatusFilter === 'inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!newProduct.name || !newProduct.price) {
      setError('Product name and price are required.');
      return;
    }

    try {
      const payload = {
        name: newProduct.name.trim(),
        description: (newProduct.description || '').trim(),
        price: Number(newProduct.price),
        stock: newProduct.stock ? Number(newProduct.stock) : 0,
        category: newProduct.category ? newProduct.category : null,
        imageUrl: newProduct.imageUrl || '',
      };

      const res = await axiosInstance.post('/api/admin/products', payload);
      if (res.data.success) {
        triggerSuccessToast('Product added successfully!');
        setNewProduct({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        name: editingProduct.name.trim(),
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        category: editingProduct.category ? (typeof editingProduct.category === 'object' ? editingProduct.category._id : editingProduct.category) : null,
        imageUrl: editingProduct.imageUrl || '',
      };

      const res = await axiosInstance.put(`/api/admin/products/${editingProduct._id}`, payload);
      if (res.data.success) {
        triggerSuccessToast('Product updated successfully!');
        setEditingProduct(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/products/${id}`);
      if (res.data.success) {
        triggerSuccessToast('Product deleted successfully');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  //Imagekit

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');

    const nameToSubmit = (newCategory.name || newCategory.categoryName || '').trim();
    if (!nameToSubmit) {
      setError('Please enter a category name.');
      return;
    }

    try {
      const payload = {
        categoryName: nameToSubmit,
        name: nameToSubmit,
        description: (newCategory.description || '').trim(),
      };

      const res = await axiosInstance.post('/api/admin/categories', payload);
      if (res.data.success) {
        triggerSuccessToast('Category created successfully!');
        setNewCategory({ name: '', categoryName: '', description: '' });
        setShowCategoryForm(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axiosInstance.put(`/api/admin/orders/${orderId}`, { orderStatus: newStatus });
      if (res.data.success) {
        triggerSuccessToast(`Order marked as ${newStatus.toUpperCase()}`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    try {
      const res = await axiosInstance.put(`/api/admin/categories/${cat._id}`, {
        categoryName: cat.categoryName || cat.name,
        description: cat.description || '',
        isActive: !cat.isActive,
      });
      if (res.data.success) {
        triggerSuccessToast(
          `Category "${cat.categoryName || cat.name}" marked as ${!cat.isActive ? 'Active' : 'Inactive'}`
        );
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axiosInstance.put('/api/customer/profile', profileData);
      if (res.data.success) {
        triggerSuccessToast('Admin profile & photo updated successfully!');
        updateUser(res.data.user);
        setIsEditingProfile(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Filter Active vs Completed Orders for Admin
  const adminActiveOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'processing');
  const adminCompletedOrders = orders.filter((o) => o.orderStatus === 'delivered' || o.orderStatus === 'completed' || o.orderStatus === 'cancelled');

  // Tab config for cleaner mobile drawer
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: IndianRupee, count: null },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'categories', label: 'Categories', icon: Layers, count: categories.length },
    { id: 'profile', label: 'Profile', icon: User, count: null },
  ];

  return (
    <div className="admin-dashboard-root" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 16 }}>
      {/* ===== DEEP RESPONSIVE GLOBAL STYLES (aggressive override edition) ===== */}
      <style>{`
        /* ============================================================
           HARD RESET — scope everything to .admin-dashboard-root
           This overrides external .neo-card rules from styles.css
           and forces box-sizing / containment on every descendant.
           ============================================================ */
        .admin-dashboard-root,
        .admin-dashboard-root *,
        .admin-dashboard-root *::before,
        .admin-dashboard-root *::after {
          box-sizing: border-box !important;
        }

        .admin-dashboard-root {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          min-width: 0;
        }

        .admin-dashboard-inner {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px;
          flex: 1;
          min-width: 0;
        }

        /* ===== CRITICAL: override external .neo-card min-widths =====
           The global styles.css .neo-card class likely sets min-width
           which is what causes the horizontal overflow shown in the
           screenshots. We kill it here. */
        .admin-dashboard-root .neo-card {
          min-width: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        /* ============ HEADER BAR ============ */
        .admin-dashboard-root .admin-header-bar {
          padding: 16px 20px;
          margin-bottom: 16px;
          background: var(--neo-yellow, #fef08a);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .admin-header-bar h2 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .admin-dashboard-root .admin-header-bar p {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin: 4px 0 0;
          word-break: break-word;
        }

        /* ============ TAB GROUP (desktop) ============ */
        .admin-dashboard-root .dashboard-tab-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .dashboard-tab-group .shadcn-btn {
          padding: 7px 12px;
          font-size: 0.8rem;
          white-space: nowrap;
        }

        /* Mobile tab toggle button (hidden on desktop) */
        .admin-dashboard-root .mobile-tab-toggle {
          display: none;
          width: 100%;
          max-width: 100%;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #0f172a;
          color: #fef08a;
          border: 2px solid #0f172a;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 3px 3px 0px #0f172a;
          margin-bottom: 8px;
          gap: 8px;
        }
        .admin-dashboard-root .mobile-tab-toggle .chev { transition: transform .2s ease; flex-shrink: 0; }
        .admin-dashboard-root .mobile-tab-toggle.open .chev { transform: rotate(180deg); }

        .admin-dashboard-root .mobile-tab-drawer {
          display: none;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          max-width: 100%;
          margin-bottom: 12px;
          padding: 10px;
          background: #ffffff;
          border: 2px solid #0f172a;
          border-radius: 12px;
          box-shadow: 3px 3px 0px #0f172a;
        }
        .admin-dashboard-root .mobile-tab-drawer.open { display: flex; }
        .admin-dashboard-root .mobile-tab-drawer .shadcn-btn {
          width: 100%;
          max-width: 100%;
          justify-content: flex-start;
          padding: 10px 14px;
          font-size: 0.9rem;
        }

        /* ============ STAT CARDS GRID ============ */
        .admin-dashboard-root .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .stat-card-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        /* ============ LOW STOCK TABLE / ALL TABLES ============ */
        .admin-dashboard-root .table-scroll-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .table-scroll-wrap table {
          min-width: 280px;
          width: 100%;
        }

        /* ============ ORDERS LIST ============ */
        .admin-dashboard-root .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .order-card {
          background: #fffbeb;
          border: 2px solid #0f172a;
          box-shadow: 3px 3px 0px #0f172a;
          border-radius: 12px;
          padding: 16px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .order-card.completed { background: #f0fdf4; }
        .admin-dashboard-root .order-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 6px;
          width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .order-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 4px;
          gap: 8px;
          min-width: 0;
        }
        .admin-dashboard-root .order-totals {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 0.85rem;
          font-weight: 800;
          flex-wrap: wrap;
          gap: 6px;
          min-width: 0;
        }

        /* ============ PRODUCTS CONTROLS BAR ============ */
        .admin-dashboard-root .product-controls-responsive {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .product-controls-responsive > * {
          min-width: 0;
          flex: 1 1 160px;
          max-width: 100%;
        }

        /* ============ FORM GRIDS ============ */
        .admin-dashboard-root .form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============ TABLE / CARD VISIBILITY ============ */
        .admin-dashboard-root .table-desktop-view {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .cards-mobile-view {
          display: none;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============ CATEGORIES SEARCH BAR ============ */
        .admin-dashboard-root .category-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          align-items: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .category-search-input-wrap {
          flex: 1 1 200px;
          min-width: 0;
          max-width: 100%;
          position: relative;
        }
        .admin-dashboard-root .category-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: inline-flex;
          align-items: center;
          color: #64748b;
        }
        .admin-dashboard-root .category-status-pills {
          display: inline-flex;
          gap: 4px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .admin-dashboard-root .category-status-pill {
          padding: 6px 12px;
          border: 2px solid #0f172a;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          background: #ffffff;
          color: #0f172a;
          box-shadow: 2px 2px 0px #0f172a;
          transition: transform .1s ease;
          white-space: nowrap;
        }
        .admin-dashboard-root .category-status-pill:active { transform: translateY(1px); }
        .admin-dashboard-root .category-status-pill.active {
          background: #0f172a;
          color: #fef08a;
        }
        .admin-dashboard-root .category-empty {
          padding: 24px 12px;
          text-align: center;
          color: #64748b;
          font-weight: 700;
          font-size: 0.85rem;
        }

        /* ============ PROFILE CARDS ============ */
        .admin-dashboard-root .profile-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============ REALTIME BANNER ============ */
        .admin-dashboard-root .realtime-banner {
          background: #fbbf24;
          color: #0f172a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 3px solid #0f172a;
          box-shadow: 4px 4px 0px #0f172a;
          padding: 10px 12px;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .admin-dashboard-root .realtime-banner strong { font-size: 0.9rem; }

        /* ============ FORM MODALS ============ */
        .admin-dashboard-root .admin-form-card {
          background: var(--neo-bg, #ffffff);
          border: var(--neo-border, 2px solid #0f172a);
          box-shadow: 4px 4px 0px var(--neo-dark, #0f172a);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============ INPUTS / SELECTS — force full width, no min-width =====
           CustomSelect and Input from components/ui may have their own
           min-widths. Override them so they fit narrow viewports. */
        .admin-dashboard-root .shadcn-input-group,
        .admin-dashboard-root .shadcn-input-wrap,
        .admin-dashboard-root input,
        .admin-dashboard-root select,
        .admin-dashboard-root textarea {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============ BUTTON ROWS ============ */
        .admin-dashboard-root .shadcn-btn { white-space: nowrap; max-width: 100%; }

        /* ============================================================
           BREAKPOINT: ≤ 1280px (large laptop) — slight tighten
           ============================================================ */
        @media (max-width: 1280px) {
          .admin-dashboard-root .admin-dashboard-inner { max-width: 1000px; padding: 0 14px; }
        }

        /* ============================================================
           BREAKPOINT: ≤ 1024px (tablet landscape / small desktop)
           ============================================================ */
        @media (max-width: 1024px) {
          .admin-dashboard-root .admin-dashboard-inner { max-width: 100%; padding: 0 12px; }
          .admin-dashboard-root .admin-header-bar { padding: 14px 16px; }
          .admin-dashboard-root .admin-header-bar h2 { font-size: 1.25rem; }
          .admin-dashboard-root .admin-header-bar p { font-size: 0.8rem; }
          .admin-dashboard-root .dashboard-tab-group .shadcn-btn { padding: 6px 10px; font-size: 0.76rem; }

          /* On tablet landscape, switch to 2-col stat grid */
          .admin-dashboard-root .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ============================================================
           BREAKPOINT: ≤ 768px (tablet portrait / large phone)
           ============================================================ */
        @media (max-width: 768px) {
          .admin-dashboard-root .admin-dashboard-inner { padding: 0 10px; }
          .admin-dashboard-root .admin-dashboard-root { padding-top: 12px !important; }

          /* Hide desktop tab group, show mobile toggle */
          .admin-dashboard-root .dashboard-tab-group.desktop-only { display: none !important; }
          .admin-dashboard-root .mobile-tab-toggle { display: flex; }

          .admin-dashboard-root .admin-header-bar {
            padding: 12px 14px;
            flex-direction: column;
            align-items: stretch;
          }
          .admin-dashboard-root .admin-header-bar h2 { font-size: 1.15rem; }
          .admin-dashboard-root .admin-header-bar p { font-size: 0.76rem; }

          /* Stat cards stack 2-up, smaller min */
          .admin-dashboard-root .stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .admin-dashboard-root .stat-card-inner h3 { font-size: 1.05rem !important; }
          .admin-dashboard-root .stat-card-inner span { font-size: 0.7rem !important; }

          /* Tables hidden, mobile cards shown */
          .admin-dashboard-root .table-desktop-view { display: none !important; }
          .admin-dashboard-root .cards-mobile-view { display: flex !important; }

          /* Form grids stack vertically */
          .admin-dashboard-root .form-grid-2col { grid-template-columns: 1fr; }

          /* Products controls stack */
          .admin-dashboard-root .product-controls-responsive { flex-direction: column; }
          .admin-dashboard-root .product-controls-responsive > * {
            width: 100%;
            min-width: 0;
            flex: 1 1 100%;
          }

          /* Realtime banner — stack */
          .admin-dashboard-root .realtime-banner { flex-direction: column; align-items: flex-start; }
          .admin-dashboard-root .realtime-banner strong { font-size: 0.82rem; }

          /* Order cards tighten */
          .admin-dashboard-root .order-card { padding: 12px; }
          .admin-dashboard-root .order-item-row { font-size: 0.8rem; }
          .admin-dashboard-root .order-totals { font-size: 0.8rem; }

          /* Category controls stack — search row 1, pills row 2 (proper stacking) */
          .admin-dashboard-root .category-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .admin-dashboard-root .category-search-input-wrap { width: 100%; flex: 1 1 100%; }
          .admin-dashboard-root .category-status-pills {
            width: 100%;
            justify-content: stretch;
            display: flex;
          }
          .admin-dashboard-root .category-status-pill {
            flex: 1 1 0;
            text-align: center;
            min-width: 0;
          }

          /* Profile head stacks */
          .admin-dashboard-root .profile-head { flex-direction: column; align-items: flex-start; }

          /* Override the inline overflow:visible on products tab (causes layout bleed) */
          .admin-dashboard-root .admin-tab-panel { overflow: hidden !important; }

          /* Override neo-card padding inside admin scope */
          .admin-dashboard-root .neo-card { padding: 14px !important; border-radius: 12px !important; }
        }

        /* ============================================================
           BREAKPOINT: ≤ 480px (phones)
           ============================================================ */
        @media (max-width: 480px) {
          .admin-dashboard-root { padding-top: 8px !important; }
          .admin-dashboard-root .admin-dashboard-inner { padding: 0 8px; }

          .admin-dashboard-root .admin-header-bar { padding: 10px 12px; gap: 8px; }
          .admin-dashboard-root .admin-header-bar h2 { font-size: 1.05rem; }
          .admin-dashboard-root .admin-header-bar p { font-size: 0.72rem; }

          /* Force single column on tiny phones for stats */
          .admin-dashboard-root .stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }
          .admin-dashboard-root .stat-card-inner { gap: 6px; }
          .admin-dashboard-root .stat-card-inner .brand-badge { padding: 4px 6px !important; }
          .admin-dashboard-root .stat-card-inner h3 { font-size: 0.92rem !important; }
          .admin-dashboard-root .stat-card-inner span { font-size: 0.66rem !important; }

          .admin-dashboard-root .mobile-tab-toggle { font-size: 0.82rem; padding: 8px 12px; }

          .admin-dashboard-root .realtime-banner { padding: 8px 10px; }
          .admin-dashboard-root .realtime-banner strong { font-size: 0.74rem; }

          .admin-dashboard-root .order-card { padding: 10px; border-radius: 10px; }
          .admin-dashboard-root .order-card-head { margin-bottom: 8px; }
          .admin-dashboard-root .order-card-head strong { font-size: 0.85rem; }
          .admin-dashboard-root .order-item-row { font-size: 0.75rem; }
          .admin-dashboard-root .order-totals { font-size: 0.78rem; }

          .admin-dashboard-root .product-controls-responsive { gap: 8px; margin-bottom: 12px; }

          .admin-dashboard-root .admin-form-card { padding: 12px; border-radius: 12px; }
          .admin-dashboard-root .admin-form-card h4 { font-size: 0.92rem; }

          .admin-dashboard-root .category-status-pill { font-size: 0.72rem; padding: 5px 10px; }

          .admin-dashboard-root .neo-card { padding: 12px !important; border-radius: 12px !important; }

          /* Tables: smaller min-width when they DO show (rare at this size since hidden) */
          .admin-dashboard-root .table-scroll-wrap table { min-width: 240px; font-size: 0.78rem; }
          .admin-dashboard-root .table-scroll-wrap th,
          .admin-dashboard-root .table-scroll-wrap td { padding: 6px !important; font-size: 0.78rem; }
        }

        /* ============================================================
           BREAKPOINT: ≤ 360px (very small phones — single column)
           ============================================================ */
        @media (max-width: 360px) {
          .admin-dashboard-root .stat-grid { grid-template-columns: 1fr !important; }
          .admin-dashboard-root .admin-header-bar h2 { font-size: 0.98rem; }
          .admin-dashboard-root .admin-header-bar p { font-size: 0.68rem; }
          .admin-dashboard-root .mobile-tab-toggle { font-size: 0.76rem; padding: 7px 10px; }
          .admin-dashboard-root .category-status-pill { font-size: 0.68rem; padding: 5px 8px; }
          .admin-dashboard-root .order-card { padding: 10px; }
          .admin-dashboard-root .neo-card { padding: 10px !important; }
          .admin-dashboard-root .admin-form-card { padding: 10px; }
        }

        /* ============================================================
           PRINT (admins sometimes print orders)
           ============================================================ */
        @media print {
          .admin-dashboard-root .mobile-tab-toggle,
          .admin-dashboard-root .mobile-tab-drawer,
          .admin-dashboard-root .realtime-banner,
          .admin-dashboard-root .product-controls-responsive,
          .admin-dashboard-root .category-controls,
          .admin-dashboard-root button { display: none !important; }
          .admin-dashboard-root .table-desktop-view { display: block !important; }
          .admin-dashboard-root .cards-mobile-view { display: none !important; }
          .admin-dashboard-root .neo-card,
          .admin-dashboard-root .order-card { box-shadow: none !important; }
        }

        /* Tiny utility for fade-in animation on tabs */
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-dashboard-root .admin-tab-panel { animation: adminFadeIn .18s ease-out; }
      `}</style>

      <div className="admin-dashboard-inner">
        {/* Real-time Socket Banner Notification */}
        {realtimeNotification && (
          <div className="realtime-banner alert-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Bell size={20} className="spin" style={{ flexShrink: 0 }} />
              <strong>{realtimeNotification}</strong>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 800, flexShrink: 0 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Header Bar */}
        <div className="neo-card admin-header-bar">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2>Admin Store Desk</h2>
            <p>Manage products, inventory analytics, real-time orders, and store profile</p>
          </div>

          {/* Desktop tab group */}
          <div className="dashboard-tab-group desktop-only">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`shadcn-btn ${activeTab === 'analytics' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <IndianRupee size={15} /> Analytics
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`shadcn-btn ${activeTab === 'orders' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <ShoppingBag size={15} /> Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`shadcn-btn ${activeTab === 'products' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <Package size={15} /> Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`shadcn-btn ${activeTab === 'categories' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <Layers size={15} /> Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`shadcn-btn ${activeTab === 'profile' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
            >
              <User size={15} /> Admin Profile
            </button>
            <button onClick={fetchData} className="shadcn-btn shadcn-btn-secondary" style={{ padding: '7px 10px' }}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Mobile tab toggle */}
          <button
            className={`mobile-tab-toggle ${mobileTabOpen ? 'open' : ''}`}
            onClick={() => setMobileTabOpen((v) => !v)}
            aria-expanded={mobileTabOpen}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {(() => {
                const TabIcon = tabs.find((t) => t.id === activeTab)?.icon || IndianRupee;
                return <TabIcon size={16} />;
              })()}
              {tabs.find((t) => t.id === activeTab)?.label}
              {tabs.find((t) => t.id === activeTab)?.count != null && (
                <span style={{ background: '#fef08a', color: '#0f172a', padding: '1px 7px', borderRadius: 999, fontSize: '0.7rem' }}>
                  {tabs.find((t) => t.id === activeTab).count}
                </span>
              )}
            </span>
            <span className="chev">▼</span>
          </button>

          {/* Mobile tab drawer */}
          {mobileTabOpen && (
            <div className="mobile-tab-drawer open">
              {tabs.map((t) => {
                const TabIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id); setMobileTabOpen(false); }}
                    className={`shadcn-btn ${activeTab === t.id ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
                  >
                    <TabIcon size={15} /> {t.label}
                    {t.count != null && <span style={{ marginLeft: 'auto', fontWeight: 900 }}>({t.count})</span>}
                  </button>
                );
              })}
              <button
                onClick={() => { fetchData(); setMobileTabOpen(false); }}
                className="shadcn-btn shadcn-btn-secondary"
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Data
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert-box" style={{ background: '#4ade80', color: '#0f172a' }}>
            <Sparkles size={18} /> <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div className="admin-tab-panel">
            <div className="stat-grid">
              <div className="neo-card" style={{ padding: 14, background: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-card-inner">
                  <div className="brand-badge" style={{ background: '#4ade80', color: '#0f172a', padding: '6px 8px', flexShrink: 0 }}>
                    <IndianRupee size={20} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Total Revenue
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ₹{Number(stats.totalCombinedRevenue || 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="neo-card" style={{ padding: 14, background: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-card-inner">
                  <div className="brand-badge" style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 8px', flexShrink: 0 }}>
                    <Receipt size={20} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Total Bills & Orders
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(stats.totalBills || 0) + (stats.totalOrders || 0)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="neo-card" style={{ padding: 14, background: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-card-inner">
                  <div className="brand-badge" style={{ background: '#a855f7', color: '#ffffff', padding: '6px 8px', flexShrink: 0 }}>
                    <Package size={20} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Total Inventory Items
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stats.totalProducts || products.length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="neo-card" style={{ padding: 14, background: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-card-inner">
                  <div className="brand-badge" style={{ background: '#f87171', color: '#0f172a', padding: '6px 8px', flexShrink: 0 }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Low Stock Items
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: stats.lowStockCount > 0 ? '#ef4444' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stats.lowStockCount || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Analytics Visual Dashboard */}
            <style>{`
              .dash-chart-card {
                background: #ffffff;
                border: 2.5px solid #0f172a;
                border-radius: 14px;
                box-shadow: 4px 4px 0px #0f172a;
                padding: 16px 18px;
                display: flex;
                flex-direction: column;
                min-width: 0;
                overflow: hidden;
              }
              .dash-chart-title {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 10px;
                flex-wrap: wrap;
                gap: 6px;
              }
              .dash-chart-title-left h3 {
                font-size: 0.92rem;
                font-weight: 900;
                color: #0f172a;
                margin: 0 0 2px 0;
                display: flex;
                align-items: center;
                gap: 6px;
              }
              .dash-chart-title-left p {
                font-size: 0.68rem;
                font-weight: 700;
                color: #64748b;
                margin: 0;
              }
              .dash-chart-badge {
                font-size: 0.68rem;
                font-weight: 900;
                padding: 3px 8px;
                border-radius: 6px;
                border: 1.5px solid #0f172a;
                white-space: nowrap;
              }
              .dash-charts-grid-3 {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 14px;
                margin-bottom: 14px;
              }
              .dash-charts-grid-2 {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 14px;
                margin-bottom: 14px;
              }
              @media (max-width: 900px) {
                .dash-charts-grid-3 {
                  grid-template-columns: 1fr 1fr;
                }
              }
              @media (max-width: 600px) {
                .dash-charts-grid-3,
                .dash-charts-grid-2 {
                  grid-template-columns: 1fr;
                }
              }
              .svg-yaxis-label {
                font-size: 7px;
                font-weight: 800;
                fill: #94a3b8;
              }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>

              {/* ROW 1: Revenue Circle + Revenue Trend + Order Trend */}
              <div className="dash-charts-grid-3">

                {/* 1.1 Revenue Donut Circle Chart */}
                <div className="dash-chart-card">
                  <div className="dash-chart-title">
                    <div className="dash-chart-title-left">
                      <h3><PieChart size={14} color="#f472b6" /> Revenue Split</h3>
                      <p>Billing Desk vs Storefront · All time</p>
                    </div>
                    <span className="dash-chart-badge" style={{ background: '#fdf4ff', color: '#a855f7', borderColor: '#a855f7' }}>
                      ₹{Math.round((stats.totalBillingRevenue || 0) + (stats.totalOrderRevenue || 0))} total
                    </span>
                  </div>

                  {(() => {
                    const billingRev = stats.totalBillingRevenue || 0;
                    const orderRev = stats.totalOrderRevenue || 0;
                    const combined = billingRev + orderRev || 1;
                    const pctBilling = (billingRev / combined) * 100;
                    const pctOrder = (orderRev / combined) * 100;
                    const radius = 44;
                    const sw = 11;
                    const circ = 2 * Math.PI * radius;
                    const offBilling = circ - (pctBilling / 100) * circ;
                    const offOrder = circ - (pctOrder / 100) * circ;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="55" cy="55" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                            <circle cx="55" cy="55" r={radius} fill="none" stroke="#4ade80" strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={offBilling} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                            <circle cx="55" cy="55" r={radius} fill="none" stroke="#38bdf8" strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={offOrder} strokeLinecap="round" transform={`rotate(${(pctBilling / 100) * 360} 55 55)`} style={{ transition: 'stroke-dashoffset 0.6s' }} />
                          </svg>
                          <div style={{ position: 'absolute', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>₹{Math.round(combined)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '1.5px solid #0f172a', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>Billing Desk</div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>₹{billingRev.toFixed(0)} <span style={{ color: '#64748b', fontWeight: 700 }}>({Math.round(pctBilling)}%)</span></div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', border: '1.5px solid #0f172a', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>Storefront</div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>₹{orderRev.toFixed(0)} <span style={{ color: '#64748b', fontWeight: 700 }}>({Math.round(pctOrder)}%)</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 1.2 Revenue Area Line Graph */}
                <div className="dash-chart-card">
                  <div className="dash-chart-title">
                    <div className="dash-chart-title-left">
                      <h3><TrendingUp size={14} color="#a855f7" /> Revenue Trend</h3>
                      <p>Daily sales revenue · Last 7 days</p>
                    </div>
                    <span className="dash-chart-badge" style={{ background: '#fdf4ff', color: '#a855f7', borderColor: '#a855f7' }}>
                      ₹{Math.round(stats.salesTrend?.reduce((s, d) => s + (d.totalRevenue || 0), 0) || 0)}
                    </span>
                  </div>
                  {(() => {
                    const trend = stats.salesTrend || [];
                    const maxRev = Math.max(...trend.map(t => t.totalRevenue || 0), 100);
                    if (trend.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', paddingTop: 30 }}>No data</div>;
                    const W = 400, H = 120, pX = 32, pY = 12;
                    const pts = trend.map((d, i) => ({
                      x: pX + (i * (W - 2 * pX)) / (trend.length - 1 || 1),
                      y: H - pY - ((d.totalRevenue || 0) / maxRev) * (H - 2 * pY),
                      date: d.date,
                      rev: d.totalRevenue || 0,
                    }));
                    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const area = `${line} L ${pts[pts.length-1].x} ${H - pY} L ${pts[0].x} ${H - pY} Z`;
                    const yLabels = [0, 0.25, 0.5, 0.75, 1].map(r => ({ y: H - pY - r * (H - 2 * pY), val: Math.round(maxRev * r) }));
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', maxHeight: 120 }}>
                        {yLabels.map((yl, i) => (
                          <g key={i}>
                            <line x1={pX} y1={yl.y} x2={W - pX} y2={yl.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                            <text x={pX - 3} y={yl.y + 3} textAnchor="end" className="svg-yaxis-label">₹{yl.val >= 1000 ? (yl.val/1000).toFixed(1)+'k' : yl.val}</text>
                          </g>
                        ))}
                        <path d={area} fill="rgba(168,85,247,0.10)" />
                        <path d={line} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#a855f7" strokeWidth="2.5" />
                            <text x={p.x} y={H - 1} textAnchor="middle" className="svg-yaxis-label">{new Date(p.date).toLocaleDateString('en',{day:'numeric',month:'short'})}</text>
                            <title>{new Date(p.date).toLocaleDateString()}: ₹{p.rev.toFixed(2)}</title>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

                {/* 1.3 Order Transactions Area Graph */}
                <div className="dash-chart-card">
                  <div className="dash-chart-title">
                    <div className="dash-chart-title-left">
                      <h3><TrendingUp size={14} color="#38bdf8" /> Order Volume</h3>
                      <p>Daily transaction count · Last 7 days</p>
                    </div>
                    <span className="dash-chart-badge" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#38bdf8' }}>
                      {stats.salesTrend?.reduce((s, d) => s + (d.totalOrders || 0), 0) || 0} orders
                    </span>
                  </div>
                  {(() => {
                    const trend = stats.salesTrend || [];
                    const maxOrd = Math.max(...trend.map(t => t.totalOrders || 0), 5);
                    if (trend.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', paddingTop: 30 }}>No data</div>;
                    const W = 400, H = 120, pX = 28, pY = 12;
                    const pts = trend.map((d, i) => ({
                      x: pX + (i * (W - 2 * pX)) / (trend.length - 1 || 1),
                      y: H - pY - ((d.totalOrders || 0) / maxOrd) * (H - 2 * pY),
                      date: d.date,
                      cnt: d.totalOrders || 0,
                    }));
                    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const area = `${line} L ${pts[pts.length-1].x} ${H - pY} L ${pts[0].x} ${H - pY} Z`;
                    const yLabels = [0, 0.5, 1].map(r => ({ y: H - pY - r * (H - 2 * pY), val: Math.round(maxOrd * r) }));
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', maxHeight: 120 }}>
                        {yLabels.map((yl, i) => (
                          <g key={i}>
                            <line x1={pX} y1={yl.y} x2={W - pX} y2={yl.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                            <text x={pX - 3} y={yl.y + 3} textAnchor="end" className="svg-yaxis-label">{yl.val}</text>
                          </g>
                        ))}
                        <path d={area} fill="rgba(56,189,248,0.10)" />
                        <path d={line} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#38bdf8" strokeWidth="2.5" />
                            <text x={p.x} y={H - 1} textAnchor="middle" className="svg-yaxis-label">{new Date(p.date).toLocaleDateString('en',{day:'numeric',month:'short'})}</text>
                            <title>{new Date(p.date).toLocaleDateString()}: {p.cnt} orders</title>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

              </div>

              {/* ROW 2: Category Inventory + Product Performance */}
              <div className="dash-charts-grid-2">

                {/* 2.1 Category Analysis */}
                <div className="dash-chart-card">
                  <div className="dash-chart-title">
                    <div className="dash-chart-title-left">
                      <h3><Layers size={14} color="#fbbf24" /> Category Analysis</h3>
                      <p>Inventory distribution · Top {Math.min(categories.length, 5)} categories</p>
                    </div>
                    <span className="dash-chart-badge" style={{ background: '#fefce8', color: '#92400e', borderColor: '#fbbf24' }}>
                      {products.length} total items
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {(() => {
                      const catCounts = {};
                      categories.forEach(c => { catCounts[c.name || c.categoryName] = 0; });
                      products.forEach(p => {
                        const cn = p.category?.name || p.category?.categoryName || 'Uncategorized';
                        catCounts[cn] = (catCounts[cn] || 0) + 1;
                      });
                      const sorted = Object.entries(catCounts).map(([n, c]) => ({ n, c })).sort((a, b) => b.c - a.c).slice(0, 5);
                      const maxC = Math.max(...sorted.map(s => s.c), 1);
                      const colors = ['#a855f7', '#fbbf24', '#4ade80', '#38bdf8', '#f472b6'];
                      return sorted.map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 800, marginBottom: 3 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{item.n}</span>
                            <span style={{ background: '#f8fafc', padding: '1px 7px', borderRadius: 5, border: '1.2px solid #e2e8f0', color: '#475569', flexShrink: 0 }}>{item.c} items</span>
                          </div>
                          <div style={{ width: '100%', height: 11, background: '#f1f5f9', border: '1.5px solid #0f172a', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${(item.c / maxC) * 100}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '0 4px 4px 0', transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 2.2 Product Performance Vertical Bars */}
                <div className="dash-chart-card">
                  <div className="dash-chart-title">
                    <div className="dash-chart-title-left">
                      <h3><ShoppingBag size={14} color="#4ade80" /> Product Performance</h3>
                      <p>Units sold per product · All time</p>
                    </div>
                    <span className="dash-chart-badge" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#4ade80' }}>
                      {(stats.topProducts || []).reduce((s, p) => s + (p.totalSold || 0), 0)} sold
                    </span>
                  </div>
                  {(() => {
                    const topProducts = stats.topProducts || [];
                    if (topProducts.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', paddingTop: 30 }}>No products sold yet</div>;
                    const maxSold = Math.max(...topProducts.map(p => p.totalSold || 0), 1);
                    const colors = ['#38bdf8', '#4ade80', '#fbbf24', '#f472b6', '#a855f7'];
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {/* Bar chart */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, borderBottom: '2px solid #0f172a', paddingBottom: 4, marginBottom: 8, gap: 8 }}>
                          {topProducts.map((p, idx) => {
                            const h = (p.totalSold / maxSold) * 85;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#475569', marginBottom: 2 }}>{p.totalSold}</div>
                                <div
                                  style={{ width: '60%', maxWidth: 26, height: `${Math.max(h, 8)}%`, background: colors[idx % colors.length], border: '1.5px solid #0f172a', borderBottom: 'none', borderRadius: '6px 6px 0 0', boxShadow: '2px 2px 0 #0f172a', transition: 'height 0.4s', cursor: 'pointer' }}
                                  title={`${p.name}\nQty Sold: ${p.totalSold}\nRevenue: ₹${p.totalRevenue}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {/* Product labels row */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
                          {topProducts.map((p, idx) => (
                            <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </div>
                          ))}
                        </div>
                        {/* Revenue row */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8, marginTop: 4 }}>
                          {topProducts.map((p, idx) => (
                            <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              ₹{p.totalRevenue}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>


            {/* Low Stock Warning List */}
            <div className="neo-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14 }}>Low Stock Warning List</h3>
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="table-scroll-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 280 }}>
                    <thead>
                      <tr style={{ borderBottom: '3px solid #0f172a' }}>
                        <th style={{ padding: 8, fontWeight: 800, fontSize: '0.85rem' }}>Product Name</th>
                        <th style={{ padding: 8, fontWeight: 800, fontSize: '0.85rem' }}>Price</th>
                        <th style={{ padding: 8, fontWeight: 800, fontSize: '0.85rem' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.lowStockProducts.map((p) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 8, fontWeight: 700, fontSize: '0.85rem' }}>{p.name}</td>
                          <td style={{ padding: 8, fontWeight: 700, fontSize: '0.85rem' }}>₹{p.price}</td>
                          <td style={{ padding: 8 }}>
                            <span style={{ background: '#fca5a5', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: '0.75rem', border: '1.5px solid #0f172a' }}>
                              {p.stock} Left
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>All inventory items have sufficient stock!</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT (ACTIVE VS COMPLETED) */}
        {activeTab === 'orders' && (
          <div className="neo-card admin-tab-panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => setOrderFilterTab('active')}
                className={`shadcn-btn ${orderFilterTab === 'active' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Clock size={15} /> Active ({adminActiveOrders.length})
              </button>
              <button
                onClick={() => setOrderFilterTab('completed')}
                className={`shadcn-btn ${orderFilterTab === 'completed' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <PackageCheck size={15} /> Completed ({adminCompletedOrders.length})
              </button>
            </div>

            {/* ACTIVE ORDERS LIST */}
            {orderFilterTab === 'active' && (
              <div className="orders-list">
                {adminActiveOrders.map((ord) => (
                  <div key={ord._id} className="order-card">
                    <div className="order-card-head">
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.95rem' }}>Order #{ord._id.toString().slice(-6).toUpperCase()}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#334155', display: 'block', fontWeight: 700, wordBreak: 'break-word' }}>
                          Customer: {ord.customer?.name || 'Customer'} ({ord.customer?.email})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: 999, fontWeight: 800, fontSize: '0.75rem', border: '1.5px solid #0f172a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {ord.orderStatus.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleUpdateOrderStatus(ord._id, 'completed')}
                          className="shadcn-btn shadcn-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Check size={12} /> Mark Complete
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '8px 0', margin: '6px 0' }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="order-item-row">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 28, height: 28, background: 'var(--neo-yellow)', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={14} color="#0f172a" />
                              </div>
                            )}
                            <span style={{ wordBreak: 'break-word' }}>{it.name} (×{it.quantity})</span>
                          </span>
                          <span style={{ flexShrink: 0 }}>₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-totals">
                      <div style={{ minWidth: 0 }}>
                        <span style={{ color: '#475569' }}>Payment: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
                        {ord.shippingAddress && (
                          <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} color="#ef4444" />
                            <span style={{ wordBreak: 'break-word' }}>{ord.shippingAddress}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>Total: ₹{ord.totalAmount}</span>
                    </div>

                    {/* Real-Time Live GPS Map */}
                    <OrderLiveMap
                      location={orderLocations[ord._id] || ord.liveLocation}
                      customerName={ord.customer?.name || 'Customer'}
                      orderNumber={ord._id.toString().slice(-6).toUpperCase()}
                    />
                  </div>
                ))}
                {adminActiveOrders.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 700, padding: 20 }}>
                    No active pending orders right now.
                  </p>
                )}
              </div>
            )}

            {/* COMPLETED ORDERS LIST */}
            {orderFilterTab === 'completed' && (
              <div className="orders-list">
                {adminCompletedOrders.map((ord) => (
                  <div key={ord._id} className="order-card completed">
                    <div className="order-card-head">
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.95rem' }}>Order #{ord._id.toString().slice(-6).toUpperCase()}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#334155', display: 'block', fontWeight: 700, wordBreak: 'break-word' }}>
                          Customer: {ord.customer?.name || 'Customer'} ({ord.customer?.email})
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

                    <div style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '8px 0', margin: '6px 0' }}>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="order-item-row">
                          <span style={{ wordBreak: 'break-word' }}>{it.name} (×{it.quantity})</span>
                          <span style={{ flexShrink: 0 }}>₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-totals">
                      <span style={{ color: '#475569' }}>Payment: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>Total: ₹{ord.totalAmount}</span>
                    </div>
                  </div>
                ))}
                {adminCompletedOrders.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 700, padding: 20 }}>
                    No completed orders yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="neo-card admin-tab-panel" style={{ padding: 18, position: 'relative', zIndex: 50 }}>
            <div className="product-controls-responsive">
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Input
                  placeholder="Search products by name..."
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Modern Custom Responsive Category Dropdown */}
              <div style={{ minWidth: 0, flex: 1, width: '100%' }}>
                <CustomSelect
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c._id, label: c.name || c.categoryName })),
                  ]}
                />
              </div>

              <Button
                onClick={() => setShowAddModal(!showAddModal)}
                className="shadcn-btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={15} /> Add Product
              </Button>
            </div>

            {/* Create Product Form Modal */}
            {showAddModal && (
              <form onSubmit={handleAddProduct} className="admin-form-card">
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>Create New Product</h4>
                <div className="form-grid-2col">
                  <Input
                    label="Product Name *"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Wireless Headphones"
                    required
                  />

                  <Input
                    label="Price (₹) *"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="499"
                    required
                  />
                </div>

                <div className="form-grid-2col">
                  <Input
                    label="Stock Quantity"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="50"
                  />

                  <div className="shadcn-input-group">
                    <label className="shadcn-label">Category (Optional)</label>
                    <CustomSelect
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      options={[
                        { value: '', label: '-- Optional: No Category --' },
                        ...categories.map((c) => ({ value: c._id, label: c.name || c.categoryName })),
                      ]}
                    />
                  </div>
                </div>

                <Input
                  label="Description (Optional)"
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="e.g. High quality noise cancelling earphone"
                />

                {/* Optional Product Image Upload */}
                <ImageKitUploader
                  label="Product Image (Optional)"
                  currentImage={newProduct.imageUrl}
                  onUploadSuccess={(url) => setNewProduct((prev) => ({ ...prev, imageUrl: url }))}
                />

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
                  <Button type="button" onClick={() => setShowAddModal(false)} className="shadcn-btn-secondary" style={{ padding: '6px 12px' }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="shadcn-btn-primary" style={{ padding: '6px 14px' }}>
                    Save Product
                  </Button>
                </div>
              </form>
            )}

            {/* Edit Product Modal Form */}
            {editingProduct && (
              <form onSubmit={handleEditProductSubmit} className="admin-form-card" style={{ background: '#e0f2fe' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>Edit Product Details</h4>
                <div className="form-grid-2col">
                  <Input
                    label="Product Name *"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Price (₹) *"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2col">
                  <Input
                    label="Stock Quantity"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  />

                  <div className="shadcn-input-group">
                    <label className="shadcn-label">Category (Optional)</label>
                    <CustomSelect
                      value={typeof editingProduct.category === 'object' ? editingProduct.category?._id : (editingProduct.category || '')}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      options={[
                        { value: '', label: '-- Optional: No Category --' },
                        ...categories.map((c) => ({ value: c._id, label: c.name || c.categoryName })),
                      ]}
                    />
                  </div>
                </div>

                <Input
                  label="Description (Optional)"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="e.g. High quality noise cancelling earphone"
                />

                {/* Optional Product Image Upload */}
                <ImageKitUploader
                  label="Product Image (Optional)"
                  currentImage={editingProduct.imageUrl || ''}
                  onUploadSuccess={(url) => setEditingProduct((prev) => ({ ...prev, imageUrl: url }))}
                />

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
                  <Button type="button" onClick={() => setEditingProduct(null)} className="shadcn-btn-secondary" style={{ padding: '6px 12px' }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="shadcn-btn-primary" style={{ padding: '6px 14px' }}>
                    Update Product
                  </Button>
                </div>
              </form>
            )}

            {/* Desktop Products Data Table */}
            <div className="table-desktop-view table-scroll-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 320 }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Image</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Product</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Category</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Price</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Stock</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 8 }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #0f172a' }}
                          />
                        ) : (
                          <div style={{ width: 42, height: 42, background: 'var(--neo-yellow)', border: '1.5px solid #0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="#0f172a" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 10, fontWeight: 700, fontSize: '0.85rem' }}>{p.name}</td>
                      <td style={{ padding: 10, fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>
                        {typeof p.category === 'object' ? (p.category?.categoryName || p.category?.name || 'General') : 'General'}
                      </td>
                      <td style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>₹{p.price}</td>
                      <td style={{ padding: 10 }}>
                        <span
                          style={{
                            background: p.stock <= 5 ? '#fca5a5' : '#4ade80',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: '1.5px solid #0f172a',
                          }}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td style={{ padding: 10 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="shadcn-btn shadcn-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="shadcn-btn shadcn-btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="category-empty">
                        No products found. Click "+ Add Product" to create inventory items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Products Cards List */}
            <div className="cards-mobile-view">
              {filteredProducts.map((p) => (
                <div key={p._id} className="order-card" style={{ background: '#ffffff' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #0f172a', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, background: 'var(--neo-yellow)', border: '1.5px solid #0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={18} color="#0f172a" />
                      </div>
                    )}
                    <strong style={{ fontSize: '0.9rem', flex: 1, wordBreak: 'break-word' }}>{p.name}</strong>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: 'var(--neo-cyan)',
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid #0f172a',
                        flexShrink: 0,
                      }}
                    >
                      {typeof p.category === 'object' ? (p.category?.categoryName || p.category?.name || 'General') : 'General'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>₹{p.price}</span>
                    <span
                      style={{
                        background: p.stock <= 5 ? '#fca5a5' : '#4ade80',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        border: '1.5px solid #0f172a',
                      }}
                    >
                      {p.stock} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="shadcn-btn shadcn-btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem' }}
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      className="shadcn-btn shadcn-btn-danger"
                      style={{ flex: 1, padding: '6px', fontSize: '0.78rem' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <p className="category-empty">No products found matching search.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT — with NEW SEARCH FUNCTIONALITY */}
        {activeTab === 'categories' && (
          <div className="neo-card admin-tab-panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Product Categories ({filteredCategories.length}
                {filteredCategories.length !== categories.length && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}> / {categories.length}</span>
                )})
              </h3>
              <Button onClick={() => setShowCategoryForm(!showCategoryForm)} className="shadcn-btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                <Plus size={15} /> Create Category
              </Button>
            </div>

            {/* ===== NEW: Category Search & Status Filter Bar ===== */}
            <div className="category-controls">
              <div className="category-search-input-wrap">
                <Input
                  placeholder="Search categories by name or description..."
                  icon={Search}
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    className="category-search-clear"
                    onClick={() => setCategorySearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="category-status-pills" role="group" aria-label="Filter categories by status">
                <button
                  type="button"
                  className={`category-status-pill ${categoryStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryStatusFilter('all')}
                >
                  All ({categories.length})
                </button>
                <button
                  type="button"
                  className={`category-status-pill ${categoryStatusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setCategoryStatusFilter('active')}
                >
                  Active ({categories.filter((c) => c.isActive !== false).length})
                </button>
                <button
                  type="button"
                  className={`category-status-pill ${categoryStatusFilter === 'inactive' ? 'active' : ''}`}
                  onClick={() => setCategoryStatusFilter('inactive')}
                >
                  Inactive ({categories.filter((c) => c.isActive === false).length})
                </button>
              </div>
            </div>

            {showCategoryForm && (
              <form onSubmit={handleAddCategory} className="admin-form-card">
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>Create Category</h4>
                <Input
                  label="Category Name *"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, categoryName: e.target.value })}
                  placeholder="e.g. Electronics, Groceries, Clothing & Apparel"
                  required
                />
                <Input
                  label="Description (Optional)"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Short description..."
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
                  <Button type="button" onClick={() => setShowCategoryForm(false)} className="shadcn-btn-secondary" style={{ padding: '6px 12px' }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="shadcn-btn-primary" style={{ padding: '6px 14px' }}>
                    Save Category
                  </Button>
                </div>
              </form>
            )}

            {/* Desktop Categories Table */}
            <div className="table-desktop-view table-scroll-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 280 }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Category Name</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Description</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Status</th>
                    <th style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 10, fontWeight: 800, fontSize: '0.85rem' }}>{c.name || c.categoryName}</td>
                      <td style={{ padding: 10, fontWeight: 600, color: '#64748b', fontSize: '0.82rem' }}>{c.description || 'N/A'}</td>
                      <td style={{ padding: 10 }}>
                        <span
                          style={{
                            background: c.isActive !== false ? '#4ade80' : '#fca5a5',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: '1.5px solid #0f172a',
                          }}
                        >
                          {c.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: 10 }}>
                        <button
                          onClick={() => handleToggleCategoryStatus(c)}
                          style={{
                            background: c.isActive !== false ? '#fca5a5' : '#4ade80',
                            color: '#0f172a',
                            border: '1.5px solid #0f172a',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0px #0f172a',
                          }}
                        >
                          {c.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan="4" className="category-empty">
                        {categories.length === 0
                          ? 'No categories created yet. Click "+ Create Category" above!'
                          : 'No categories match your search. Try a different keyword or status filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Categories Cards List — NEW for deep responsiveness */}
            <div className="cards-mobile-view">
              {filteredCategories.map((c) => (
                <div key={c._id} className="order-card" style={{ background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '0.92rem', wordBreak: 'break-word' }}>{c.name || c.categoryName}</strong>
                      {c.description && (
                        <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, margin: '4px 0 0', wordBreak: 'break-word' }}>
                          {c.description}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        background: c.isActive !== false ? '#4ade80' : '#fca5a5',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        border: '1.5px solid #0f172a',
                        flexShrink: 0,
                      }}
                    >
                      {c.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCategoryStatus(c)}
                    style={{
                      width: '100%',
                      background: c.isActive !== false ? '#fca5a5' : '#4ade80',
                      color: '#0f172a',
                      border: '1.5px solid #0f172a',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0px #0f172a',
                      marginTop: 6,
                    }}
                  >
                    {c.isActive !== false ? 'Deactivate Category' : 'Activate Category'}
                  </button>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="category-empty">
                  {categories.length === 0
                    ? 'No categories created yet. Tap "+ Create Category" above!'
                    : 'No categories match your search. Try a different keyword or status.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN PROFILE */}
        {activeTab === 'profile' && user && (
          <div className="neo-card admin-tab-panel" style={{ padding: 20 }}>
            <div className="profile-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                {user.profileImage && !user.profileImage.startsWith('blob:') ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #0f172a', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    className="brand-badge"
                    style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--neo-yellow)', flexShrink: 0 }}
                  >
                    <User size={24} color="#0f172a" />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>{user.name}</h3>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      background: 'var(--neo-cyan)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 11,
                      border: '1.5px solid #0f172a',
                      textTransform: 'uppercase',
                    }}
                  >
                    {user.role} Account
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="shadcn-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Edit size={14} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Admin Profile'}
              </Button>
            </div>

            {/* EDIT PROFILE FORM */}
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="admin-form-card" style={{ background: '#f8fafc' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>Update Admin Profile Details</h4>

                {/* ImageKit Profile Image Uploader */}
                <ImageKitUploader
                  label="Upload Profile Photo"
                  currentImage={profileData.profileImage}
                  onUploadSuccess={(url) => setProfileData({ ...profileData, profileImage: url })}
                />

                <Input
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  icon={User}
                  required
                />

                <div className="form-grid-2col">
                  <Input
                    label="Phone Number"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    icon={Phone}
                    placeholder="8777099335"
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    value={profileData.DOB}
                    onChange={(e) => setProfileData({ ...profileData, DOB: e.target.value })}
                    icon={Calendar}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
                  <Button type="button" onClick={() => setIsEditingProfile(false)} className="shadcn-btn-secondary" style={{ padding: '6px 12px' }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="shadcn-btn-primary" style={{ padding: '6px 14px' }}>
                    <CheckCircle2 size={15} /> Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              /* DISPLAY PROFILE CARDS */
              <div className="form-grid-2col" style={{ gap: 12 }}>
                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={16} color="#0f172a" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Email Address</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', wordBreak: 'break-all', margin: 0 }}>{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={16} color="#0f172a" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>User Role</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'capitalize', margin: 0 }}>{user.role}</p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Phone size={16} color="#0f172a" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Phone Number</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>{user.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="neo-card" style={{ padding: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar size={16} color="#0f172a" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Date of Birth</span>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>
                        {user.DOB ? new Date(user.DOB).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <StoreFooter />
    </div>
  );
};

export default AdminDashboard;
