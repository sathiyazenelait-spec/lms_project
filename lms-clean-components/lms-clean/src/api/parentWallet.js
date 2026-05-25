import { request } from './auth';

/**
 * Parent Wallet API Integration
 * Frontend utility for parent wallet operations (uses auth request helper)
 */

/**
 * Get parent's wallet details
 */
export const getParentWallet = async () => {
  try {
    const data = await request("/parent/wallet");
    return { data };
  } catch (error) {
    console.error("Error fetching parent wallet:", error);
    throw error;
  }
};

/**
 * Get wallet balance only
 */
export const getParentWalletBalance = async () => {
  try {
    const balance = await request("/parent/wallet/balance");
    return balance;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    throw error;
  }
};

/**
 * Add balance to parent wallet after successful payment
 */
export const addParentWalletBalance = async (amount, transactionId, notes = "Wallet Recharge") => {
  try {
    const data = await request("/parent/wallet/add-balance", {
      method: "POST",
      body: JSON.stringify({
        amount,
        transactionId,
        notes
      })
    });
    return { data };
  } catch (error) {
    console.error("Error adding wallet balance:", error);
    throw error;
  }
};

/**
 * Pay fee using wallet
 */
export const payFeeWithWallet = async (childId, feeId) => {
  try {
    const data = await request("/parent/wallet/pay-fee", {
      method: "POST",
      body: JSON.stringify({
        childId: Number(childId),
        feeId: Number(feeId)
      })
    });
    return { data };
  } catch (error) {
    console.error("Error paying fee with wallet:", error);
    throw error;
  }
};

/**
 * Get all pending fees for all children
 */
export const getParentPendingFees = async () => {
  try {
    const data = await request("/parent/wallet/pending-fees");
    return { data };
  } catch (error) {
    console.error("Error fetching pending fees:", error);
    throw error;
  }
};

/**
 * Check if parent can pay a specific fee
 */
export const checkParentCanPayFee = async (feeId) => {
  try {
    const data = await request(`/parent/wallet/check-balance/${feeId}`);
    return { data };
  } catch (error) {
    console.error("Error checking balance:", error);
    throw error;
  }
};

export default {
  getParentWallet,
  getParentWalletBalance,
  addParentWalletBalance,
  payFeeWithWallet,
  getParentPendingFees,
  checkParentCanPayFee
};
