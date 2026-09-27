import pandas as pd
df = pd.read_csv('data/Training.csv')
df = df.drop(columns=['Unnamed: 133'])

print("Shape (rows, columns):", df.shape)
print("\nFirst 5 rows:")
print(df.head())

print("\nColumn names (last 5):")
print(df.columns[-5:])

print("\nHow many unique diseases:")
print(df['prognosis'].nunique())

print("\nAny missing values in the dataset?")
print(df.isnull().sum().sum())

print("\nColumns with any missing values:")
print(df.columns[df.isnull().any()].tolist())

print("\nData types of columns (should mostly be numbers, except prognosis):")
print(df.dtypes.value_counts())