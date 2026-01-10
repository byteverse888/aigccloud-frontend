'use client';

/**
 * Web3 客户端操作 - 钱包生成和导入
 * 这些操作在浏览器端执行，私钥不会经过服务器
 */

/**
 * 生成新钱包地址
 */
export async function generateWallet(): Promise<{
  success: boolean;
  address?: string;
  privateKey?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    const wallet = ethers.Wallet.createRandom();
    
    return {
      success: true,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 生成带助记词的新钱包（用于注册）
 */
export async function generateWalletWithMnemonic(): Promise<{
  success: boolean;
  address?: string;
  privateKey?: string;
  mnemonic?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    const wallet = ethers.Wallet.createRandom();
    
    return {
      success: true,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 从私钥导入钱包（验证格式）
 */
export async function importWalletFromPrivateKey(privateKey: string): Promise<{
  success: boolean;
  address?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    
    // 验证私钥格式
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    const wallet = new ethers.Wallet(privateKey);
    
    return {
      success: true,
      address: wallet.address,
    };
  } catch (error) {
    return {
      success: false,
      error: '无效的私钥格式',
    };
  }
}

/**
 * 从助记词导入钱包
 */
export async function importWalletFromMnemonic(mnemonic: string): Promise<{
  success: boolean;
  address?: string;
  privateKey?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    
    // 验证助记词格式
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return {
        success: false,
        error: '助记词必须是12或24个单词',
      };
    }
    
    const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
    
    return {
      success: true,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    return {
      success: false,
      error: '无效的助记词',
    };
  }
}

/**
 * 用私钥签名消息（客户端）
 */
export async function signMessage(privateKey: string, message: string): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(message);
    
    return {
      success: true,
      signature,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
