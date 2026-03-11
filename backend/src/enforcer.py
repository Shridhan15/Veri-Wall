import os
import shutil

DRAFT_DIR = "policies/draft/"
ACTIVE_DIR = "policies/active/"

def apply_policy(filename):
    os.makedirs(ACTIVE_DIR, exist_ok=True)
    
    draft_path = os.path.join(DRAFT_DIR, filename)
    active_path = os.path.join(ACTIVE_DIR, "active_policy.json")
    history_path = os.path.join(ACTIVE_DIR, filename)
    
    if not os.path.exists(draft_path):
        return False, "Draft policy not found."
        
    try: 
        shutil.move(draft_path, history_path)
         
        shutil.copy(history_path, active_path)
        
        return True, "Policy successfully enforced and moved to active state."
    except Exception as e:
        return False, str(e)