def check_safety(conditions, medications):
    warnings = []

    # Normalize to uppercase for comparison
    conditions = [c.upper() for c in conditions]
    medications = [m.capitalize() for m in medications]

    # Rule 1: Metformin is risky for patients with CKD (Chronic Kidney Disease)
    if "CKD" in conditions and "Metformin" in medications:
        warnings.append("Metformin is not recommended for patients with CKD due to risk of lactic acidosis.")

    # Rule 2: NSAIDs are risky for patients with CKD
    if "CKD" in conditions and "Ibuprofen" in medications:
        warnings.append("Ibuprofen (NSAID) may worsen kidney function in CKD patients.")

    # Rule 3: Warfarin + Aspirin increases bleeding risk
    if "Warfarin" in medications and "Aspirin" in medications:
        warnings.append("Warfarin combined with Aspirin increases bleeding risk.")

    return warnings