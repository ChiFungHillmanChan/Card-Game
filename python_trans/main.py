import json
from googletrans import Translator
from tqdm import tqdm

# Load original file
with open('questions_en.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

translator = Translator()

print(f"Translating {len(questions)} questions to 繁體中文…")

# Wrap the list in tqdm for a progress bar
for idx, q in enumerate(tqdm(questions, desc="Translating", unit="q")):
    try:
        q['text'] = translator.translate(q['text'], dest='zh-tw').text
    except Exception as e:
        print(f"[!] Failed to translate question #{idx+1}: {e}")
        # optionally: leave original or retry

# Save new file
with open('questions_zh-Hant.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("✅ All done! Saved to questions_zh-Hant.json")
