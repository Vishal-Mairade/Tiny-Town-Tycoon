(function () {
    const config = window.GAME_SDK_CONFIG || { provider: "none" };

    function noop() { }

    function callMaybePromise(fn) {
        try {
            const result = fn?.();
            return result?.then ? result : Promise.resolve(result);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    function loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error("Missing SDK script URL"));
                return;
            }

            const existing = options.id
                ? document.getElementById(options.id)
                : document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
                if (existing.dataset.loaded === "true") {
                    resolve();
                }
                return;
            }

            const script = document.createElement("script");
            if (options.id) {
                script.id = options.id;
            }
            script.src = src;
            script.async = true;
            script.onload = () => {
                script.dataset.loaded = "true";
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    class PlatformSDK {
        constructor() {
            const provider = String(config.provider || "none").toLowerCase();
            const allowedProviders = ["crazygames", "gamemonetize", "gamedistribution", "gamepix", "none"];
            this.provider = allowedProviders.includes(provider) ? provider : "none";
            console.log("[PlatformSDK] Active provider detected:", this.provider);
            this.ready = false;
            this.initPromise = null;
            this.storagePrefix = config.storagePrefix || "tiny_town_tycoon_";
            this.readyPromise = new Promise((resolve) => {
                this.resolveReady = resolve;
            });
            this.callbacks = {
                onPause: noop,
                onResume: noop,
                onReady: noop,
                onRewarded: noop,
                onRewardedFail: noop
            };

            // Global ad pause and visibility state tracking
            this.isAdActive = false;
            this.isWindowFocused = true;
            this.isVisible = true;
            this.setupEventHandlers();
        }

        setupEventHandlers() {
            // Window focus/blur listeners
            window.addEventListener('focus', () => {
                console.log("[PlatformSDK] Window gained focus");
                this.isWindowFocused = true;
                this.updatePauseAndAudioState();
            });

            window.addEventListener('blur', () => {
                console.log("[PlatformSDK] Window lost focus");
                this.isWindowFocused = false;
                this.updatePauseAndAudioState();
            });

            // Document visibility listeners
            document.addEventListener('visibilitychange', () => {
                const visible = document.visibilityState === 'visible';
                console.log(`[PlatformSDK] Visibility changed: ${document.visibilityState}`);
                this.isVisible = visible;
                this.updatePauseAndAudioState();
            });

            // Page show/hide listeners
            window.addEventListener('pageshow', () => {
                console.log("[PlatformSDK] Page show");
                this.isVisible = true;
                this.updatePauseAndAudioState();
            });

            window.addEventListener('pagehide', () => {
                console.log("[PlatformSDK] Page hide");
                this.isVisible = false;
                this.updatePauseAndAudioState();
            });

            // GamePix custom events on window
            const adEvents = ['interstitial_start', 'interstitial_end', 'rewarded_start', 'rewarded_end'];
            adEvents.forEach(eventName => {
                window.addEventListener(eventName, () => {
                    console.log(`[PlatformSDK] Window received custom GamePix event: ${eventName}`);
                    this.handleAdEvent(eventName);
                });
            });

            // Parent iframe communication via postMessage
            window.addEventListener('message', (event) => {
                const data = event.data;
                if (!data) return;

                if (typeof data === 'string') {
                    if (adEvents.includes(data)) {
                        console.log(`[PlatformSDK] postMessage string received: ${data}`);
                        this.handleAdEvent(data);
                    }
                } else if (typeof data === 'object') {
                    const type = data.type || data.action || data.event || data.name;
                    if (adEvents.includes(type)) {
                        console.log(`[PlatformSDK] postMessage object type received: ${type}`);
                        this.handleAdEvent(type);
                    }
                }
            });
        }

        handleAdEvent(eventName) {
            console.log(`[PlatformSDK] Handling ad event: ${eventName}`);
            switch (eventName) {
                case 'interstitial_start':
                case 'rewarded_start':
                    this.isAdActive = true;
                    break;
                case 'interstitial_end':
                case 'rewarded_end':
                    this.isAdActive = false;
                    break;
            }
            this.updatePauseAndAudioState();
        }

        updatePauseAndAudioState() {
            const shouldPause = this.isAdActive || !this.isWindowFocused || !this.isVisible;
            console.log(`[PlatformSDK] State evaluated - shouldPause: ${shouldPause} (AdActive: ${this.isAdActive}, WindowFocused: ${this.isWindowFocused}, Visible: ${this.isVisible})`);

            if (shouldPause) {
                // 1. Freeze Phaser gameplay, physics and clocks/timers
                this.pauseGameplay();

                // 2. Mute and pause currently playing procedural audio
                if (window.AudioSystem && typeof window.AudioSystem.suspendAll === 'function') {
                    window.AudioSystem.suspendAll();
                }

                // Call SDK pause callback
                try {
                    this.callbacks.onPause();
                } catch (e) {
                    console.warn("[PlatformSDK] Error calling onPause callback:", e);
                }
            } else {
                // 1. Restore audio context state
                if (window.AudioSystem && typeof window.AudioSystem.resumeAll === 'function') {
                    window.AudioSystem.resumeAll();
                }

                // 2. Resume Phaser gameplay and clocks
                this.resumeGameplay();

                // Call SDK resume callback
                try {
                    this.callbacks.onResume();
                } catch (e) {
                    console.warn("[PlatformSDK] Error calling onResume callback:", e);
                }
            }
        }

        pauseGameplay() {
            if (window.gameInstance && window.gameInstance.state !== 'PAUSED') {
                window.gameInstance.previousState = window.gameInstance.state;
                window.gameInstance.state = 'PAUSED';
                console.log(`[PlatformSDK] Paused gameInstance, previousState: ${window.gameInstance.previousState}`);
            }
        }

        resumeGameplay() {
            if (window.gameInstance && window.gameInstance.state === 'PAUSED') {
                window.gameInstance.state = window.gameInstance.previousState || 'RACING';
                console.log(`[PlatformSDK] Resumed gameInstance, state: ${window.gameInstance.state}`);
            }
        }

        getScopedKey(key) {
            return `${this.storagePrefix}${key}`;
        }

        getLocalStorage() {
            try {
                return window.localStorage;
            } catch (error) {
                console.warn("[PlatformSDK] Local storage unavailable", error);
                return null;
            }
        }

        getGamePixStorage() {
            try {
                if (this.provider === "gamepix" && window.GamePix?.localStorage) {
                    const storage = typeof window.GamePix.localStorage === "function"
                        ? window.GamePix.localStorage()
                        : window.GamePix.localStorage;
                    if (storage && typeof storage.getItem === "function" && typeof storage.setItem === "function") {
                        return storage;
                    }
                }
            } catch (error) {
                console.warn("[PlatformSDK] GamePix storage unavailable", error);
            }
            return null;
        }

        getPreferredStorage() {
            return this.getLocalStorage();
        }

        getStorageCandidates() {
            const stores = [this.getPreferredStorage(), this.getGamePixStorage(), this.getLocalStorage()].filter(Boolean);
            return stores.filter((store, index) => stores.indexOf(store) === index);
        }

        async init(callbacks = {}) {
            this.callbacks = { ...this.callbacks, ...callbacks };

            if (this.initPromise) {
                return this.initPromise;
            }

            console.log("[PlatformSDK] SDK init started for provider:", this.provider);

            this.initPromise = (async () => {
                let success = false;

                if (this.provider === "none") {
                    success = true;
                } else {
                    try {
                        if (this.provider === "crazygames") {
                            await this.initCrazyGames();
                        } else if (this.provider === "gamemonetize") {
                            await this.initGameMonetize();
                        } else if (this.provider === "gamedistribution") {
                            await this.initGameDistribution();
                        } else if (this.provider === "gamepix") {
                            await this.initGamePix();
                        }
                        success = true;
                    } catch (error) {
                        console.warn(`[PlatformSDK] ${this.provider} init failed`, error);
                    }
                }

                if (success) {
                    this.ready = true;
                    console.log("[PlatformSDK] SDK ready");
                    this.callbacks.onReady();
                }

                this.resolveReady?.(success);
                return success;
            })();

            return this.initPromise;
        }

        async waitUntilReady(timeoutMs = 3000) {
            if (this.ready) {
                return true;
            }

            const timeout = new Promise((resolve) => {
                setTimeout(() => resolve(false), timeoutMs);
            });

            await Promise.race([this.readyPromise.then(() => true), timeout]);
            return this.ready;
        }

        async initCrazyGames() {
            await loadScript(config.scripts.crazygames);
            if (!window.CrazyGames?.SDK?.init) {
                throw new Error("CrazyGames SDK not available");
            }

            await window.CrazyGames.SDK.init();
            this.loadingStart();
        }

        async initGameMonetize() {
            window.SDK_OPTIONS = {
                gameId: config.ids.gamemonetize,
                onEvent: (event) => {
                    const eventName = typeof event === "string" ? event : event?.name;
                    if (eventName === "SDK_GAME_PAUSE") {
                        this.isAdActive = true;
                        this.updatePauseAndAudioState();
                    }

                    if (eventName === "SDK_GAME_START") {
                        this.isAdActive = false;
                        this.updatePauseAndAudioState();
                    }

                    if (eventName === "SDK_READY") {
                        this.callbacks.onReady();
                    }
                }
            };

            await loadScript(config.scripts.gamemonetize, { id: "gamemonetize-sdk" });
        }

        async initGameDistribution() {
            window.GD_OPTIONS = {
                gameId: config.ids.gamedistribution,
                prefix: config.gamedistribution?.prefix || "tiny_town_tycoon_",
                advertisementSettings: config.gamedistribution?.advertisementSettings || {},
                onEvent: (event) => {
                    if (event.name === "SDK_GAME_PAUSE") {
                        this.isAdActive = true;
                        this.updatePauseAndAudioState();
                    }

                    if (event.name === "SDK_GAME_START") {
                        this.isAdActive = false;
                        this.updatePauseAndAudioState();
                    }

                    if (event.name === "SDK_READY") {
                        this.callbacks.onReady();
                    }
                }
            };

            await loadScript(config.scripts.gamedistribution);
        }

        async initGamePix() {
            if (!window.GamePix) {
                await loadScript(config.scripts.gamepix);
            }

            if (!window.GamePix) {
                throw new Error("GamePix SDK not loaded");
            }

            if (typeof window.GamePix.init === "function") {
                await window.GamePix.init();
            }

            // Hook direct GamePix events if available on the SDK object
            const adEvents = ['interstitial_start', 'interstitial_end', 'rewarded_start', 'rewarded_end'];
            adEvents.forEach(eventName => {
                if (typeof window.GamePix.addEventListener === 'function') {
                    window.GamePix.addEventListener(eventName, () => {
                        console.log(`[PlatformSDK] GamePix SDK addEventListener fired: ${eventName}`);
                        this.handleAdEvent(eventName);
                    });
                }
                if (typeof window.GamePix.on === 'function') {
                    window.GamePix.on(eventName, () => {
                        console.log(`[PlatformSDK] GamePix SDK on event fired: ${eventName}`);
                        this.handleAdEvent(eventName);
                    });
                }
            });

            if (typeof window.GamePix.loaded === "function") {
                window.GamePix.loaded();
            } else if (window.GamePix.game) {
                window.GamePix.game.loadingStart();
                setTimeout(() => {
                    window.GamePix.game.loadingStop();
                }, 1000);
            }
        }

        loadingStart() {
            console.log("[PlatformSDK] loadingStart fired");
            if (this.provider === "crazygames" && window.CrazyGames?.SDK?.game?.loadingStart) {
                window.CrazyGames.SDK.game.loadingStart();
                return;
            }

            if (this.provider === "gamepix" && window.GamePix?.game?.loadingStart) {
                window.GamePix.game.loadingStart();
            }
        }

        loadingStop() {
            console.log("[PlatformSDK] loadingStop fired");
            if (this.provider === "crazygames" && window.CrazyGames?.SDK?.game?.loadingStop) {
                window.CrazyGames.SDK.game.loadingStop();
                return;
            }

            if (this.provider === "gamepix" && window.GamePix?.game?.loadingStop) {
                window.GamePix.game.loadingStop();
            }
        }

        gameplayStart() {
            console.log("[PlatformSDK] gameplayStart fired");
            if (this.provider === "crazygames" && window.CrazyGames?.SDK?.game?.gameplayStart) {
                window.CrazyGames.SDK.game.gameplayStart();
                return;
            }
            if (this.provider === "gamepix" && window.GamePix?.game?.gameplayStart) {
                window.GamePix.game.gameplayStart();
            }
        }

        gameplayStop() {
            console.log("[PlatformSDK] gameplayStop fired");
            if (this.provider === "crazygames" && window.CrazyGames?.SDK?.game?.gameplayStop) {
                window.CrazyGames.SDK.game.gameplayStop();
                return;
            }

            if (this.provider === "gamepix" && window.GamePix?.game?.gameplayStop) {
                window.GamePix.game.gameplayStop();
            }
        }

        lang() {
            if (this.provider === "gamepix" && typeof window.GamePix?.lang === "function") {
                return window.GamePix.lang();
            }

            return document.documentElement.lang || "en";
        }

        updateScore(value) {
            const score = Number(value);
            if (!Number.isFinite(score)) {
                return null;
            }

            if (this.provider === "gamepix" && typeof window.GamePix?.updateScore === "function") {
                return window.GamePix.updateScore(score);
            }

            return score;
        }

        updateLevel(value) {
            const level = Number(value);
            if (!Number.isFinite(level)) {
                return null;
            }

            if (this.provider === "gamepix" && typeof window.GamePix?.updateLevel === "function") {
                return window.GamePix.updateLevel(level);
            }

            return level;
        }

        happyMoment() {
            console.log("[PlatformSDK] happyMoment fired");
            if (this.provider === "gamepix" && typeof window.GamePix?.happyMoment === "function") {
                window.GamePix.happyMoment();
                return;
            }

            if (this.provider === "crazygames" && window.CrazyGames?.SDK?.game?.happytime) {
                window.CrazyGames.SDK.game.happytime();
            }
        }

        happytime() {
            console.log("[PlatformSDK] happytime fired");
            this.happyMoment();
        }

        getStorage() {
            return this.getPreferredStorage();
        }

        storageGet(key) {
            const scopedKey = this.getScopedKey(key);
            const stores = this.getStorageCandidates();
            for (const storage of stores) {
                try {
                    const scopedValue = storage?.getItem?.(scopedKey);
                    if (scopedValue !== null && scopedValue !== undefined) {
                        return scopedValue;
                    }
                    const legacyValue = storage?.getItem?.(key);
                    if (legacyValue !== null && legacyValue !== undefined) {
                        return legacyValue;
                    }
                } catch (error) {
                    console.warn("[PlatformSDK] storageGet failed", error);
                }
            }
            return null;
        }

        storageSet(key, value) {
            const stringValue = String(value);
            const scopedKey = this.getScopedKey(key);
            const stores = this.getStorageCandidates();
            stores.forEach((storage) => {
                try {
                    storage?.setItem?.(scopedKey, stringValue);
                    storage?.setItem?.(key, stringValue);
                } catch (error) {
                    console.warn("[PlatformSDK] storageSet failed", error);
                }
            });
        }

        storageRemove(key) {
            const scopedKey = this.getScopedKey(key);
            const stores = this.getStorageCandidates();
            stores.forEach((storage) => {
                try {
                    storage?.removeItem?.(scopedKey);
                    storage?.removeItem?.(key);
                } catch (error) {
                    console.warn("[PlatformSDK] storageRemove failed", error);
                }
            });
        }

        async showAd(type = "interstitial") {
            console.log(`[PlatformSDK] ${type} requested`);
            await this.waitUntilReady();
            if (!this.ready) {
                console.warn("[PlatformSDK] showAd aborted, SDK not ready");
                return false;
            }

            if (this.provider === "crazygames") {
                return this.showCrazyGamesAd(type);
            }

            if (this.provider === "gamemonetize") {
                return this.showGameMonetizeAd(type);
            }

            if (this.provider === "gamedistribution") {
                return this.showGameDistributionAd(type);
            }
            if (this.provider === "gamepix") {
                return this.showGamePixAd(type);
            }

            if (this.provider === "none") {
                this.isAdActive = true;
                this.updatePauseAndAudioState();
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.isAdActive = false;
                this.updatePauseAndAudioState();
                if (type === "rewarded") {
                    await callMaybePromise(this.callbacks.onRewarded);
                }
                return true;
            }

            return false;
        }

        async showRewardedAd() {
            return this.showAd("rewarded");
        }

        async requestMidgameAd() {
            return this.showAd("interstitial");
        }

        async requestRewardedAd() {
            return this.showRewardedAd();
        }

        async requestBanner() {
            await this.waitUntilReady();
            if (this.provider === "crazygames" && typeof window.CrazyGames?.SDK?.ad?.showBanner === "function") {
                try {
                    window.CrazyGames.SDK.ad.showBanner();
                    return true;
                } catch (error) {
                    console.warn("[PlatformSDK] CrazyGames banner failed", error);
                }
            }
            return false;
        }

        async requestResponsiveBanner() {
            await this.waitUntilReady();
            if (this.provider === "crazygames" && typeof window.CrazyGames?.SDK?.ad?.showResponsiveBanner === "function") {
                try {
                    window.CrazyGames.SDK.ad.showResponsiveBanner();
                    return true;
                } catch (error) {
                    console.warn("[PlatformSDK] CrazyGames responsive banner failed", error);
                }
            }
            return false;
        }

        async clearBanner() {
            await this.waitUntilReady();
            if (this.provider === "crazygames") {
                if (typeof window.CrazyGames?.SDK?.ad?.hideBanner === "function") {
                    try {
                        window.CrazyGames.SDK.ad.hideBanner();
                        return true;
                    } catch (error) {
                        console.warn("[PlatformSDK] CrazyGames hideBanner failed", error);
                    }
                }
                if (typeof window.CrazyGames?.SDK?.ad?.destroyBanner === "function") {
                    try {
                        window.CrazyGames.SDK.ad.destroyBanner();
                        return true;
                    } catch (error) {
                        console.warn("[PlatformSDK] CrazyGames destroyBanner failed", error);
                    }
                }
            }
            return false;
        }

        async clearAllBanners() {
            return this.clearBanner();
        }

        async showBanner() {
            await this.waitUntilReady();

            if (this.provider === "crazygames" && typeof window.CrazyGames?.SDK?.ad?.showBanner === "function") {
                try {
                    window.CrazyGames.SDK.ad.showBanner();
                    return true;
                } catch (error) {
                    console.warn("[PlatformSDK] CrazyGames banner failed", error);
                    return false;
                }
            }

            if (this.provider === "gamemonetize") {
                return this.showGameMonetizeBanner();
            }

            return false;
        }

        async showCrazyGamesAd(type) {
            const sdk = window.CrazyGames?.SDK?.ad;
            if (!sdk?.requestAd) {
                return false;
            }

            this.isAdActive = true;
            this.updatePauseAndAudioState();
            try {
                const adType = type === "rewarded" ? "rewarded" : "midgame";
                const result = await sdk.requestAd(adType);
                const success = type !== "rewarded" || result?.status === "completed" || result === true || result === undefined;
                if (type === "rewarded" && success) {
                    await callMaybePromise(this.callbacks.onRewarded);
                }
                if (type === "rewarded" && !success) {
                    this.callbacks.onRewardedFail();
                }
                return success;
            } catch (error) {
                console.warn("[PlatformSDK] CrazyGames ad failed", error);
                if (type === "rewarded") {
                    this.callbacks.onRewardedFail();
                }
                return false;
            } finally {
                this.isAdActive = false;
                this.updatePauseAndAudioState();
            }
        }

        async showGameMonetizeAd(type) {
            if (typeof window.sdk?.showBanner !== "function" && typeof window.sdk?.showAd !== "function") {
                return false;
            }

            this.isAdActive = true;
            this.updatePauseAndAudioState();
            try {
                if (type === "rewarded" && typeof window.sdk?.showReward === "function") {
                    const result = await window.sdk.showReward();
                    const success = result?.success !== false;
                    if (success) {
                        await callMaybePromise(this.callbacks.onRewarded);
                    } else {
                        this.callbacks.onRewardedFail();
                    }
                    return success;
                } else if (typeof window.sdk?.showAd === "function") {
                    await window.sdk.showAd();
                } else if (typeof window.sdk?.showBanner === "function") {
                    window.sdk.showBanner();
                }
                return true;
            } catch (error) {
                console.warn("[PlatformSDK] GameMonetize ad failed", error);
                if (type === "rewarded") {
                    this.callbacks.onRewardedFail();
                }
                return false;
            } finally {
                this.isAdActive = false;
                this.updatePauseAndAudioState();
            }
        }

        async showGameMonetizeBanner() {
            if (typeof window.sdk?.showBanner !== "function") {
                return false;
            }

            try {
                window.sdk.showBanner();
                return true;
            } catch (error) {
                console.warn("[PlatformSDK] GameMonetize banner failed", error);
                return false;
            }
        }

        async showGameDistributionAd(type) {
            if (typeof window.gdsdk?.showAd !== "function") {
                return false;
            }

            this.isAdActive = true;
            this.updatePauseAndAudioState();
            try {
                const result = await window.gdsdk.showAd(type === "rewarded" ? "rewarded" : "interstitial");
                const success = type !== "rewarded" || result?.success !== false;
                if (type === "rewarded" && success) {
                    await callMaybePromise(this.callbacks.onRewarded);
                }
                if (type === "rewarded" && !success) {
                    this.callbacks.onRewardedFail();
                }
                return success;
            } catch (error) {
                console.warn("[PlatformSDK] GameDistribution ad failed", error);
                if (type === "rewarded") {
                    this.callbacks.onRewardedFail();
                }
                return false;
            } finally {
                this.isAdActive = false;
                this.updatePauseAndAudioState();
            }
        }

        async showGamePixAd(type) {
            if (!window.GamePix) return false;

            this.isAdActive = true;
            this.updatePauseAndAudioState();

            try {
                if (type === "rewarded") {
                    if (typeof window.GamePix.rewardAd !== "function") {
                        return false;
                    }
                    const res = await window.GamePix.rewardAd();
                    if (res?.success) {
                        await callMaybePromise(this.callbacks.onRewarded);
                        return true;
                    }
                    this.callbacks.onRewardedFail();
                    return false;
                } else {
                    if (typeof window.GamePix.interstitialAd !== "function") {
                        return false;
                    }
                    const res = await window.GamePix.interstitialAd();
                    if (res && "success" in res) {
                        return !!res.success;
                    }
                }
                return true;
            } catch (e) {
                console.warn("GamePix ad failed", e);
                if (type === "rewarded") {
                    this.callbacks.onRewardedFail();
                }
                return false;
            } finally {
                this.isAdActive = false;
                this.updatePauseAndAudioState();
            }
        }
    }

    const platformSDK = new PlatformSDK();
    window.platformSdk = platformSDK;
    window.platformSDK = platformSDK;
    window.PlatformSDK = PlatformSDK;
})();
