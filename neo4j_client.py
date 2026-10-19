import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()  # reads values from .env

uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(uri, auth=(username, password))

def test_connection():
    with driver.session() as session:
        result = session.run("RETURN 'Connection successful!' AS message")
        for record in result:
            print(record["message"])

def create_sample_data():
    with driver.session() as session:
        session.run("""
            MERGE (m:Drug {name: 'Metformin'})
            MERGE (c:Condition {name: 'CKD'})
            MERGE (m)-[:CONTRAINDICATED_FOR]->(c)

            MERGE (i:Drug {name: 'Ibuprofen'})
            MERGE (i)-[:CONTRAINDICATED_FOR]->(c)

            MERGE (w:Drug {name: 'Warfarin'})
            MERGE (a:Drug {name: 'Aspirin'})
            MERGE (w)-[:INTERACTS_WITH]->(a)
        """)
        print("Sample data created in Neo4j")

def query_interactions(drug_name):
    with driver.session() as session:
        result = session.run("""
            MATCH (d:Drug {name: $drug_name})-[r]->(target)
            RETURN type(r) AS relationship, target.name AS target_name, r.description AS description
        """, drug_name=drug_name)
        return [{"relationship": record["relationship"], "target": record["target_name"], "description": record["description"]} for record in result]


def query_patient_interactions(medications, conditions):
    meds = [m.lower() for m in medications]
    conds = [c.lower() for c in conditions]
    results = []
    with driver.session() as session:
        pairs = session.run("""
            MATCH (a:Drug)-[r:INTERACTS_WITH]-(b:Drug)
            WHERE toLower(a.name) IN $meds AND toLower(b.name) IN $meds
              AND a.name < b.name
            RETURN a.name AS drug1, b.name AS drug2, r.description AS description
        """, meds=meds)
        for rec in pairs:
            results.append({
                "type": "drug-drug",
                "between": f"{rec['drug1']} + {rec['drug2']}",
                "description": rec["description"] or "Interaction recorded"
            })

        links = session.run("""
            MATCH (d:Drug)-[r]->(c:Condition)
            WHERE toLower(d.name) IN $meds AND toLower(c.name) IN $conds
            RETURN d.name AS drug, type(r) AS relationship, c.name AS condition
        """, meds=meds, conds=conds)
        for rec in links:
            results.append({
                "type": "drug-condition",
                "between": f"{rec['drug']} and {rec['condition']}",
                "description": rec["relationship"]
            })
    return results



if __name__ == '__main__':
    test_connection()
    create_sample_data()
    print(query_interactions("Metformin"))