let timerState = {
    mins: 25,
    secs: 0,
    running: false,
    activeType: 'focus',
    endTime: null,
    startTime: null
};

// Connected popup ports for real-time updates
let popupPorts = new Set();

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ timerData: timerState });
});

// Load timer state from storage on startup
chrome.storage.local.get("timerData", (data) => {
    if (data.timerData) {
        timerState = { ...timerState, ...data.timerData };
        
        // If timer was running, recalculate remaining time
        if (timerState.running && timerState.endTime) {
            const remaining = Math.max(0, timerState.endTime - Date.now());
            if (remaining > 0) {
                timerState.mins = Math.floor(remaining / 60000);
                timerState.secs = Math.floor((remaining % 60000) / 1000);
                chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 });
            } else {
                // Timer should have finished while extension was inactive
                finishTimer();
            }
        }
    }
});

// Save state to storage (only when necessary)
function saveState() {
    chrome.storage.local.set({ timerData: timerState });
}

// Broadcast updates to all connected popups
function broadcastUpdate() {
    const message = { type: 'timerUpdate', data: { ...timerState } };
    popupPorts.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            // Port disconnected, remove it
            popupPorts.delete(port);
        }
    });
}

// Start the timer with Chrome Alarms
function startTimer() {
    if (timerState.running) return;
    
    timerState.running = true;
    timerState.startTime = Date.now();
    timerState.endTime = Date.now() + (timerState.mins * 60 + timerState.secs) * 1000;
    
    chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 }); // ~1 second
    saveState();
    broadcastUpdate();
}

// Stop the timer
function stopTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    
    // Recalculate remaining time
    if (timerState.endTime) {
        const remaining = Math.max(0, timerState.endTime - Date.now());
        timerState.mins = Math.floor(remaining / 60000);
        timerState.secs = Math.floor((remaining % 60000) / 1000);
    }
    
    saveState();
    broadcastUpdate();
}

// Reset timer to default time for current type
function resetTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    
    // Reset to appropriate time based on active type
    switch(timerState.activeType) {
        case "long": 
            timerState.mins = 15;
            break;
        case "short": 
            timerState.mins = 5;
            break;
        default: 
            timerState.mins = 25;
    }
    timerState.secs = 0;
    timerState.endTime = null;
    timerState.startTime = null;
    
    saveState();
    broadcastUpdate();
}

// Set timer type and reset
function setTimerType(type) {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    timerState.activeType = type;
    
    switch(type) {
        case "long": 
            timerState.mins = 15;
            break;
        case "short": 
            timerState.mins = 5;
            break;
        default: 
            timerState.mins = 25;
    }
    timerState.secs = 0;
    timerState.endTime = null;
    timerState.startTime = null;
    
    saveState();
    broadcastUpdate();
}

// Set custom time
function setCustomTime(minutes, seconds, type) {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    
    if (type) {
        timerState.activeType = type;
    }
    
    timerState.mins = minutes;
    timerState.secs = seconds;
    timerState.endTime = null;
    timerState.startTime = null;
    
    saveState();
    broadcastUpdate();
}

// Handle timer completion (notification system removed)
function finishTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    
    // Reset timer based on active type
    switch(timerState.activeType) {
        case "long": 
            timerState.mins = 15;
            break;
        case "short": 
            timerState.mins = 5;
            break;
        default: 
            timerState.mins = 25;
    }
    timerState.secs = 0;
    timerState.endTime = null;
    timerState.startTime = null;
    
    saveState();
    broadcastUpdate();
}

// Efficient timer update using Chrome Alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroTimer' && timerState.running) {
        const remaining = Math.max(0, timerState.endTime - Date.now());
        
        if (remaining <= 0) {
            finishTimer();
            return;
        }
        
        // Calculate remaining seconds more accurately
        const totalSecondsRemaining = Math.ceil(remaining / 1000);
        
        // Only update if the total seconds actually changed
        if (totalSecondsRemaining !== timerState.totalSeconds) {
            timerState.totalSeconds = totalSecondsRemaining;
            timerState.mins = Math.floor(totalSecondsRemaining / 60);
            timerState.secs = totalSecondsRemaining % 60;
            broadcastUpdate();
        }
        
        // Continue alarm
        chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 });
    }
});

// Handle popup connections for real-time updates
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        popupPorts.add(port);
        
        // Send initial state
        port.postMessage({ type: 'timerUpdate', data: { ...timerState } });
        
        port.onDisconnect.addListener(() => {
            popupPorts.delete(port);
        });
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch(message.action) {
        case "start":
            startTimer();
            break;
        case "pause":
            stopTimer();
            break;
        case "reset":
            resetTimer();
            break;
        case "setType":
            setTimerType(message.type);
            break;
        case "getTime":
            sendResponse({ ...timerState });
            break;
        case "setCustomTime":
            setCustomTime(message.minutes, message.seconds, message.type);
            sendResponse({ success: true });
            break;
    }
    
    return true; // Keep message channel open
});