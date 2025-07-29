let timerState = {
    mins: 25,
    secs: 0,
    running: false,
    activeType: 'focus',
    endTime: null,
    startTime: null,
    totalSeconds: null // for tracking alarm updates
};

// Connected popup ports for real-time updates
let popupPorts = new Set();

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ timerData: timerState });
});

// Load timer state from storage on startup
chrome.storage.local.get("timerData", (data) => {
    if (data.timerData && typeof data.timerData === 'object' && 'mins' in data.timerData) {
        timerState = { ...timerState, ...data.timerData };

        if (timerState.running && timerState.endTime) {
            const remaining = Math.max(0, timerState.endTime - Date.now());
            if (remaining > 0) {
                timerState.mins = Math.floor(remaining / 60000);
                timerState.secs = Math.floor((remaining % 60000) / 1000);
                chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 });
            } else {
                finishTimer();
            }
        }
    }
});

function saveState() {
    chrome.storage.local.set({ timerData: timerState });
}

function broadcastUpdate() {
    const message = { type: 'timerUpdate', data: { ...timerState } };
    popupPorts.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            popupPorts.delete(port);
        }
    });
}

// ✅ Clean, unified notification system
function showCompletionNotification() {
    const message = "🐾 Time's up! Your inner cat says it's time to stretch, yawn, and maybe chase a dream.";

    chrome.notifications.create('pomodoroComplete', {
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'Meow Alert!',
        message: message,
        priority: 1,
        requireInteraction: false
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error('Notification error:', chrome.runtime.lastError.message);
            return;
        }

        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 5000);
    });
}

function startTimer() {
    if (timerState.running) return;

    timerState.running = true;
    timerState.startTime = Date.now();
    timerState.endTime = Date.now() + (timerState.mins * 60 + timerState.secs) * 1000;

    chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 });
    saveState();
    broadcastUpdate();
}

function stopTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');

    if (timerState.endTime) {
        const remaining = Math.max(0, timerState.endTime - Date.now());
        timerState.mins = Math.floor(remaining / 60000);
        timerState.secs = Math.floor((remaining % 60000) / 1000);
    }

    saveState();
    broadcastUpdate();
}

function resetTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');

    switch (timerState.activeType) {
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

function setTimerType(type) {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');
    timerState.activeType = type;

    switch (type) {
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

function setCustomTime(minutes, seconds, type) {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');

    if (type) timerState.activeType = type;

    timerState.mins = minutes;
    timerState.secs = seconds;
    timerState.endTime = null;
    timerState.startTime = null;

    saveState();
    broadcastUpdate();
}

function finishTimer() {
    timerState.running = false;
    chrome.alarms.clear('pomodoroTimer');

    showCompletionNotification();

    switch (timerState.activeType) {
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

// ⏰ Timer tick handler
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroTimer' && timerState.running) {
        const remaining = Math.max(0, timerState.endTime - Date.now());

        if (remaining <= 0) {
            finishTimer();
            return;
        }

        const totalSecondsRemaining = Math.ceil(remaining / 1000);

        if (totalSecondsRemaining !== timerState.totalSeconds) {
            timerState.totalSeconds = totalSecondsRemaining;
            timerState.mins = Math.floor(totalSecondsRemaining / 60);
            timerState.secs = totalSecondsRemaining % 60;
            broadcastUpdate();
        }

        chrome.alarms.create('pomodoroTimer', { delayInMinutes: 0.0167 });
    }
});

// 🔌 Handle popup connection
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        popupPorts.add(port);
        port.postMessage({ type: 'timerUpdate', data: { ...timerState } });

        port.onDisconnect.addListener(() => {
            popupPorts.delete(port);
        });
    }
});

// 🖱 Notification click handler
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'pomodoroComplete') {
        chrome.action.openPopup().catch(() => {
            console.log('Could not open popup');
        });
        chrome.notifications.clear(notificationId);
    }
});

// 📬 Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
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
    return true;
});
