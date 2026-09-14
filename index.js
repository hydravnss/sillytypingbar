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
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

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

function getSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = structuredClone(defaultSettings);
    }

    extension_settings[extensionName] = {
        ...structuredClone(defaultSettings),
        ...extension_settings[extensionName],
    };

    return extension_settings[extensionName];
}


/* ---------------------------------------------------------
   CSS VARIABLES
--------------------------------------------------------- */

function applySettings() {
    const settings = getSettings();

    document.documentElement.style.setProperty(
        "--stb-width",
        `${settings.width}%`,
    );

    document.documentElement.style.setProperty(
        "--stb-height",
        `${settings.height}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-radius",
        `${settings.radius}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-border-width",
        `${settings.border_width}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-border-color",
        settings.border_color,
    );

    document.documentElement.style.setProperty(
        "--stb-background",
        settings.background,
    );

    document.documentElement.style.setProperty(
        "--stb-accent-color",
        settings.accent_color,
    );

    document.documentElement.style.setProperty(
        "--stb-accent-width",
        `${settings.accent_width}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-text-size",
        `${settings.text_size}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-horizontal-margin",
        `${settings.horizontal_margin}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-vertical-margin",
        `${settings.vertical_margin}px`,
    );

    document.documentElement.style.setProperty(
        "--stb-blur",
        `${settings.blur}px`,
    );

    document.documentElement.classList.toggle(
        "stb-disabled",
        !settings.enabled,
    );

    document.documentElement.classList.toggle(
        "stb-position-top",
        settings.position === "top",
    );

    document.documentElement.classList.toggle(
        "stb-position-bottom",
        settings.position === "bottom",
    );

    document.documentElement.classList.toggle(
        "stb-no-shadow",
        !settings.shadow,
    );
}


/* ---------------------------------------------------------
   FIND SEND FORM
--------------------------------------------------------- */

function decorateSendForm() {
    const sendForm = document.getElementById("send_form");

    if (!sendForm) {
        return;
    }

    sendForm.classList.add("sillytypingbar");

    const textarea = document.getElementById("send_textarea");

    if (textarea) {
        textarea.classList.add("sillytypingbar-textarea");
    }

    const left = document.getElementById("leftSendForm");

    if (left) {
        left.classList.add("sillytypingbar-left");
    }

    const right = document.getElementById("rightSendForm");

    if (right) {
        right.classList.add("sillytypingbar-right");
    }

    updatePlaceholder();
}


/* ---------------------------------------------------------
   CHARACTER NAME / PLACEHOLDER
--------------------------------------------------------- */

function getCurrentCharacterName() {
    try {
        const context = getContext();

        if (context?.characters && context?.characterId !== undefined) {
            const character = context.characters[context.characterId];

            if (character?.name) {
                return character.name;
            }
        }

        if (context?.name2) {
            return context.name2;
        }
    } catch (error) {
        console.warn("[SillyTypingBar] Could not get character name.", error);
    }

    return "";
}


function updatePlaceholder() {
    const settings = getSettings();
    const textarea = document.getElementById("send_textarea");

    if (!textarea) {
        return;
    }

    if (!settings.placeholder_character) {
        textarea.setAttribute(
            "placeholder",
            "Type a message...",
        );

        return;
    }

    const characterName = getCurrentCharacterName();

    if (characterName) {
        textarea.setAttribute(
            "placeholder",
            characterName,
        );
    } else {
        textarea.setAttribute(
            "placeholder",
            "Type a message...",
        );
    }
}


/* ---------------------------------------------------------
   SETTINGS HTML
--------------------------------------------------------- */

async function loadSettingsPanel() {
    const container = document.querySelector("#extensions_settings2");

    if (!container) {
        return;
    }

    if (document.querySelector("#sillytypingbar-settings")) {
        return;
    }

    try {
        const html = await $.get(
            `${extensionFolderPath}/settings.html`,
        );

        container.insertAdjacentHTML(
            "beforeend",
            html,
        );
    } catch (error) {
        console.error(
            "[SillyTypingBar] Failed to load settings.html",
            error,
        );

        return;
    }

    bindSettings();
    refreshSettingsUI();
}


/* ---------------------------------------------------------
   SETTINGS
--------------------------------------------------------- */

