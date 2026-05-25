import React, { useState, useEffect } from 'react';
import {
  getParentWallet,
  getParentPendingFees,
  payFeeWithWallet,
  addParentWalletBalance,
  checkParentCanPayFee
} from '../api/parentWallet';
import { initiatePayment } from '../api/payment';

/**
 * Parent Wallet Component
 * Displays wallet balance, allows recharging via Razorpay, and paying fees
 */
export const ParentWalletDashboard = () => {
  const T = {
    bg: "#f8f7ff",
    bg2: "#ebe7ff",
    bg3: "#e0d9ff",
    text: "#2d2160",
    muted: "#8b7ba8",
    border: "#d4cde8",
    primary: "#5b4ce8",
    primaryL: "#7d6eef",
    accent: "#ec5a89",
    accentG: "#00d98e",
    accentY: "#ffa800",
    accentR: "#ef4444"
  };

  const [wallet, setWallet] = useState(null);
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [payFeeModal, setPayFeeModal] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parentName = localStorage.getItem("userName") || "Parent";
  const parentEmail = localStorage.getItem("userEmail") || "parent@example.com";

  // Load wallet and pending fees
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [walletRes, feesRes] = await Promise.all([
        getParentWallet(),
        getParentPendingFees()
      ]);

      setWallet(walletRes.data);
      setPendingFees(feesRes.data || {});
    } catch (err) {
      setError(err.message || "Failed to load wallet data");
      console.error("Error loading wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle wallet recharge via Razorpay
  const handleRecharge = async (amount) => {
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      initiatePayment(
        amount,
        parentName,
        parentEmail,
        async (verification) => {
          try {
            // Add balance to wallet
            const result = await addParentWalletBalance(
              amount,
              verification.paymentId,
              `Wallet Recharge - Payment ${verification.paymentId}`
            );

            setSuccess(`✅ Wallet recharged successfully! New balance: ₹${result.data.newBalance}`);
            setRechargeAmount("");
            setRechargeModal(false);
            
            
            // Reload wallet
            setTimeout(() => loadData(), 1500);
          } catch (err) {
            setError(`Payment verified but couldn't update wallet: ${err.message}`);
          } finally {
            setSaving(false);
          }
        },
        (error) => {
          setError(`Payment failed: ${error.message}`);
          setSaving(false);
        }
      );
    } catch (err) {
      setError(err.message || "Failed to initiate payment");
      setSaving(false);
    }
  };

  // Handle paying fee with wallet
  const handlePayFee = async (childId, feeId) => {
    try {
      setSaving(true);
      setError("");

      const result = await payFeeWithWallet(childId, feeId);
      
      setSuccess(`✅ Fee paid successfully! New balance: ₹${result.data.newBalance}`);
      setPayFeeModal(null);
      
      // Reload data
      setTimeout(() => loadData(), 1500);
    } catch (err) {
      setError(err.message || "Failed to pay fee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
        Loading wallet information...
      </div>
    );
  }

  const currentBalance = wallet?.balance || 0;
  const totalDue = pendingFees?.totalDue || 0;
  const canPayAll = pendingFees?.canPayAll || false;
  const allPendingFees = pendingFees?.pendingFees || [];

  return (
    <div className="fade-up" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: 0 }}>
          💳 Wallet & Payments
        </h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "6px 0 0 0" }}>
          Manage wallet balance and pay fees for your children
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          background: "#ef444415",
          border: "1px solid #ef444440",
          borderRadius: 9,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#ef4444"
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "#00d98e15",
          border: "1px solid #00d98e40",
          borderRadius: 9,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#00d98e"
        }}>
          {success}
        </div>
      )}

      {/* Balance Card */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        {/* Wallet Balance */}
        <div style={{
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryL})`,
          borderRadius: 12,
          padding: 20,
          color: "#fff"
        }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>💰 Current Balance</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            ₹{currentBalance.toLocaleString("en-IN")}
          </div>
          <button
            onClick={() => {
              setRechargeModal(true);
              setError("");
              setSuccess("");
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 6,
              padding: "8px 12px",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.2)"}
          >
            + Recharge Wallet
          </button>
        </div>

        {/* Total Pending Fees */}
        <div style={{
          background: canPayAll ? `${T.accentG}15` : `${T.accentY}15`,
          border: `1px solid ${canPayAll ? T.accentG + "40" : T.accentY + "40"}`,
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{
            fontSize: 12,
            color: canPayAll ? T.accentG : T.accentY,
            marginBottom: 8
          }}>
            📋 Pending Fees
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: canPayAll ? T.accentG : T.accentY,
            marginBottom: 12
          }}>
            ₹{totalDue.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            {allPendingFees.length} fee{allPendingFees.length !== 1 ? "s" : ""} pending
          </div>
        </div>

        {/* Status */}
        <div style={{
          background: T.bg3,
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>🎯 Status</div>
          {canPayAll ? (
            <div style={{ fontSize: 14, fontWeight: 700, color: T.accentG }}>
              ✅ Sufficient balance to pay all fees
            </div>
          ) : totalDue > 0 ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.accentR }}>
                ⚠️ Shortfall: ₹{(totalDue - currentBalance).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
                Recharge to pay pending fees
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, color: T.accentG }}>
              ✅ No pending fees
            </div>
          )}
        </div>
      </div>

      {/* Pending Fees Section */}
      {allPendingFees.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>
            Pending Fees ({allPendingFees.length})
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12
          }}>
            {allPendingFees.map(fee => (
              <div
                key={fee.id}
                style={{
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 9,
                  padding: 14,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(91,76,232,.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Fee Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                      {fee.feeType || "Fee"}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {fee.student?.name || "—"} · {fee.student?.department || "—"}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.accentR
                  }}>
                    ₹{fee.amount.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Description */}
                {fee.description && (
                  <div style={{
                    fontSize: 11,
                    color: T.muted,
                    marginBottom: 8,
                    padding: "6px 0"
                  }}>
                    {fee.description}
                  </div>
                )}

                {/* Due Date */}
                <div style={{
                  fontSize: 10,
                  color: T.muted,
                  marginBottom: 10,
                  display: "flex",
                  gap: 8
                }}>
                  <span>📅 Due: {new Date(fee.dueDate).toLocaleDateString("en-IN")}</span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={() => setPayFeeModal(fee)}
                  disabled={currentBalance < fee.amount}
                  style={{
                    width: "100%",
                    background: currentBalance >= fee.amount ? T.primary : T.border,
                    color: currentBalance >= fee.amount ? "#fff" : T.muted,
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: currentBalance >= fee.amount ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    opacity: currentBalance >= fee.amount ? 1 : 0.5
                  }}
                  onMouseEnter={e => {
                    if (currentBalance >= fee.amount) {
                      e.target.style.background = T.primaryL;
                    }
                  }}
                  onMouseLeave={e => {
                    if (currentBalance >= fee.amount) {
                      e.target.style.background = T.primary;
                    }
                  }}
                >
                  💳 Pay with Wallet
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Pending Fees */}
      {allPendingFees.length === 0 && (
        <div style={{
          background: T.bg3,
          borderRadius: 9,
          padding: 32,
          textAlign: "center",
          color: T.muted
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>All fees paid!</div>
          <div style={{ fontSize: 12 }}>No pending fees for your children</div>
        </div>
      )}

      {/* Recharge Modal */}
      {rechargeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16 }}>
              Recharge Wallet
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: 1,
                display: "block",
                marginBottom: 6
              }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={rechargeAmount}
                onChange={e => setRechargeAmount(e.target.value)}
                style={{
                  width: "100%",
                  background: T.bg3,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: T.text,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Suggested amounts */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: 1,
                display: "block",
                marginBottom: 8
              }}>
                Quick Select
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[1000, 5000, 10000, 25000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(String(amount))}
                    style={{
                      background: rechargeAmount === String(amount) ? T.primary : T.bg3,
                      color: rechargeAmount === String(amount) ? "#fff" : T.text,
                      border: `1px solid ${rechargeAmount === String(amount) ? T.primary : T.border}`,
                      borderRadius: 6,
                      padding: "8px 4px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => {
                  setRechargeModal(false);
                  setRechargeAmount("");
                  setError("");
                }}
                style={{
                  background: T.bg3,
                  color: T.text,
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRecharge(Number(rechargeAmount))}
                disabled={saving || !rechargeAmount || Number(rechargeAmount) <= 0}
                style={{
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: saving || !rechargeAmount ? 0.5 : 1
                }}
              >
                {saving ? "Processing..." : "Proceed to Payment →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Fee Modal */}
      {payFeeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16 }}>
              Confirm Fee Payment
            </h2>

            {/* Fee Details */}
            <div style={{
              background: T.bg3,
              borderRadius: 9,
              padding: 14,
              marginBottom: 16
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Student:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {payFeeModal.student?.name}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Fee Type:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {payFeeModal.feeType}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Amount:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.accentR }}>
                  ₹{payFeeModal.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.muted }}>Current Balance:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.accentG }}>
                  ₹{currentBalance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* After Payment */}
            <div style={{
              background: `${T.primary}15`,
              border: `1px solid ${T.primary}30`,
              borderRadius: 9,
              padding: 10,
              marginBottom: 16,
              fontSize: 12,
              color: T.primary
            }}>
              After payment: ₹{Math.max(0, currentBalance - payFeeModal.amount).toLocaleString("en-IN")}
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setPayFeeModal(null)}
                style={{
                  background: T.bg3,
                  color: T.text,
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayFee(payFeeModal.student.id, payFeeModal.id)}
                disabled={saving}
                style={{
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? "Processing..." : "Confirm Payment →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentWalletDashboard;
