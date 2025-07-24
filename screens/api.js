import { Platform } from 'react-native';
import { notify } from './notificationHandler';

export const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://10.162.93.13:8080/api'
    : 'http://10.162.93.13:8080/api'; // Your computer's IP address

// Helper for robust fetch
async function robustFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    // Custom notification messages for important actions
    const method = (options.method || 'GET').toUpperCase();
    let customMessage = null;
    let customType = 'success';
    if (!res.ok) {
      // Error notification
      if (url.includes('/files/upload')) customMessage = 'File upload failed.';
      else if (url.includes('/files/rename')) customMessage = 'File rename failed.';
      else if (url.includes('/files/permanent/')) customMessage = 'File deletion failed.';
      else if (url.includes('/files/favorite/')) customMessage = 'Failed to update favorite.';
      else if (url.includes('/files/download')) customMessage = 'File download failed.';
      else if (url.includes('/files/compress')) customMessage = 'File compression failed.';
      else if (url.includes('/folders')) customMessage = 'Folder operation failed.';
      else customMessage = data?.error || data?.message || 'Network error';
      notify(customMessage, 'error');
      return { success: false, error: data?.error || data?.message || data || 'Network error' };
    }
    // Success notifications for important actions
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      if (url.includes('/files/upload')) customMessage = 'File uploaded successfully!';
      else if (url.includes('/files/rename')) customMessage = 'File renamed successfully!';
      else if (url.includes('/files/permanent/')) customMessage = 'File deleted permanently.';
      else if (url.includes('/files/favorite/')) customMessage = 'Favorite updated!';
      else if (url.includes('/files/download')) customMessage = 'File downloaded!';
      else if (url.includes('/files/compress')) customMessage = 'File compressed successfully!';
      else if (url.includes('/folders')) customMessage = 'Folder operation successful!';
      else customMessage = data?.message || 'Operation successful';
      notify(customMessage, customType);
    }
    return { success: true, data };
  } catch (err) {
    notify(err.message || 'Network error', 'error');
    return { success: false, error: err.message || 'Network error' };
  }
}

// --- AUTH ---
export async function registerUser(data) {
  return robustFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function loginUser(data) {
  // Accepts { identifier, password }
  return robustFetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: data.identifier, password: data.password }),
  });
}

export async function verifyEmail(data) {
  return robustFetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(data) {
  return robustFetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data) {
  return robustFetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// --- USER PROFILE ---
export async function getCurrentUser(token) {
  return robustFetch(`${API_BASE_URL}/user/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function updateCurrentUser(token, data) {
  return robustFetch(`${API_BASE_URL}/user/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deleteCurrentUser(token) {
  return robustFetch(`${API_BASE_URL}/user/me`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function changePassword(token, currentPassword, newPassword) {
  return robustFetch(`${API_BASE_URL}/user/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- FILES ---
export async function listFiles(token, folderId = '') {
  const url = folderId ? `${API_BASE_URL}/files?folderId=${folderId}` : `${API_BASE_URL}/files`;
  return robustFetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function uploadFile(token, file, folderId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  return robustFetch(`${API_BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
}

export async function deleteFile(token, fileId) {
  return robustFetch(`${API_BASE_URL}/files/permanent/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function renameFile(token, fileId, newName) {
  return robustFetch(`${API_BASE_URL}/files/rename/${fileId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newName }),
  });
}

export async function favoriteFile(token, fileId) {
  return robustFetch(`${API_BASE_URL}/files/favorite/${fileId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function downloadFile(token, fileId) {
  return robustFetch(`${API_BASE_URL}/files/${fileId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function getDownloadUrl(token, fileId) {
  // No auth required for public-download, so token is not needed
  return {
    success: true,
    data: {
      url: `${API_BASE_URL}/files/${fileId}/public-download`
    }
  };
}

export async function uploadFiles(token, files, folderId = null) {
  const formData = new FormData();
  files.forEach((file, idx) => {
    formData.append('files', file);
  });
  if (folderId) formData.append('folderId', folderId);
  return robustFetch(`${API_BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
}

export async function searchFiles(token, query) {
  return robustFetch(`${API_BASE_URL}/files/search?query=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

// --- FILE COMPRESSION ---
/**
 * Compress a file using the new backend endpoint.
 * @param {string} token - JWT auth token
 * @param {string} fileId - The file ID to compress
 * @param {object} compressionData - { type, quality, bitrate, format, ... }
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function compressFile(token, fileId, compressionData) {
  return robustFetch(`${API_BASE_URL}/files/${fileId}/compress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(compressionData),
  });
}

/**
 * Extract a compressed file (archive, image, or video) by fileId.
 * @param {string} token - JWT auth token
 * @param {string} fileId - The file ID to extract
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function extractFile(token, fileId) {
  return robustFetch(`${API_BASE_URL}/files/${fileId}/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// --- FOLDERS ---
export async function listFolders(token, parentId = null) {
  const url = parentId ? `${API_BASE_URL}/folders?parentId=${parentId}` : `${API_BASE_URL}/folders`;
  return robustFetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function createFolder(token, name, parentId = null) {
  return robustFetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, parentId }),
  });
}

export async function deleteFolder(token, folderId) {
  return robustFetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function renameFolder(token, folderId, newName) {
  return robustFetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  });
}

// --- DOCUMENT SCANNER ---
export async function uploadScannedDocument(token, fileUri, fileName, folderId = null) {
  try {
    // Use the same Cloudinary upload flow as the main file upload
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/ds5gugfv0';
    const UPLOAD_PRESET = 'EXPO_UPLOAD';
    
    const formData = new FormData();
    
    // Create file object from URI
    const file = {
      uri: fileUri,
      type: 'image/jpeg',
      name: fileName,
    };
    
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'raw'); // Ensure it's treated as a raw file
    formData.append('access_mode', 'public'); // Make it publicly accessible
    formData.append('invalidate', '1'); // Invalidate cache
    
    // Upload to Cloudinary first
    const cloudinaryResponse = await fetch(`${CLOUDINARY_URL}/raw/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.text();
      console.error('Cloudinary upload failed:', errorData);
      return { success: false, error: 'Failed to upload to cloud storage' };
    }
    
    const cloudinaryData = await cloudinaryResponse.json();
    
    if (!cloudinaryData.secure_url) {
      return { success: false, error: 'No URL received from cloud storage' };
    }
    
    // Register the file in the backend
    const registerData = {
      name: fileName,
      url: cloudinaryData.secure_url,
      folderId: folderId,
      type: 'image/jpeg',
      size: cloudinaryData.bytes || 0,
    };
    
    const registerResponse = await robustFetch(`${API_BASE_URL}/files/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });
    
    return registerResponse;
  } catch (error) {
    console.error('Upload scanned document error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

// --- LOGOUT (if implemented on backend) ---
export async function logout(token) {
  return fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  }).then(res => res.json());
}

// --- EXAMPLE USAGE ---
// import { loginUser, getCurrentUser, listFiles } from './api';
// const loginRes = await loginUser({ email, password });
// const token = loginRes.token;
// const user = await getCurrentUser(token);
// const files = await listFiles(token);
// For Google login:
// const googleRes = await googleLogin(idToken);
// const token = googleRes.token;
// const user = await getCurrentUser(token);
// End of example usage