function bindSettings() {
    const settings = getSettings();

    $("#stb-enabled")
        .prop("checked", settings.enabled)
        .on("change", function () {
            settings.enabled = this.checked;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-position")
        .val(settings.position)
        .on("change", function () {
            settings.position = this.value;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-width")
        .val(settings.width)
        .on("input change", function () {
            settings.width = Number(this.value);

            $("#stb-width-value").text(`${settings.width}%`);

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-height")
        .val(settings.height)
        .on("input change", function () {
            settings.height = Number(this.value);

            $("#stb-height-value").text(`${settings.height}px`);

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-radius")
        .val(settings.radius)
        .on("input change", function () {
            settings.radius = Number(this.value);

            $("#stb-radius-value").text(`${settings.radius}px`);

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-border-width")
        .val(settings.border_width)
        .on("input change", function () {
            settings.border_width = Number(this.value);

            $("#stb-border-width-value").text(
                `${settings.border_width}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-border-color")
        .val(settings.border_color)
        .on("input change", function () {
            settings.border_color = this.value;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-background")
        .val(settings.background)
        .on("input change", function () {
            settings.background = this.value;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-accent-color")
        .val(settings.accent_color)
        .on("input change", function () {
            settings.accent_color = this.value;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-accent-width")
        .val(settings.accent_width)
        .on("input change", function () {
            settings.accent_width = Number(this.value);

            $("#stb-accent-width-value").text(
                `${settings.accent_width}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-text-size")
        .val(settings.text_size)
        .on("input change", function () {
            settings.text_size = Number(this.value);

            $("#stb-text-size-value").text(
                `${settings.text_size}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-horizontal-margin")
        .val(settings.horizontal_margin)
        .on("input change", function () {
            settings.horizontal_margin = Number(this.value);

            $("#stb-horizontal-margin-value").text(
                `${settings.horizontal_margin}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-vertical-margin")
        .val(settings.vertical_margin)
        .on("input change", function () {
            settings.vertical_margin = Number(this.value);

            $("#stb-vertical-margin-value").text(
                `${settings.vertical_margin}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-blur")
        .val(settings.blur)
        .on("input change", function () {
            settings.blur = Number(this.value);

            $("#stb-blur-value").text(
                `${settings.blur}px`,
            );

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-placeholder-character")
        .prop("checked", settings.placeholder_character)
        .on("change", function () {
            settings.placeholder_character = this.checked;

            saveSettingsDebounced();
            updatePlaceholder();
        });


    $("#stb-shadow")
        .prop("checked", settings.shadow)
        .on("change", function () {
            settings.shadow = this.checked;

            saveSettingsDebounced();
            applySettings();
        });


    $("#stb-reset")
        .on("click", function () {
            extension_settings[extensionName] =
                structuredClone(defaultSettings);

            saveSettingsDebounced();

            refreshSettingsUI();
            applySettings();
            updatePlaceholder();
        });
}


function refreshSettingsUI() {
    const settings = getSettings();

    $("#stb-enabled").prop(
        "checked",
        settings.enabled,
    );

    $("#stb-position").val(
        settings.position,
    );

    $("#stb-width")
        .val(settings.width);

    $("#stb-width-value")
        .text(`${settings.width}%`);


    $("#stb-height")
        .val(settings.height);

    $("#stb-height-value")
        .text(`${settings.height}px`);


    $("#stb-radius")
        .val(settings.radius);

    $("#stb-radius-value")
        .text(`${settings.radius}px`);


    $("#stb-border-width")
        .val(settings.border_width);

    $("#stb-border-width-value")
        .text(`${settings.border_width}px`);


    $("#stb-border-color")
        .val(settings.border_color);


    $("#stb-background")
        .val(settings.background);


    $("#stb-accent-color")
        .val(settings.accent_color);


    $("#stb-accent-width")
        .val(settings.accent_width);

    $("#stb-accent-width-value")
        .text(`${settings.accent_width}px`);


    $("#stb-text-size")
        .val(settings.text_size);

    $("#stb-text-size-value")
        .text(`${settings.text_size}px`);


    $("#stb-horizontal-margin")
        .val(settings.horizontal_margin);

    $("#stb-horizontal-margin-value")
        .text(`${settings.horizontal_margin}px`);


    $("#stb-vertical-margin")
        .val(settings.vertical_margin);

    $("#stb-vertical-margin-value")
        .text(`${settings.vertical_margin}px`);


    $("#stb-blur")
        .val(settings.blur);

    $("#stb-blur-value")
        .text(`${settings.blur}px`);


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


/* ---------------------------------------------------------
   INITIALIZATION
--------------------------------------------------------- */

async function init() {
    getSettings();

    applySettings();

    decorateSendForm();

    await loadSettingsPanel();

    updatePlaceholder();

    eventSource.on(
        event_types.CHAT_CHANGED,
        () => {
            setTimeout(() => {
                decorateSendForm();
                updatePlaceholder();
            }, 100);
        },
    );

    eventSource.on(
        event_types.CHARACTER_MESSAGE_RENDERED,
        () => {
            updatePlaceholder();
        },
    );

    const observer = new MutationObserver(() => {
        decorateSendForm();
    });

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true,
        },
    );
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        init,
        { once: true },
    );
} else {
    init();
}