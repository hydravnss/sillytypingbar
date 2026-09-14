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


let originalParent = null;
let originalNextSibling = null;
let portal = null;
let initialized = false;


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

    const s = getSettings();
    const root = document.documentElement;

    root.style.setProperty("--stb-width", `${s.width}%`);
    root.style.setProperty("--stb-height", `${s.height}px`);
    root.style.setProperty("--stb-radius", `${s.radius}px`);

    root.style.setProperty(
        "--stb-border-width",
        `${s.border_width}px`,
    );

    root.style.setProperty(
        "--stb-border-color",
        s.border_color,
    );

    root.style.setProperty(
        "--stb-background",
        s.background,
    );

    root.style.setProperty(
        "--stb-accent-color",
        s.accent_color,
    );

    root.style.setProperty(
        "--stb-accent-width",
        `${s.accent_width}px`,
    );

    root.style.setProperty(
        "--stb-text-size",
        `${s.text_size}px`,
    );

    root.style.setProperty(
        "--stb-horizontal-margin",
        `${s.horizontal_margin}px`,
    );

    root.style.setProperty(
        "--stb-vertical-margin",
        `${s.vertical_margin}px`,
    );

    root.style.setProperty(
        "--stb-blur",
        `${s.blur}px`,
    );

    root.classList.toggle(
        "stb-disabled",
        !s.enabled,
    );

    root.classList.toggle(
        "stb-position-top",
        s.position === "top",
    );

    root.classList.toggle(
        "stb-position-bottom",
        s.position === "bottom",
    );

    root.classList.toggle(
        "stb-no-shadow",
        !s.shadow,
    );
}


/* =========================================================
   CREATE PORTAL
   ========================================================= */

function createPortal() {

    if (portal && document.body.contains(portal)) {
        return portal;
    }

    portal = document.createElement("div");

    portal.id = "sillytypingbar-portal";

    portal.setAttribute(
        "data-sillytypingbar",
        "true",
    );

    document.body.appendChild(portal);

    return portal;
}


/* =========================================================
   MOVE NATIVE FORM OUTSIDE CHAT
   ========================================================= */

function moveFormToPortal() {

    const formSheld =
        document.getElementById("form_sheld");

    if (!formSheld) {
        return false;
    }

    const target = createPortal();

    if (
        formSheld.parentElement === target
    ) {
        return true;
    }

    if (!originalParent) {

        originalParent =
            formSheld.parentElement;

        originalNextSibling =
            formSheld.nextSibling;
    }

    target.appendChild(formSheld);

    formSheld.classList.add(
        "sillytypingbar-host",
    );

    const sendForm =
        document.getElementById("send_form");

    if (sendForm) {

        sendForm.classList.add(
            "sillytypingbar",
        );
    }

    const textarea =
        document.getElementById("send_textarea");

    if (textarea) {

        textarea.classList.add(
            "sillytypingbar-textarea",
        );
    }

    return true;
}


/* =========================================================
   RESTORE NATIVE FORM
   ========================================================= */

function restoreForm() {

    const formSheld =
        document.getElementById("form_sheld");

    if (
        !formSheld ||
        !originalParent
    ) {
        return;
    }

    if (
        originalNextSibling &&
        originalNextSibling.parentNode === originalParent
    ) {

        originalParent.insertBefore(
            formSheld,
            originalNextSibling,
        );

    } else {

        originalParent.appendChild(
            formSheld,
        );
    }

    formSheld.classList.remove(
        "sillytypingbar-host",
    );

    const sendForm =
        document.getElementById("send_form");

    if (sendForm) {

        sendForm.classList.remove(
            "sillytypingbar",
        );
    }

    originalParent = null;
    originalNextSibling = null;
}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

function getCharacterName() {

    try {

        const context = getContext();

        if (
            context?.characters &&
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
            "[SillyTypingBar]",
            error,
        );
    }

    return "";
}


function updatePlaceholder() {

    const textarea =
        document.getElementById(
            "send_textarea",
        );

    if (!textarea) {
        return;
    }

    const s = getSettings();

    if (!s.placeholder_character) {

        textarea.placeholder =
            "Type a message...";

        return;
    }

    textarea.placeholder =
        getCharacterName() ||
        "Type a message...";
}


/* =========================================================
   APPLY BAR
   ========================================================= */

function applyBar() {

    const s = getSettings();

    applySettings();

    if (!s.enabled) {

        restoreForm();

        return;
    }

    moveFormToPortal();

    updatePlaceholder();
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

        bindSettings();
        refreshSettingsUI();

    } catch (error) {

        console.error(
            "[SillyTypingBar] Settings error:",
            error,
        );
    }
}


/* =========================================================
   SETTINGS
   ========================================================= */

