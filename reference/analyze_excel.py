import sys
try:
    import pandas as pd
except ImportError:
    print("pandas not installed")
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    print("openpyxl not installed")
    sys.exit(1)

f = '조기은퇴계획(투자).xlsx'
try:
    xl = pd.ExcelFile(f)
    print("Sheet names:", xl.sheet_names)
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        # Read the first few rows to understand structure
        df = pd.read_excel(f, sheet_name=sheet, nrows=20) 
        print(df.to_string())
        print("\nColumns:", df.columns.tolist())
except Exception as e:
    print(f"Error reading excel: {e}")
