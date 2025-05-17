
// The MIT License (MIT)

// Copyright (c) 2025 sbosvk.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

class Modal {
    constructor() {
        this.modals = [];
    }

    create({ position = "center", type = "info", overlay = false, title = "", message = "", autoClose = null } = {}) {
        const modalBox = document.createElement("div");
        modalBox.classList.add("modal-box", type, position);

        const closeButton = document.createElement("span");
        closeButton.classList.add("modal-close");
        closeButton.innerHTML = "&times;";
        closeButton.onclick = () => this.close(modalBox);

        const modalTitle = document.createElement("h3");
        modalTitle.classList.add("modal-title");
        modalTitle.innerText = title;

        const modalMessage = document.createElement("p");
        modalMessage.classList.add("modal-message");
        modalMessage.innerText = message;

        modalBox.appendChild(closeButton);
        modalBox.appendChild(modalTitle);
        modalBox.appendChild(modalMessage);
        
        if (overlay) {
            const modalWrapper = document.createElement("div");
            modalWrapper.classList.add("modal-wrapper", "overlay");
            modalWrapper.appendChild(modalBox);
            modalWrapper.onclick = (e) => {
                if (e.target === modalWrapper) this.close(modalBox);
            };
            document.body.appendChild(modalWrapper);
        } else {
            document.body.appendChild(modalBox);
        }
        
        setTimeout(() => modalBox.classList.add("active"), 10);
        this.modals.push(modalBox);

        if (autoClose && !isNaN(parseInt(autoClose))) {
            setTimeout(() => this.close(modalBox), parseInt(autoClose));
        }
    }

    close(modal) {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    }
}

export default Modal;