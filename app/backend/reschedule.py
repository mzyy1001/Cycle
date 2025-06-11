import sys
import json
import os
from openai import OpenAI
from datetime import datetime

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
base_dir = os.path.dirname(os.path.abspath(__file__))


def call_gpt_rescheduler(tasks, now_iso):
    prompt = f"""
You are a smart personal task scheduler.

The current time is: {now_iso}, please allocate tasks for today after this time.

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

Return only a JSON array where each object contains:
- id: the task ID
- timestamp: a new ISO 8601 timestamp (e.g., "2025-06-11T09:30:00")

Do not return any explanation, commentary, or markdown formatting — just the raw JSON.
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{ "role": "user", "content": prompt }],
        temperature=0.2
    )

    content = response.choices[0].message.content
    # with open(os.path.join(base_dir, "debug_response.txt"), "w", encoding="utf-8") as f:
    #     f.write(content)
    return json.loads(content)

def main():
    try:
        tasks = json.load(sys.stdin)
        # with open(os.path.join(base_dir, "debug_input.json"), "w", encoding="utf-8") as f:
        #     json.dump(tasks, f, indent=2)
        now = datetime.now().strftime("%H:%M") 
        with open(os.path.join(base_dir, "debug_time.txt"), "w", encoding="utf-8") as f:
            f.write(now)
        new_schedule = call_gpt_rescheduler(tasks, now)
        # with open(os.path.join(base_dir, "debug_output.json"), "w", encoding="utf-8") as f:
        #     json.dump(new_schedule, f, indent=2)
        print(json.dumps(new_schedule))
    except Exception as e:
        # with open(os.path.join(base_dir, "debug_error.txt"), "w", encoding="utf-8") as f:
        #     f.write(str(e))
        print(str(e), file=sys.stderr)
        sys.exit(1)
        
if __name__ == "__main__":
    main()