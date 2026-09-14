import {
    extension_settings,
    getContext,
} from "../../../extensions.js";

import {
    saveSettingsDebounced,
    eventSource,
    event_types,
} from "../../../../script.js";


const extensionName = "sillytypingbar";


const defaultSettings = {
    enabled: true,

    position: "bottom",

    width: 96,
    height: 62,
    radius: 32,

    border_width: 2,
    border_color: "#34351f",

    background: "rgba(0, 0, 0, 0.92)",

    accent_color: "#c71945",
    accent_width: 4,

    text_size: 17,

    horizontal_margin: 24,
    vertical_margin: 10,

    placeholder_character: true,

    blur: 12,
    shadow: true,
};


let initialized = false;
let refreshTimer = null;


/* =========================================================
   SETTINGS
   ========================================================= */

function getSettings() {

    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] =
            structuredClone(defaultSettings);
    }

    extension_settings[extensionName] = {
        ...structuredClone(defaultSettings),
        ...extension_settings[extensionName],
    };

    return extension_settings[extensionName];
}


/* =========================================================
   CSS VARIABLES
   ========================================================= */

function applySettings() {

    const settings = getSettings();
    const root = document.documentElement;

    root.style.setProperty(
        "--stb-width",
        `${settings.width}%`,
    );

    root.style.setProperty(
        "--stb-height",
        `${settings.height}px`,
    );

    root.style.setProperty(
        "--stb-radius",
        `${settings.radius}px`,
    );

    root.style.setProperty(
        "--stb-border-width",
        `${settings.border_width}px`,
    );

    root.style.setProperty(
        "--stb-border-color",
        settings.border_color,
    );

    root.style.setProperty(
        "--stb-background",
        settings.background,
    );

    root.style.setProperty(
        "--stb-accent-color",
        settings.accent_color,
    );

    root.style.setProperty(
        "--stb-accent-width",
        `${settings.accent_width}px`,
    );

    root.style.setProperty(
        "--stb-text-size",
        `${settings.text_size}px`,
    );

    root.style.setProperty(
        "--stb-horizontal-margin",
        `${settings.horizontal_margin}px`,
    );

    root.style.setProperty(
        "--stb-vertical-margin",
        `${settings.vertical_margin}px`,
    );

    root.style.setProperty(
        "--stb-blur",
        `${settings.blur}px`,
    );

    root.classList.toggle(
        "stb-disabled",
        !settings.enabled,
    );

    root.classList.toggle(
        "stb-position-top",
        settings.position === "top",
    );

    root.classList.toggle(
        "stb-position-bottom",
        settings.position === "bottom",
    );

    root.classList.toggle(
        "stb-no-shadow",
        !settings.shadow,
    );
}


/* =========================================================
   FIND / PREPARE NATIVE SILLYTAVERN INPUT
   ========================================================= */

function decorateSendForm() {

    const formSheld =
        document.getElementById("form_sheld");

    const sendForm =
        document.getElementById("send_form");

    const textarea =
        document.getElementById("send_textarea");

    if (!formSheld || !sendForm) {
        return false;
    }

    formSheld.classList.add(
        "sillytypingbar-host",
    );

    sendForm.classList.add(
        "sillytypingbar",
    );

    if (textarea) {
        textarea.classList.add(
            "sillytypingbar-textarea",
        );
    }

    const left =
        document.getElementById("leftSendForm");

    if (left) {
        left.classList.add(
            "sillytypingbar-left",
        );
    }

    const right =
        document.getElementById("rightSendForm");

    if (right) {
        right.classList.add(
            "sillytypingbar-right",
        );
    }

    updatePlaceholder();

    return true;
}


/* =========================================================
   CHARACTER NAME
   ========================================================= */

function getCurrentCharacterName() {

    try {

        const context = getContext();

        if (
            context &&
            context.characters &&
            context.characterId !== undefined
        ) {

            const character =
                context.characters[
                    context.characterId
                ];

            if (character?.name) {
                return character.name;
            }
        }

        if (context?.name2) {
            return context.name2;
        }

    } catch (error) {

        console.warn(
            "[SillyTypingBar] Character name error:",
            error,
        );
    }

    return "";
}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

