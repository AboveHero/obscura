import { decryptData, encryptData } from "./crypto.js";
import Modal from "./modals.js";

const modal = new Modal();

/**
 * Easy selector
 */
/**
 * Extended "select" function.
 * If "target" is a string, treat as a selector;
 * if "target" is an element, return it directly.
 */
const el = (target, all = false) => {
    if (isEl(target)) {
        return target;
    }

    if (typeof target === "string") {
        target = target.trim();
        if (!target) return null;
        if (all) {
            return [...document.querySelectorAll(target)];
        } else {
            return document.querySelector(target);
        }
    }

    // If neither string nor element, fail gracefully
    console.error("el(): Invalid target:", target);
    return null;
};

/**
 * Easy event listener
 * Extended "on" prototype patch
 */

(function () {
    if (!Document.prototype.on) {
        Document.prototype.on = function (type, listener, options) {
            this.addEventListener(type, listener, options);
        };
    }

    if (!Element.prototype.on) {
        Element.prototype.on = function (type, listener, options) {
            this.addEventListener(type, listener, options);
        };
    }

    if (!Window.prototype.on) {
        Window.prototype.on = function (type, listener, options) {
            this.addEventListener(type, listener, options);
        };
    }
})();

/**
 * Easy on scroll event listener
 */
const onscroll = (DOM, listener) => {
    DOM.addEventListener("scroll", listener);
};

/**
 * Check if target is an Element
 */
const isEl = (obj) => {
    return obj instanceof Element || obj instanceof HTMLDocument;
};

/**
 * Check if element has a class
 */
const hasClass = (el, cls) => {
    return !!el.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
};

/**
 * Drop shoulders
 */
const dropShoulders = (a, b) => {
    if (a && b === undefined) {
        let header = el(".fixed-top.header", false);
        header.nextElementSibling.style.marginTop = `${header.offsetHeight}px`;
    }

    if (a === undefined && b === undefined) {
        let pageHeaders = el(".fixed-top.header", true);
        pageHeaders.forEach((header) => {
            header.nextElementSibling.style.marginTop = `${header.offsetHeight}px`;
        });
    }

    if (a && b) {
        let head = el(a, false);
        let belly = el(b, false);
        if (!isEl(a) || !isEl(b)) return false;

        b.style.marginTop = a.offsetHeight + "px";
    }
};

/**
 * MAIN
 */

/**
 * UTILITIES
 */

