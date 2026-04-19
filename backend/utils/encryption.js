const CryptoJS = require('crypto-js');

const KEY = process.env.ENCRYPTION_KEY || 'default_32_char_key_change_this!!';

/**
 * Encrypt sensitive string data using AES-256
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;
  return CryptoJS.AES.encrypt(String(plaintext), KEY).toString();
};

/**
 * Decrypt AES-256 encrypted string
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
};

/**
 * Encrypt an object's sensitive fields
 */
const encryptFields = (obj, fields) => {
  const encrypted = { ...obj };
  fields.forEach((field) => {
    if (encrypted[field]) encrypted[field] = encrypt(String(encrypted[field]));
  });
  return encrypted;
};

/**
 * Decrypt an object's sensitive fields
 */
const decryptFields = (obj, fields) => {
  const decrypted = { ...obj };
  fields.forEach((field) => {
    if (decrypted[field]) decrypted[field] = decrypt(decrypted[field]);
  });
  return decrypted;
};

module.exports = { encrypt, decrypt, encryptFields, decryptFields };