function updatePlaceholder() {

    const settings = getSettings();

    const textarea =
        document.getElementById("send_textarea");

    if (!textarea) {
        return;
    }

    if (!settings.placeholder_character) {

        textarea.placeholder =
            "Type a message...";

        return;
    }

    const name =
        getCurrentCharacterName();

    textarea.placeholder =
        name || "Type a message...";
}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshBar() {

    if (!getSettings().enabled) {
        return;
    }

    decorateSendForm();
}


/* =========================================================
   SAFE REFRESH
   ========================================================= */

function scheduleRefresh() {

    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {

        refreshTimer = null;

        refreshBar();

    }, 100);
}


/* =========================================================
   SETTINGS PANEL
   ========================================================= */

async function loadSettingsPanel() {

    const container =
        document.querySelector(
            "#extensions_settings2",
        );

    if (!container) {
        return;
    }

    if (
        document.querySelector(
            "#sillytypingbar-settings",
        )
    ) {
        return;
    }

    try {

        const context = getContext();

        const html =
            await context.renderExtensionTemplateAsync(
                "third-party/sillytypingbar",
                "settings",
            );

        container.insertAdjacentHTML(
            "beforeend",
            html,
        );

    } catch (error) {

        console.error(
            "[SillyTypingBar] Settings loading failed:",
            error,
        );

        return;
    }

    bindSettings();
    refreshSettingsUI();
}


/* =========================================================
   SETTINGS BINDING
   ========================================================= */

function bindSettings() {

    const settings = getSettings();


    $("#stb-enabled")
        .prop(
            "checked",
            settings.enabled,
        )
        .on("change", function () {

            settings.enabled =
                this.checked;

            saveSettingsDebounced();

            applySettings();

            scheduleRefresh();
        });


    $("#stb-position")
        .val(settings.position)
        .on("change", function () {

            settings.position =
                this.value;

            saveSettingsDebounced();

            applySettings();

            scheduleRefresh();
        });


    bindRange(
        "#stb-width",
        "#stb-width-value",
        settings,
        "width",
        "%",
    );

    bindRange(
        "#stb-height",
        "#stb-height-value",
        settings,
        "height",
        "px",
    );

    bindRange(
        "#stb-radius",
        "#stb-radius-value",
        settings,
        "radius",
        "px",
    );

    bindRange(
        "#stb-border-width",
        "#stb-border-width-value",
        settings,
        "border_width",
        "px",
    );

    bindRange(
        "#stb-accent-width",
        "#stb-accent-width-value",
        settings,
        "accent_width",
        "px",
    );

    bindRange(
        "#stb-text-size",
        "#stb-text-size-value",
        settings,
        "text_size",
        "px",
    );

    bindRange(
        "#stb-horizontal-margin",
        "#stb-horizontal-margin-value",
        settings,
        "horizontal_margin",
        "px",
    );

    bindRange(
        "#stb-vertical-margin",
        "#stb-vertical-margin-value",
        settings,
        "vertical_margin",
        "px",
    );

    bindRange(
        "#stb-blur",
        "#stb-blur-value",
        settings,
        "blur",
        "px",
    );


    bindText(
        "#stb-border-color",
        settings,
        "border_color",
    );

    bindText(
        "#stb-background",
        settings,
        "background",
    );

    bindText(
        "#stb-accent-color",
        settings,
        "accent_color",
    );


    $("#stb-placeholder-character")
        .prop(
            "checked",
            settings.placeholder_character,
        )
        .on("change", function () {

            settings.placeholder_character =
                this.checked;

            saveSettingsDebounced();

            updatePlaceholder();
        });


    $("#stb-shadow")
        .prop(
            "checked",
            settings.shadow,
        )
        .on("change", function () {

            settings.shadow =
                this.checked;

            saveSettingsDebounced();

            applySettings();
        });


    $("#stb-reset")
        .on("click", function () {

            extension_settings[extensionName] =
                structuredClone(
                    defaultSettings,
                );

            saveSettingsDebounced();

            applySettings();

            refreshSettingsUI();

            scheduleRefresh();

            updatePlaceholder();
        });
}


