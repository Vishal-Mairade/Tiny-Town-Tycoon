window.GAME_SDK_CONFIG = {
    provider: "none",
    scripts: {
        crazygames: "https://sdk.crazygames.com/crazygames-sdk-v3.js",
        gamemonetize: "https://api.gamemonetize.com/sdk.js",
        gamedistribution: "https://html5.api.gamedistribution.com/main.min.js",
        gamepix: "https://integration.gamepix.com/sdk/v3/gamepix.sdk.js"
    },
    ids: {
        crazygames: "",
        gamemonetize: "",
        gamedistribution: "",
        gamepix: ""
    },
    ads: {
        prerollOnStart: true,
        bannerOnMenuScreens: true,
        retryAdOnGameOver: true,
        rewardedCoins: 25
    },
    gamedistribution: {
        prefix: "tiny_town_tycoon_",
        advertisementSettings: {
            autoplay: false,
            debug: false,
            locale: "en"
        }
    }
};
