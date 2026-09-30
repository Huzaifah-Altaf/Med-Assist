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

if __name__ == '__main__':
    test_connection()