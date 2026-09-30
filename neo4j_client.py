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
            RETURN type(r) AS relationship, target.name AS target_name
        """, drug_name=drug_name)
        return [{"relationship": record["relationship"], "target": record["target_name"]} for record in result]



if __name__ == '__main__':
    test_connection()
    create_sample_data()
    print(query_interactions("Metformin"))