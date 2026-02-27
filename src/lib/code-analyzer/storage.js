// Local storage utilities for conversation persistence

const STORAGE_PREFIX = "repomind_";

export function saveConversation(owner, repo, messages) {
  try {
    const key = `${STORAGE_PREFIX}repo_${owner}_${repo}`;
    localStorage.setItem(key, JSON.stringify({
      messages,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Failed to save conversation:", e);
  }
}

export function loadConversation(owner, repo) {
  try {
    const key = `${STORAGE_PREFIX}repo_${owner}_${repo}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const { messages, timestamp } = JSON.parse(stored);
    
    // Expire after 7 days
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SEVEN_DAYS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return messages;
  } catch (e) {
    console.error("Failed to load conversation:", e);
    return null;
  }
}

export function clearConversation(owner, repo) {
  try {
    const key = `${STORAGE_PREFIX}repo_${owner}_${repo}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear conversation:", e);
  }
}

export function saveProfileConversation(username, messages) {
  try {
    const key = `${STORAGE_PREFIX}profile_${username}`;
    localStorage.setItem(key, JSON.stringify({
      messages,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Failed to save profile conversation:", e);
  }
}

export function loadProfileConversation(username) {
  try {
    const key = `${STORAGE_PREFIX}profile_${username}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const { messages, timestamp } = JSON.parse(stored);
    
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SEVEN_DAYS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return messages;
  } catch (e) {
    console.error("Failed to load profile conversation:", e);
    return null;
  }
}

export function clearProfileConversation(username) {
  try {
    const key = `${STORAGE_PREFIX}profile_${username}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear profile conversation:", e);
  }
}