/* =========================================================
   RANGE HELPER
   ========================================================= */

function bindRange(
    selector,
    valueSelector,
    settings,
    key,
    suffix,
) {

    $(selector)
        .val(settings[key])
        .on(
            "input change",
            function () {

                settings[key] =
                    Number(this.value);

                $(valueSelector).text(
                    `${settings[key]}${suffix}`,
                );

                saveSettingsDebounced();

                applySettings();
            },
        );
}


/* =========================================================
   TEXT HELPER
   ========================================================= */

function bindText(
    selector,
    settings,
    key,
) {

    $(selector)
        .val(settings[key])
        .on(
            "input change",
            function () {

                settings[key] =
                    this.value;

                saveSettingsDebounced();

                applySettings();
            },
        );
}


/* =========================================================
   REFRESH SETTINGS UI
   ========================================================= */

function refreshSettingsUI() {

    const settings = getSettings();


    $("#stb-enabled")
        .prop(
            "checked",
            settings.enabled,
        );

    $("#stb-position")
        .val(settings.position);


    setRangeUI(
        "#stb-width",
        "#stb-width-value",
        settings.width,
        "%",
    );

    setRangeUI(
        "#stb-height",
        "#stb-height-value",
        settings.height,
        "px",
    );

    setRangeUI(
        "#stb-radius",
        "#stb-radius-value",
        settings.radius,
        "px",
    );

    setRangeUI(
        "#stb-border-width",
        "#stb-border-width-value",
        settings.border_width,
        "px",
    );

    setRangeUI(
        "#stb-accent-width",
        "#stb-accent-width-value",
        settings.accent_width,
        "px",
    );

    setRangeUI(
        "#stb-text-size",
        "#stb-text-size-value",
        settings.text_size,
        "px",
    );

    setRangeUI(
        "#stb-horizontal-margin",
        "#stb-horizontal-margin-value",
        settings.horizontal_margin,
        "px",
    );

    setRangeUI(
        "#stb-vertical-margin",
        "#stb-vertical-margin-value",
        settings.vertical_margin,
        "px",
    );

    setRangeUI(
        "#stb-blur",
        "#stb-blur-value",
        settings.blur,
        "px",
    );


    $("#stb-border-color")
        .val(settings.border_color);

    $("#stb-background")
        .val(settings.background);

    $("#stb-accent-color")
        .val(settings.accent_color);


    $("#stb-placeholder-character")
        .prop(
            "checked",
            settings.placeholder_character,
        );

    $("#stb-shadow")
        .prop(
            "checked",
            settings.shadow,
        );
}


function setRangeUI(
    selector,
    valueSelector,
    value,
    suffix,
) {

    $(selector).val(value);

    $(valueSelector).text(
        `${value}${suffix}`,
    );
}


/* =========================================================
   EVENTS
   ========================================================= */

function registerEvents() {

    eventSource.on(
        event_types.CHAT_CHANGED,
        () => {

            setTimeout(() => {

                scheduleRefresh();

                updatePlaceholder();

            }, 150);
        },
    );


    eventSource.on(
        event_types.CHARACTER_MESSAGE_RENDERED,
        () => {

            updatePlaceholder();

        },
    );
}


/* =========================================================
   LIGHTWEIGHT WATCHER
   ========================================================= */

function startWatcher() {

    setInterval(() => {

        const form =
            document.getElementById(
                "send_form",
            );

        const host =
            document.getElementById(
                "form_sheld",
            );

        if (
            form &&
            host &&
            !form.classList.contains(
                "sillytypingbar",
            )
        ) {

            decorateSendForm();
        }

    }, 1000);
}


/* =========================================================
   INIT
   ========================================================= */

async function init() {

    if (initialized) {
        return;
    }

    initialized = true;

    getSettings();

    applySettings();

    decorateSendForm();

    await loadSettingsPanel();

    updatePlaceholder();

    registerEvents();

    startWatcher();

    console.log(
        "[SillyTypingBar] Loaded successfully.",
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        { once: true },
    );

} else {

    init();
}