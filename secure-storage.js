/**
 * SecureStorage - A utility to save and load player progress securely in LocalStorage.
 * Uses a lightweight symmetric XOR cipher with custom salting to prevent easy tampering.
 */
class SecureStorage {
    constructor(secretKey = "BimaSaxtiGalaksiSuperSecretKey!") {
        this.secretKey = secretKey;
        this.storageKey = "bima_saxti_secure_progress";
    }

    // Encrypt string with XOR cipher using key
    _xorEncryptDecrypt(input) {
        let output = "";
        for (let i = 0; i < input.length; i++) {
            const charCode = input.charCodeAt(i);
            const keyChar = this.secretKey.charCodeAt(i % this.secretKey.length);
            output += String.fromCharCode(charCode ^ keyChar);
        }
        return output;
    }

    // Convert string to base64 safely
    _toBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    // Decode base64 safely
    _fromBase64(str) {
        return decodeURIComponent(escape(atob(str)));
    }

    // Save game state
    saveProgress(state) {
        try {
            const jsonStr = JSON.stringify(state);
            const encrypted = this._xorEncryptDecrypt(jsonStr);
            const base64 = this._toBase64(encrypted);
            localStorage.setItem(this.storageKey, base64);
            return true;
        } catch (e) {
            console.error("Failed to save progress:", e);
            return false;
        }
    }

    // Load game state
    loadProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return this.getDefaultProgress();

            const encrypted = this._fromBase64(stored);
            const decrypted = this._xorEncryptDecrypt(encrypted);
            const state = JSON.parse(decrypted);

            // Double check data validity
            if (typeof state.unlockedLevel !== 'number' || typeof state.totalScore !== 'number') {
                return this.getDefaultProgress();
            }

            return state;
        } catch (e) {
            console.warn("Corrupted save data or new user, resetting progress.", e);
            const defaultProgress = this.getDefaultProgress();
            this.saveProgress(defaultProgress);
            return defaultProgress;
        }
    }

    getDefaultProgress() {
        return {
            unlockedLevel: 1, // Start at level 1
            totalScore: 0,
            soundEnabled: true,
            musicEnabled: true,
            completedLevels: {} // Keep track of stars or high score per level
        };
    }

    clearProgress() {
        localStorage.removeItem(this.storageKey);
        return this.getDefaultProgress();
    }
}

window.secureStorage = new SecureStorage();
