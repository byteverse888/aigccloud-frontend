"use server";

/**
 * Web3 联盟链操作 Server Actions
 * 通过JSON-RPC与联盟链交互
 */

// 联盟链配置
const CHAIN_RPC_URL = process.env.WEB3_RPC_URL || "http://localhost:8545";
const CHAIN_ID = process.env.WEB3_CHAIN_ID || "1";
const CHAIN_NAME = process.env.WEB3_CHAIN_NAME || "巴特星球联盟链";

/**
 * 创建静态网络 Provider（避免自动重试检测网络）
 */
async function createProvider() {
  const { ethers } = await import("ethers");
  // 使用静态网络配置，避免自动检测和重试
  const network = new ethers.Network(CHAIN_NAME, BigInt(CHAIN_ID));
  return new ethers.JsonRpcProvider(CHAIN_RPC_URL, network, { staticNetwork: network });
}

interface WalletInfo {
  address: string;
  balance: string;
  chainId: string;
  chainName: string;
}

/**
 * 验证钱包签名（用于已有钱包导入）
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const { ethers } = await import("ethers");
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    return {
      success: true,
      verified: recoveredAddress.toLowerCase() === address.toLowerCase(),
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 获取钱包余额
 */
export async function getWalletBalance(address: string): Promise<{
  success: boolean;
  balance?: string;
  formattedBalance?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import("ethers");
    const provider = await createProvider();
    
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);
    
    return {
      success: true,
      balance: balance.toString(),
      formattedBalance,
    };
  } catch (error) {
    console.error('getWalletBalance error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 获取链信息
 */
export async function getChainInfo(): Promise<{
  success: boolean;
  chainId?: string;
  chainName?: string;
  rpcUrl?: string;
  error?: string;
}> {
  try {
    return {
      success: true,
      chainId: CHAIN_ID,
      chainName: CHAIN_NAME,
      rpcUrl: CHAIN_RPC_URL,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 获取用户金币余额（从联盟链ERC20合约）
 */
export async function getCoinBalance(address: string): Promise<{
  success: boolean;
  balance?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import("ethers");
    const provider = await createProvider();
    
    const contractAddress = process.env.WEB3_COIN_CONTRACT;
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      // 合约未配置，返回0
      return { success: true, balance: "0" };
    }
    
    // ERC20 balanceOf ABI
    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const balance = await contract.balanceOf(address);
    return {
      success: true,
      balance: balance.toString(),
    };
  } catch (error) {
    console.error('getCoinBalance error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 生成签名消息（用于验证钱包所有权）
 */
export async function generateSignMessage(address: string): Promise<{
  success: boolean;
  message?: string;
  timestamp?: number;
  error?: string;
}> {
  const timestamp = Date.now();
  const message = `巴特星球钱包绑定验证

地址: ${address}
时间戳: ${timestamp}

请签名此消息以验证您是该钱包的所有者。`;
  
  return {
    success: true,
    message,
    timestamp,
  };
}

/**
 * 使用私钥签名消息（用于登录验证）
 */
export async function signMessageWithPrivateKey(
  privateKey: string,
  message: string
): Promise<{
  success: boolean;
  signature?: string;
  address?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import("ethers");
    
    if (!privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }
    
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(message);
    
    return {
      success: true,
      signature,
      address: wallet.address,
    };
  } catch (error) {
    return {
      success: false,
      error: "签名失败",
    };
  }
}

/**
 * 生成登录消息（带时间戳防重放）
 */
export async function generateLoginMessage(address: string): Promise<{
  success: boolean;
  message?: string;
  timestamp?: number;
  error?: string;
}> {
  const timestamp = Date.now();
  const message = `巴特星球登录验证

地址: ${address}
时间戳: ${timestamp}

请签名此消息以登录您的账户。`;
  
  return {
    success: true,
    message,
    timestamp,
  };
}

