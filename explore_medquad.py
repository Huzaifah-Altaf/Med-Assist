import pandas as pd

df = pd.read_csv('data/medquad.csv')

print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nSources:")
print(df['source'].value_counts())

keywords = ['kidney', 'diabet', 'blood pressure', 'hypertension', 'fung', 'skin',
            'metformin', 'ibuprofen', 'warfarin', 'aspirin', 'lisinopril']

for kw in keywords:
    matches = df[df['focus_area'].fillna('').str.lower().str.contains(kw)]
    print(f"\n'{kw}': {len(matches)} rows, {matches['focus_area'].nunique()} different topics")
    print(matches['focus_area'].unique()[:8])