const copyToClipboard = (element, notification) => {
    let text = el(element).textContent.trim();
    if (!text) return;

    navigator.clipboard
        .writeText(text)
        .then(() => {
            el(notification).classList.add("show");
            setTimeout(() => {
                el(notification).classList.remove("show");
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy text: ", err);
        });
};

let selectables = el(".selectable", true);

selectables.forEach((element) => {
    element.on("click", function () {
        let range = document.createRange();
        range.selectNodeContents(this);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    });
});

/**
 * SECRETS
 */

async function createSecret() {
    let results = el("#result_container");
    let inputs = el("#input_container");

    let secret = el("#secret_input").value;
    if (secret === "") {
        // Display error modal
        modal.create({
            position: "right-bottom",
            type: "warning",
            title: "Secret is empty",
            message: "Please enter a message before creating a secret.",
            autoClose: 4000
        });
        return;
    }
    let pwd = el("#pwd_input").value || null;

    try {
        // Hide inputs and show spinner
        inputs.style.display = "none";
        el("#spinner").style.display = "flex";

        // Encrypt secret in browser
        const { encryptedObj, generatedPassword } = await encryptData(secret, pwd);

        // Push secret to object storage
        let res = await fetch("/api/secret", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ encryptedObj }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            // Display error modal
            modal.create({
                position: "right-bottom",
                type: "alert",
                title: "Error creating secret",
                message: errorText || "Failed to create secret.",
            });
            el("#spinner").style.display = "none";
            return;
        }

        let data = await res.json();

        if (data.error) {
            // Display error modal
            modal.create({
                position: "right-bottom",
                type: "alert",
                title: "Error creating secret",
                message: data.error,
            });
        }

        // Display result container
        results.style.display = "block";

        let secret_link = data.link;
        if (generatedPassword) {
            // If password was auto-generated, append it to the link
            secret_link += `&key=${encodeURIComponent(generatedPassword)}`;
            // Also append it to the secret key field
        }

        // Display link
        el("#link_text").textContent = secret_link;

        modal.create({
            position: "right-top",
            type: "success",
            title: "Secret created",
            message: "Your secret has been created successfully.",
            autoClose: 2000
        });
        // Hide spinner
        el("#spinner").style.display = "none";
    } catch (err) {
        console.error(err);
        el("#spinner").style.display = "none";
        // Display error modal
        modal.create({
            position: "right-bottom",
            type: "alert",
            title: "Error creating secret",
        });
        return;
    }
}

document.on("DOMContentLoaded", () => {
    let linkBox = el("#linkContainer");

    if (linkBox) {
        linkBox.on("click", () => {
            copyToClipboard("#link_text", "#linkCopied");
        });
    }

    let secretBox = el("#secret_container");

    if (secretBox) {
        secretBox.on("click", () => {
            copyToClipboard("#secretText", "#secretCopied");
        });
    }

    // The "Create Secret" button
    let createSecretButton = el("button#create_secret");
    if (createSecretButton) {
        createSecretButton.on("click", createSecret);
    }
});

//
// Secret Page
//
// Function to display burn notice when secret is consumed
let displayBurnNotice = (success) => {
    el("#decrypt_container").style.display = "none";
    if (success) {
        el("#burnNotice").textContent = "⚠️ This secret was retrieved and is now burned.";
    } else {
        el("#burnNotice").textContent = "⚠️ No secret with that ID exists.";
    }
    el("#burnNotice").style.display = "block";
    el("#spinner").style.display = "none";
};

let encryptedObj = null;

async function fetchCipherText() {
    const urlParams = new URLSearchParams(window.location.search);
    const secretId = urlParams.get("id");
    const secretKey = urlParams.get("key");

    if (!secretId) {
        el("#spinner").style.display = "none";
        if (isEl("#manual_input_container")) {
            el("#manual_input_container").style.display = "block";
        }
        return;
    }

    try {
        const res = await fetch(`/api/secret/${secretId}`);
        const data = await res.json();

        if (data.error) {
            displayBurnNotice();
            console.error("❌ Error fetching secret:", data.error);
            modal.create({
                position: "right-bottom",
                type: "alert",
                title: "Error fetching secret",
                message: data.error,
                autoClose: 6000,
            });
            return;
        }

        encryptedObj = data.encryptedObj;

        if (data.metadata && data.metadata["x-creation-timestamp"]) {
            el("#secret_metadata").innerHTML = `<h6>🕒 ${data.metadata["x-creation-timestamp"]}</h6>`;
        }

        el("#spinner").style.display = "none";

        if (secretKey) {
            // If key is included in URL, auto-decrypt
            decryptAndShow(secretId, secretKey);
            return;
        }

        return (el("#decrypt_container").style.display = "block");
    } catch (err) {
        console.error("❌ Error fetching secret:", err);
        modal.create({
            position: "right-bottom",
            type: "alert",
            title: "Error fetching secret",
        });
    }
}

async function decryptAndShow(secretId, secretKey) {
    if (!secretKey) {
        secretKey = el("#pwd_input").value.trim();
    }

    if (!secretKey || !encryptedObj) {
        modal.create({
            position: "right-bottom",
            type: "alert",
            title: "No password provided or secret is missing.",
        });
        return;
    }

    try {
        el("#lockIcon").classList.add("unlock");
        el("#errorMsg").style.display = "none";
        el("#decryptButton").disabled = true;

        setTimeout(async () => {
            // 🔓 Decrypt in the browser
            let plaintext = await decryptData(encryptedObj, secretKey);
            displaySecret(plaintext);

            // 🔥 Now tell the backend to delete the secret (only if decryption succeeded)
            await fetch(`/api/secret/${secretId}`, {
                method: "DELETE",
                headers: { Authorization: "Obscura-Delete" }, // Extra header for security
            });

            displayBurnNotice("success");
        }, 600);
    } catch (err) {
        console.error("❌ Decryption failed:", err);
        el("#pwd_input").classList.add("shake");
        el("#errorMsg").style.display = "block";

        setTimeout(() => {
            el("#pwd_input").classList.remove("shake");
        }, 400);
    } finally {
        el("#decryptButton").disabled = false;
    }
}

// Function to display decrypted text
let displaySecret = (secret) => {
    el("#secretText").innerText = secret;
    el("#secret_container").style.display = "block";
    el("#decrypt_container").style.display = "none";
    el("#secret_container").classList.add("fade-in");
};

let manualRetrieval = () => {
    let secretId = el("#secret_id").value;
    if (!secretId) {
        modal.create({
            position: "right-bottom",
            type: "warning",
            title: "Please enter a valid secret ID",
            message: data.error,
        });
        return;
    }
    window.location.href = `/secret?id=${secretId}`;
};

// Event Listeners
document.on("DOMContentLoaded", () => {
    el("#retrieveButton")?.on("click", manualRetrieval);
    // el("#decryptButton")?.on("click", () => decryptAndShow());
    el("#decryptButton")?.on("click", () => {
        const secretId = new URLSearchParams(window.location.search).get("id");
        decryptAndShow(secretId);
    });
    el("#main_nav button", true).forEach((button) => {
        button.on("click", function () {
            let target = this.getAttribute("href");
            if (!target) return;
            document.location.href = target;
        });
    });
});

// Fetch secret on page load
fetchCipherText();
