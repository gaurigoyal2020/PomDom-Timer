let focus = document.getElementById("focus");
let short_br = document.getElementById("s_break");
let long_br = document.getElementById("l_break");
let timer = document.getElementById("timer_clk");
let start = document.getElementById("start");
let pause = document.getElementById("pause");
let reset = document.getElementById("reset");
let buttons = document.querySelector(".work_btns");

// Initialize timer on popup load
document.addEventListener('DOMContentLoaded', initializeTimer);

async function initializeTimer() {
    try {
        // Get current timer state from background script
        chrome.runtime.sendMessage({ action: "getTime" }, (response) => {
            if (response) {
                updateUI(response);
                // Start periodic updates to keep UI in sync
                setInterval(updateTimerFromBackground, 1000);
            }
        });
    } catch (error) {
        console.error('Error initializing timer:', error);
    }
}

// Update UI based on timer data from background
function updateUI(timerData) {
    // Update timer display
    timer.textContent = `${appendZero(timerData.mins)}:${appendZero(timerData.secs)}`;
    
    // Update active button styling
    updateActiveButton(timerData.activeType);
    
    // Update button states
    if (timerData.running) {
        showRunningState();
    } else {
        showPausedState();
    }
}

// Get latest timer state from background and update UI
function updateTimerFromBackground() {
    chrome.runtime.sendMessage({ action: "getTime" }, (response) => {
        if (response) {
            updateUI(response);
        }
    });
}

// Update active button styling
function updateActiveButton(activeType) {
    // Remove active class from all buttons
    focus.classList.remove("btn-focus");
    short_br.classList.remove("btn-focus");
    long_br.classList.remove("btn-focus");
    
    // Add active class to current button
    switch(activeType) {
        case "short":
            short_br.classList.add("btn-focus");
            break;
        case "long":
            long_br.classList.add("btn-focus");
            break;
        default:
            focus.classList.add("btn-focus");
    }
}

// Show running state UI
function showRunningState() {
    pause.classList.add("show");
    reset.classList.add("show");
    start.classList.add("hide");
    start.classList.remove("show");
    pause.classList.remove("hide");
    reset.classList.remove("hide");
}

// Show paused state UI
function showPausedState() {
    start.classList.remove("hide");
    start.classList.add("show");
    pause.classList.remove("show");
    pause.classList.add("hide");
    reset.classList.remove("show");
    reset.classList.add("hide");
}

//making sure that timer always has 2 digits
//If value is less than 10, we append 0 or we return og value
const appendZero = (value) => {
    value = value < 10 ? `0${value}` : value;
    return value;
}

// Show custom time input modal
function showCustomTimeInput() {
    const modal = document.createElement('div');
    modal.id = 'custom-time-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Set Custom Time</h3>
            <div class="time-inputs">
                <div class="input-group">
                    <label for="custom-mins">Minutes:</label>
                    <input type="number" id="custom-mins" min="0" max="180" value="25">
                </div>
                <div class="input-group">
                    <label for="custom-secs">Seconds:</label>
                    <input type="number" id="custom-secs" min="0" max="59" value="0">
                </div>
            </div>
            <div class="modal-buttons">
                <button id="set-custom-time">Set Time</button>
                <button id="cancel-custom">Cancel</button>
            </div>
            <div class="time-range">Range: 1 second to 3 hours</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on minutes input
    document.getElementById('custom-mins').focus();
    
    // Handle set button
    document.getElementById('set-custom-time').addEventListener('click', async () => {
        const mins = parseInt(document.getElementById('custom-mins').value) || 0;
        const secs = parseInt(document.getElementById('custom-secs').value) || 0;
        
        if (validateTime(mins, secs)) {
            try {
                await chrome.runtime.sendMessage({ 
                    action: "setCustomTime", 
                    minutes: mins, 
                    seconds: secs, 
                    type: active 
                });
                
                updateTimerDisplay(mins, secs);
                document.body.removeChild(modal);
            } catch (error) {
                console.error('Error setting custom time:', error);
            }
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
}

// Double-tap detection for timer
let tapCount = 0;
let tapTimeout;

timer.addEventListener('click', () => {
    tapCount++;
    
    if (tapCount === 1) {
        tapTimeout = setTimeout(() => {
            tapCount = 0;
        }, 300);
    } else if (tapCount === 2) {
        clearTimeout(tapTimeout);
        tapCount = 0;
        
        if (!isRunning) {
            showCustomTimeInput();
        }
    }
});

// Event listeners for buttons
start.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "start" });
});

pause.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "pause" });
});

reset.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "reset" });
});

focus.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "setType", type: "focus" });
});

short_br.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "setType", type: "short" });
});

long_br.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "setType", type: "long" });
});