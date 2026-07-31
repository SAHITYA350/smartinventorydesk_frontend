import React, { useRef, useState, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, X, CheckCircle2, ShoppingBag, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Button from './ui/button';
import OrderLiveMap from './OrderLiveMap';

const OrderReceiptModal = ({ order, onClose }) => {
  const receiptRef = useRef(null);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!order) return null;

  // Helper options for html2canvas to safely strip any oklch color references
  const getCanvasOptions = () => ({
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      const elements = clonedDoc.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
          el.style.backgroundColor = '#ffffff';
        }
        if (computedStyle.color && computedStyle.color.includes('oklch')) {
          el.style.color = '#0f172a';
        }
        if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
          el.style.borderColor = '#0f172a';
        }
      }
    },
  });

  // Download PDF directly
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(receiptRef.current, getCanvasOptions());
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `Receipt_Order_${order._id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 300);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Download PNG directly
  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(receiptRef.current, getCanvasOptions());
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = `Receipt_Order_${order._id.slice(-6).toUpperCase()}.png`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 300);
      }, 'image/png');
    } catch (err) {
      console.error('PNG Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Download JPG directly
  const handleDownloadJPG = async () => {
    if (!receiptRef.current) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(receiptRef.current, getCanvasOptions());
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = `Receipt_Order_${order._id.slice(-6).toUpperCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 300);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('JPG Export Error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          border: '3px solid #0f172a',
          borderRadius: 16,
          boxShadow: '6px 6px 0px #0f172a',
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          padding: '18px 16px',
          position: 'relative',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#ffffff',
            border: '2px solid #0f172a',
            borderRadius: 8,
            padding: 4,
            cursor: 'pointer',
            fontWeight: 900,
            zIndex: 10,
          }}
        >
          <X size={18} color="#0f172a" />
        </button>

        {/* Printable / Capturable Receipt Card */}
        <div
          ref={receiptRef}
          style={{
            background: '#ffffff',
            padding: 14,
            borderRadius: 12,
            border: '2px solid #0f172a',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: 6, borderRadius: 8 }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>SmartStore POS</h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Payment Receipt</span>
              </div>
            </div>

            <div>
              {(() => {
                const isDone =
                  order.orderStatus === 'completed' ||
                  order.orderStatus === 'delivered' ||
                  order.paymentStatus === 'paid';
                return (
                  <span
                    style={{
                      background: isDone ? '#4ade80' : '#fde047',
                      color: '#0f172a',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      border: '1.5px solid #0f172a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={13} />{' '}
                    {isDone
                      ? order.paymentStatus === 'paid'
                        ? 'PAID CONFIRMED'
                        : 'COMPLETED'
                      : 'PENDING'}
                  </span>
                );
              })()}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed #0f172a', margin: '12px 0' }} />

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, fontSize: '0.78rem', fontWeight: 700, marginBottom: 14 }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Receipt No:</span>
              <strong>#{order._id.slice(-8).toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Date & Time:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Payment Method:</span>
              <span style={{ textTransform: 'uppercase', color: '#0284c7', fontWeight: 900 }}>
                {order.paymentMethod === 'razorpay' ? 'Razorpay Online' : order.paymentMethod}
              </span>
            </div>
            {order.razorpayPaymentId && (
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Razorpay Txn ID:</span>
                <span style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{order.razorpayPaymentId}</span>
              </div>
            )}
          </div>

          {/* Customer info */}
          <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8, border: '1.5px solid #cbd5e1', marginBottom: 14, fontSize: '0.78rem' }}>
            <span style={{ color: '#475569', fontWeight: 700 }}>Customer: </span>
            <strong>{order.customer?.name || 'Customer'}</strong>
            {order.customer?.email && <span> ({order.customer.email})</span>}
            {order.shippingAddress && (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>Shipping Address: </span>
                <span>{order.shippingAddress}</span>
              </div>
            )}
          </div>

          {/* Items Table Container */}
          <div style={{ overflowX: 'auto', width: '100%', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 240 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #0f172a', textAlign: 'left', background: '#f1f5f9' }}>
                  <th style={{ padding: 6, fontWeight: 800 }}>Item Description</th>
                  <th style={{ padding: 6, fontWeight: 800, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: 6, fontWeight: 800, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: 6, fontWeight: 800, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                    <td style={{ padding: 6, fontWeight: 700, wordBreak: 'break-word' }}>{it.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 800 }}>{it.quantity}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 700 }}>₹{it.price}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 800 }}>₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total Row */}
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#facc15',
              border: '2px solid #0f172a',
              borderRadius: 10,
              boxShadow: '3px 3px 0px #0f172a',
            }}
          >
            <span style={{ fontWeight: 900, fontSize: '0.82rem', color: '#0f172a' }}>TOTAL PAID AMOUNT:</span>
            <strong style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>₹{order.totalAmount}</strong>
          </div>
        </div>

        {/* Export Dropdown Section */}
        <div style={{ marginTop: 14, position: 'relative' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: 6, color: '#334155' }}>
            Download Official Receipt:
          </span>

          <div style={{ position: 'relative', width: '100%' }}>
            <button
              onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
              disabled={exporting}
              className="shadcn-btn-primary"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={16} /> {exporting ? 'Generating Document...' : 'Download Receipt Format'}
              </span>
              <ChevronDown size={16} style={{ transform: downloadDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {downloadDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: 6,
                  background: '#ffffff',
                  border: '2px solid #0f172a',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0px #0f172a',
                  padding: 6,
                  zIndex: 99,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <button
                  onClick={() => { setDownloadDropdownOpen(false); handleDownloadPDF(); }}
                  className="shadcn-btn-secondary"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}
                >
                  <FileText size={16} color="#ef4444" />
                  <div>
                    <strong style={{ display: 'block', textAlign: 'left' }}>Download PDF Document</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textAlign: 'left' }}>High quality printable document (.pdf)</span>
                  </div>
                </button>

                <button
                  onClick={() => { setDownloadDropdownOpen(false); handleDownloadPNG(); }}
                  className="shadcn-btn-secondary"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}
                >
                  <ImageIcon size={16} color="#0284c7" />
                  <div>
                    <strong style={{ display: 'block', textAlign: 'left' }}>Download PNG Image</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textAlign: 'left' }}>Lossless image format (.png)</span>
                  </div>
                </button>

                <button
                  onClick={() => { setDownloadDropdownOpen(false); handleDownloadJPG(); }}
                  className="shadcn-btn-secondary"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}
                >
                  <Download size={16} color="#16a34a" />
                  <div>
                    <strong style={{ display: 'block', textAlign: 'left' }}>Download JPG Image</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textAlign: 'left' }}>Compressed photo format (.jpg)</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;
