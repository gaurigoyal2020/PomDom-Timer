class PomodoroUI {
    constructor() {
        this.elements = this.cacheElements();
        this.port = null;
        this.tapCount = 0;
        this.tapTimeout = null;
        this.currentTimerData = null;
        this.init();
    }
    
    // Cache DOM elements for efficient access
    cacheElements() {
        return {
            focus: document.getElementById("focus"),
            shortBreak: document.getElementById("s_break"),
            longBreak: document.getElementById("l_break"),
            timer: document.getElementById("timer_clk"),
            start: document.getElementById("start"),
            pause: document.getElementById("pause"),
            reset: document.getElementById("reset")
        };
    }
    
    init() {
        this.connectToBackground();
        this.bindEvents();
        this.requestInitialState();
    }
    
    // Establish persistent connection with background script
    connectToBackground() {
        this.port = chrome.runtime.connect({ name: 'popup' });
        this.port.onMessage.addListener((msg) => {
            if (msg.type === 'timerUpdate') {
                this.updateUI(msg.data);
            }
        });
        
        // Handle disconnection
        this.port.onDisconnect.addListener(() => {
            console.log('Background connection lost');
        });
    }
    
    // Get initial timer state
    requestInitialState() {
        chrome.runtime.sendMessage({ action: "getTime" }, (response) => {
            if (response) {
                this.updateUI(response);
            }
        });
    }
    
    // Efficient UI updates with batched DOM operations
    updateUI(timerData) {
        this.currentTimerData = timerData;
        
        // Batch DOM updates using requestAnimationFrame
        requestAnimationFrame(() => {
            // Update timer display
            this.elements.timer.textContent = 
                `${this.appendZero(timerData.mins)}:${this.appendZero(timerData.secs)}`;
            
            // Update active button styling
            this.updateActiveButton(timerData.activeType);
            
            // Update control button states
            if (timerData.running) {
                this.showRunningState();
            } else {
                this.showPausedState();
            }
        });
    }
    
    // Update active timer type button
    updateActiveButton(activeType) {
        // Remove active class from all buttons
        this.elements.focus.classList.remove("btn-focus");
        this.elements.shortBreak.classList.remove("btn-focus");
        this.elements.longBreak.classList.remove("btn-focus");
        
        // Add active class to current button
        switch(activeType) {
            case "short":
                this.elements.shortBreak.classList.add("btn-focus");
                break;
            case "long":
                this.elements.longBreak.classList.add("btn-focus");
                break;
            default:
                this.elements.focus.classList.add("btn-focus");
        }
    }
    
    // Show running state UI
    showRunningState() {
        this.elements.start.classList.add("hide");
        this.elements.start.classList.remove("show");
        this.elements.pause.classList.add("show");
        this.elements.pause.classList.remove("hide");
        this.elements.reset.classList.add("show");
        this.elements.reset.classList.remove("hide");
    }
    
    // Show paused state UI
    showPausedState() {
        this.elements.start.classList.remove("hide");
        this.elements.start.classList.add("show");
        this.elements.pause.classList.remove("show");
        this.elements.pause.classList.add("hide");
        this.elements.reset.classList.remove("show");
        this.elements.reset.classList.add("hide");
    }
    
    // Ensure timer always has 2 digits
    appendZero(value) {
        return value < 10 ? `0${value}` : value;
    }
    
    // Efficient event binding using event delegation
    bindEvents() {
        // Control buttons
        this.elements.start.addEventListener("click", () => {
            this.sendMessage({ action: "start" });
        });
        
        this.elements.pause.addEventListener("click", () => {
            this.sendMessage({ action: "pause" });
        });
        
        this.elements.reset.addEventListener("click", () => {
            this.sendMessage({ action: "reset" });
        });
        
        // Timer type buttons
        this.elements.focus.addEventListener("click", () => {
            this.sendMessage({ action: "setType", type: "focus" });
        });
        
        this.elements.shortBreak.addEventListener("click", () => {
            this.sendMessage({ action: "setType", type: "short" });
        });
        
        this.elements.longBreak.addEventListener("click", () => {
            this.sendMessage({ action: "setType", type: "long" });
        });
        
        // Double-tap for custom time
        this.elements.timer.addEventListener('click', () => {
            this.handleTimerTap();
        });
    }
    
    // Handle double-tap on timer for custom time
    handleTimerTap() {
        this.tapCount++;
        
        if (this.tapCount === 1) {
            this.tapTimeout = setTimeout(() => {
                this.tapCount = 0;
            }, 300);
        } else if (this.tapCount === 2) {
            clearTimeout(this.tapTimeout);
            this.tapCount = 0;
            
            // Only allow custom time when timer is not running
            if (this.currentTimerData && !this.currentTimerData.running) {
                this.showCustomTimeInput();
            }
        }
    }
    
    // Show custom time input modal
    showCustomTimeInput() {
        const modal = document.createElement('div');
        modal.id = 'custom-time-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: bisque;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid rgb(181, 117, 43);
                color: rgb(81, 33, 3);
                font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
            ">
                <h3 style="margin-top: 0;">Set Custom Time</h3>
                <div class="time-inputs" style="margin: 15px 0;">
                    <div class="input-group" style="margin: 10px 0;">
                        <label for="custom-mins" style="display: inline-block; width: 70px;">Minutes:</label>
                        <input type="number" id="custom-mins" min="0" max="180" value="25" style="
                            width: 60px;
                            padding: 5px;
                            border: 1px solid rgb(181, 117, 43);
                            border-radius: 3px;
                        ">
                    </div>
                    <div class="input-group" style="margin: 10px 0;">
                        <label for="custom-secs" style="display: inline-block; width: 70px;">Seconds:</label>
                        <input type="number" id="custom-secs" min="0" max="59" value="0" style="
                            width: 60px;
                            padding: 5px;
                            border: 1px solid rgb(181, 117, 43);
                            border-radius: 3px;
                        ">
                    </div>
                </div>
                <div class="modal-buttons" style="text-align: center; margin-top: 15px;">
                    <button id="set-custom-time" style="
                        margin: 0 5px;
                        padding: 8px 15px;
                        background-color: bisque;
                        border: 1px solid rgb(181, 117, 43);
                        border-radius: 3px;
                        color: rgb(81, 33, 3);
                        cursor: pointer;
                        font-size: 14px;
                    ">Set Time</button>
                    <button id="cancel-custom" style="
                        margin: 0 5px;
                        padding: 8px 15px;
                        background-color: beige;
                        border: 1px solid rgb(181, 117, 43);
                        border-radius: 3px;
                        color: rgb(81, 33, 3);
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                </div>
                <div class="time-range" style="text-align: center; margin-top: 10px; font-size: 12px; color: rgb(100, 60, 20);">
                    Range: 1 second to 3 hours
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on minutes input
        document.getElementById('custom-mins').focus();
        
        // Handle set button
        document.getElementById('set-custom-time').addEventListener('click', () => {
            const mins = parseInt(document.getElementById('custom-mins').value) || 0;
            const secs = parseInt(document.getElementById('custom-secs').value) || 0;
            
            if (this.validateTime(mins, secs)) {
                this.sendMessage({ 
                    action: "setCustomTime", 
                    minutes: mins, 
                    seconds: secs, 
                    type: this.currentTimerData.activeType
                });
                document.body.removeChild(modal);
            } else {
                alert('Please enter a time between 1 second and 3 hours');
            }
        });
        
        // Handle cancel button
        document.getElementById('cancel-custom').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Handle Enter key
        modal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('set-custom-time').click();
            }
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Validate custom time input
    validateTime(mins, secs) {
        const totalSeconds = mins * 60 + secs;
        return totalSeconds >= 1 && totalSeconds <= 10800; // 1 second to 3 hours
    }
    
    // Send message to background script
    sendMessage(message) {
        chrome.runtime.sendMessage(message).catch(error => {
            console.error('Error sending message:', error);
        });
    }
    
    // Cleanup on popup close
    destroy() {
        if (this.port) {
            this.port.disconnect();
        }
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }
    }
}

// Initialize when DOM is ready
let pomodoroUI;
document.addEventListener('DOMContentLoaded', () => {
    pomodoroUI = new PomodoroUI();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pomodoroUI) {
        pomodoroUI.destroy();
    }
});