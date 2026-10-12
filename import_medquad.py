import time
import pandas as pd
from pinecone_client import index

DRY_RUN = False   # first run = preview only, nothing is uploaded

GOOD_SOURCES = ['NIDDK', 'NIHSeniorHealth', 'MPlusHealthTopics', 'NHLBI', 'CDC']
KEYWORDS = ['kidney', 'diabet', 'high blood pressure', 'blood pressure medicines',
            'fungal infection', 'skin infection', 'skin conditions']

def trim(text, limit=1500):
    text = " ".join(str(text).split())
    if len(text) <= limit:
        return text
    cut = text[:limit]
    last = cut.rfind('. ')
    return cut[:last + 1] if last > 500 else cut

df = pd.read_csv('data/medquad.csv')
df = df.dropna(subset=['question', 'answer', 'focus_area'])
df = df[df['source'].isin(GOOD_SOURCES)]
df = df[df['focus_area'].str.lower().str.contains('|'.join(KEYWORDS))]
df = df[df['answer'].str.len() > 200]
df = df.drop_duplicates(subset=['question', 'answer'])

print(f"Rows selected: {len(df)}")
print("\nBy source:")
print(df['source'].value_counts())
print("\nTopics:")
print(sorted(df['focus_area'].unique()))

records = []
for i, row in df.iterrows():
    records.append({
        "_id": f"medquad-{i}",
        "text": f"{row['focus_area']} - {row['question']}\n{trim(row['answer'])}",
        "focus_area": row['focus_area'],
        "source": row['source'],
    })

if DRY_RUN:
    print("\nSample record:")
    print(records[0]['text'][:500])
    print("\nDRY RUN finished. Nothing uploaded.")
else:
    for start in range(0, len(records), 90):
        batch = records[start:start + 90]
        index.upsert_records(namespace="default", records=batch)
        print(f"Uploaded {min(start + 90, len(records))} / {len(records)}")
        time.sleep(2)
    print("Done.")