function bindSettings() {

    const s = getSettings();


    $("#stb-enabled")
        .prop("checked", s.enabled)
        .on("change", function () {

            s.enabled = this.checked;

            saveSettingsDebounced();

            applyBar();
        });


    $("#stb-position")
        .val(s.position)
        .on("change", function () {

            s.position = this.value;

            saveSettingsDebounced();

            applyBar();
        });


    bindRange(
        "#stb-width",
        "#stb-width-value",
        s,
        "width",
        "%",
    );

    bindRange(
        "#stb-height",
        "#stb-height-value",
        s,
        "height",
        "px",
    );

    bindRange(
        "#stb-radius",
        "#stb-radius-value",
        s,
        "radius",
        "px",
    );

    bindRange(
        "#stb-border-width",
        "#stb-border-width-value",
        s,
        "border_width",
        "px",
    );

    bindRange(
        "#stb-accent-width",
        "#stb-accent-width-value",
        s,
        "accent_width",
        "px",
    );

    bindRange(
        "#stb-text-size",
        "#stb-text-size-value",
        s,
        "text_size",
        "px",
    );

    bindRange(
        "#stb-horizontal-margin",
        "#stb-horizontal-margin-value",
        s,
        "horizontal_margin",
        "px",
    );

    bindRange(
        "#stb-vertical-margin",
        "#stb-vertical-margin-value",
        s,
        "vertical_margin",
        "px",
    );

    bindRange(
        "#stb-blur",
        "#stb-blur-value",
        s,
        "blur",
        "px",
    );


    bindText(
        "#stb-border-color",
        s,
        "border_color",
    );

    bindText(
        "#stb-background",
        s,
        "background",
    );

    bindText(
        "#stb-accent-color",
        s,
        "accent_color",
    );


    $("#stb-placeholder-character")
        .prop(
            "checked",
            s.placeholder_character,
        )
        .on("change", function () {

            s.placeholder_character =
                this.checked;

            saveSettingsDebounced();

            updatePlaceholder();
        });


    $("#stb-shadow")
        .prop(
            "checked",
            s.shadow,
        )
        .on("change", function () {

            s.shadow = this.checked;

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

            refreshSettingsUI();
            applyBar();
        });
}


function bindRange(
    selector,
    output,
    settings,
    key,
    suffix,
) {

    $(selector)
        .val(settings[key])
        .on("input change", function () {

            settings[key] =
                Number(this.value);

            $(output).text(
                `${settings[key]}${suffix}`,
            );

            saveSettingsDebounced();

            applySettings();
        });
}


function bindText(
    selector,
    settings,
    key,
) {

    $(selector)
        .val(settings[key])
        .on("input change", function () {

            settings[key] =
                this.value;

            saveSettingsDebounced();

            applySettings();
        });
}


function refreshSettingsUI() {

    const s = getSettings();

    $("#stb-enabled")
        .prop("checked", s.enabled);

    $("#stb-position")
        .val(s.position);

    setUI(
        "#stb-width",
        "#stb-width-value",
        s.width,
        "%",
    );

    setUI(
        "#stb-height",
        "#stb-height-value",
        s.height,
        "px",
    );

    setUI(
        "#stb-radius",
        "#stb-radius-value",
        s.radius,
        "px",
    );

    setUI(
        "#stb-border-width",
        "#stb-border-width-value",
        s.border_width,
        "px",
    );

    setUI(
        "#stb-accent-width",
        "#stb-accent-width-value",
        s.accent_width,
        "px",
    );

    setUI(
        "#stb-text-size",
        "#stb-text-size-value",
        s.text_size,
        "px",
    );

    setUI(
        "#stb-horizontal-margin",
        "#stb-horizontal-margin-value",
        s.horizontal_margin,
        "px",
    );

    setUI(
        "#stb-vertical-margin",
        "#stb-vertical-margin-value",
        s.vertical_margin,
        "px",
    );

    setUI(
        "#stb-blur",
        "#stb-blur-value",
        s.blur,
        "px",
    );

    $("#stb-border-color")
        .val(s.border_color);

    $("#stb-background")
        .val(s.background);

    $("#stb-accent-color")
        .val(s.accent_color);

    $("#stb-placeholder-character")
        .prop(
            "checked",
            s.placeholder_character,
        );

    $("#stb-shadow")
        .prop(
            "checked",
            s.shadow,
        );
}


function setUI(
    selector,
    output,
    value,
    suffix,
) {

    $(selector).val(value);

    $(output).text(
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

            setTimeout(
                applyBar,
                250,
            );
        },
    );

    eventSource.on(
        event_types.CHARACTER_MESSAGE_RENDERED,
        updatePlaceholder,
    );
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

    await loadSettingsPanel();

    applyBar();

    registerEvents();

    /*
     * SillyTavern peut recréer #form_sheld
     * lors d'un changement de layout.
     *
     * On vérifie seulement toutes les 2 secondes.
     */

    setInterval(() => {

        if (getSettings().enabled) {
            applyBar();
        }

    }, 2000);

    console.log(
        "[SillyTypingBar] Portal mode loaded.",
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