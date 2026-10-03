import pandas as pd

df = pd.read_csv('data/drug_interactions.csv')

our_drugs = ['Metformin', 'Ibuprofen', 'Warfarin', 'Aspirin', 'Lisinopril']

filtered = df[df['Drug 1'].isin(our_drugs) | df['Drug 2'].isin(our_drugs)]

print(f"Total interactions involving our known drugs: {len(filtered)}")
print("\nSample:")
print(filtered.head(10))