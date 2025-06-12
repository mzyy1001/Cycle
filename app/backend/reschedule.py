import sys
import json
import os
from openai import OpenAI
from pydantic import BaseModel
from datetime import datetime

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
base_dir = os.path.dirname(os.path.abspath(__file__))

class TaskItem(BaseModel):
    id: int
    timestamp: str

class ReschedulingResult(BaseModel):
    items: list[TaskItem]

def simplify_time_range(start_iso: str, end_iso: str) -> str:
    start = datetime.fromisoformat(start_iso)
    end = datetime.fromisoformat(end_iso)
    return f"{start.strftime('%H:%M')} - {end.strftime('%H:%M')}"

def call_gpt_rescheduler(tasks, now_iso, blocked):
    blocked_str = "\n".join(
        f"- {simplify_time_range(b['start'], b['end'])}" for b in blocked
    )
    prompt = f"""
You are a smart personal task scheduler.

The current time is: {now_iso}, please allocate tasks for today after this time.

Blocked time ranges to avoid:
    {blocked_str}

Here is a list of today's tasks in JSON format. Each task contains:
- id: task ID
- task: task name
- mood: user's mood (e.g., "Focused", "Tired", "Creative")
- timestamp: current timestamp (you may ignore this)
- length: task length in minutes

Your job is to reschedule all tasks **within today**, between **09:00 and 18:00**, satisfying the following rules:

1. The tasks must not overlap.
2. Each task should be scheduled for its specified `length` duration.
3. Tasks with mood "Focused" should be scheduled earlier in the day.
4. Tasks with mood "Tired" should be scheduled later in the day.
5. Try to place short breaks (5-10 minutes) between tasks if time allows.
6. Keep all tasks within the time range of {now_iso} to 24:00.
Here is the task list:

{json.dumps(tasks, indent=2)}

Note that the timestamp is a new ISO 8601 timestamp (e.g., "2025-06-11T09:30:00")
"""

    response = client.responses.parse(
        model="gpt-4.1-nano",
        input=[{ "role": "user", "content": prompt }],
        temperature=0.2,
        text_format=ReschedulingResult,
    )

    content = response.output_parsed.items
    content = list(map(lambda x: {"id": x.id, "timestamp": x.timestamp }, content))
    # with open(os.path.join(base_dir, "debug_response.txt"), "w", encoding="utf-8") as f:
    #     f.write(content)
    return json.dumps(content)

def main():
    try:
        input = json.load(sys.stdin)
        tasks = input["tasks"]
        blocked = input.get("blockedSlots", [])
        # with open(os.path.join(base_dir, "debug_input.json"), "w", encoding="utf-8") as f:
        #     json.dump(tasks, f, indent=2)
        now = datetime.now().strftime("%H:%M") 
        with open(os.path.join(base_dir, "debug_time.txt"), "w", encoding="utf-8") as f:
            f.write(now)
        new_schedule = call_gpt_rescheduler(tasks, now, blocked)
        # with open(os.path.join(base_dir, "debug_output.json"), "w", encoding="utf-8") as f:
        #     json.dump(new_schedule, f, indent=2)
        print(new_schedule)
    except Exception as e:
        # with open(os.path.join(base_dir, "debug_error.txt"), "w", encoding="utf-8") as f:
        #     f.write(str(e))
        print(str(e), file=sys.stderr)
        sys.exit(1)
        
if __name__ == "__main__":
    main()