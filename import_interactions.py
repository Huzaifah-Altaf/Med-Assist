import pandas as pd
from neo4j_client import driver

our_drugs = ['Metformin', 'Ibuprofen', 'Warfarin', 'Aspirin', 'Lisinopril']

df = pd.read_csv('data/drug_interactions.csv')
filtered = df[df['Drug 1'].isin(our_drugs) | df['Drug 2'].isin(our_drugs)]

def import_interactions():
    with driver.session() as session:
        count = 0
        for _, row in filtered.iterrows():
            session.run("""
                MERGE (d1:Drug {name: $drug1})
                MERGE (d2:Drug {name: $drug2})
                MERGE (d1)-[:INTERACTS_WITH {description: $description}]->(d2)
            """, drug1=row['Drug 1'], drug2=row['Drug 2'], description=row['Interaction Description'])
            count += 1
            if count % 100 == 0:
                print(f"Imported {count} interactions...")

        print(f"Done. Imported {count} total interactions.")

if __name__ == '__main__':
    import_interactions()