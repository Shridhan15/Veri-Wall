import json
import os
from datetime import datetime, timezone

LOG_FILE = "logs/system_events.json"

def init_logger():
    os.makedirs("logs", exist_ok=True)
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w") as f:
            json.dump([], f)

# NEW: Added payload=None
def log_event(action, user, details, severity="info", payload=None):
    init_logger()
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "user": user,
        "details": details,
        "severity": severity,
        "payload": payload # Store the snapshot!
    }
    
    with open(LOG_FILE, "r+") as f:
        try:
            logs = json.load(f)
        except json.JSONDecodeError:
            logs = []
            
        logs.insert(0, event)
        f.seek(0)
        json.dump(logs, f, indent=4)
        f.truncate()