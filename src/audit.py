import json
from datetime import datetime

LOG_FILE = "logs/audit_log.json"

def log_event(entry):

    try:
        with open(LOG_FILE, "r") as f:
            logs = json.load(f)
    except:
        logs = []

    logs.append(entry)

    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=4)


def record(policy_version, policy_hash, signers, result):

    entry = {
        "timestamp": str(datetime.now()),
        "policy_version": policy_version,
        "policy_hash": policy_hash,
        "signers": signers,
        "result": result
    }

    log_event(entry)