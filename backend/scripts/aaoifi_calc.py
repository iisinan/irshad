import sys
from decimal import Decimal, getcontext

# Set high precision for accurate financial calculation
getcontext().prec = 28

def main():
    if len(sys.argv) != 3:
        print("Usage: python aaoifi_calc.py <numerator> <denominator>")
        sys.exit(1)
        
    try:
        num = Decimal(sys.argv[1])
        den = Decimal(sys.argv[2])
    except Exception as e:
        print("Error: Inputs must be valid numbers")
        sys.exit(1)
        
    if den == 0:
        print("0.0000")
        return
        
    # Calculate ratio as percentage
    result = (num / den) * Decimal('100')
    
    # Round to 4 decimal places matching PHP's round(..., 4)
    formatted = round(result, 4)
    print(f"{formatted:.4f}")

if __name__ == "__main__":
    main()
