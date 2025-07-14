let timerData = {
    mins: 25,
    secs: 0,
    running: false,
    intervalId: null,
    activeType: 'focus'
};

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ timerData });
});

// Function to start the timer
function startTimer() {
    chrome.storage.local.get("timerData", (data) => {
        let t = data.timerData;

        if (t.running) return; // Avoid multiple intervals
        t.running = true;

        t.intervalId = setInterval(() => {
            chrome.storage.local.get("timerData", (updatedData) => {
                let timer = updatedData.timerData;

                if (!timer.running) {
                    clearInterval(timer.intervalId);
                    return;
                }

                if (timer.secs === 0) {
                    if (timer.mins === 0) {
                        clearInterval(timer.intervalId);
                        timer.running = false;
                        
                        // Show notification when timer finishes
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icon48.png', // Make sure you have this icon
                            title: 'Pomodoro Timer',
                            message: 'TIME\'S UP!'
                        });
                        
                        // Reset timer based on active type
                        switch(timer.activeType) {
                            case "long": 
                                timer.mins = 15;
                                break;
                            case "short": 
                                timer.mins = 5;
                                break;
                            default: 
                                timer.mins = 25;
                        }
                        timer.secs = 0;
                        
                    } else {
                        timer.mins -= 1;
                        timer.secs = 59;
                    }
                } else {
                    timer.secs -= 1;
                }

                chrome.storage.local.set({ timerData: timer });
            });
        }, 1000);

        chrome.storage.local.set({ timerData: t });
    });
}

// Stop the timer
function stopTimer() {
    chrome.storage.local.get("timerData", (data) => {
        let t = data.timerData;
        t.running = false;
        clearInterval(t.intervalId);
        chrome.storage.local.set({ timerData: t });
    });
}

// Reset the timer
function resetTimer() {
    chrome.storage.local.get("timerData", (data) => {
        let t = data.timerData;
        t.running = false;
        clearInterval(t.intervalId);
        
        // Reset to appropriate time based on active type
        switch(t.activeType) {
            case "long": 
                t.mins = 15;
                break;
            case "short": 
                t.mins = 5;
                break;
            default: 
                t.mins = 25;
        }
        t.secs = 0;
        
        chrome.storage.local.set({ timerData: t });
    });
}

// Set timer type and reset
function setTimerType(type) {
    chrome.storage.local.get("timerData", (data) => {
        let t = data.timerData;
        t.running = false;
        clearInterval(t.intervalId);
        t.activeType = type;
        
        switch(type) {
            case "long": 
                t.mins = 15;
                break;
            case "short": 
                t.mins = 5;
                break;
            default: 
                t.mins = 25;
        }
        t.secs = 0;
        
        chrome.storage.local.set({ timerData: t });
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        startTimer();
    } else if (message.action === "pause") {
        stopTimer();
    } else if (message.action === "reset") {
        resetTimer();
    } else if (message.action === "setType") {
        setTimerType(message.type);
    } else if (message.action === "getTime") {
        chrome.storage.local.get("timerData", (data) => {
            sendResponse(data.timerData);
        });
        return true; // Keeps the message channel open
    } else if (message.action === "setCustomTime") {
        resetTimer(message.minutes, message.seconds, message.type);
        sendResponse({ success: true });
    }
});