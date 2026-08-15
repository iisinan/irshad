import json
import os
import re

# Read the file
with open('/tmp/aaoifi_justifications.json', 'r') as f:
    data = json.load(f)

# Stocks to process
stocks = ['ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER', 'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL', 'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT', 'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK', 'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'MAYBAKER', 'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NASCON', 'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO', 'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT', 'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN', 'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM', 'NAHCO', 'LOTUSHAL15']

updates = []

for row in data:
    if row['symbol'] not in stocks:
        continue
    
    if not row['business_reasoning']:
        continue
        
    try:
        reasoning = json.loads(row['business_reasoning'])
        if 'summary' in reasoning:
            text = reasoning['summary']
            
            # If it's a JSON string inside a string like '["..."]' or '{"justification":"..."}'
            if text.startswith('[') and text.endswith(']'):
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        text = parsed[0]
                except:
                    pass
            elif text.startswith('{') and text.endswith('}'):
                try:
                    parsed = json.loads(text)
                    if 'justification' in parsed:
                        text = parsed['justification']
                except:
                    pass
            
            original_text = text
            # Rephrase/remove parentheses
            text = re.sub(r'\(.*?\)', '', text)
            # Clean up double spaces or spaces before punctuation
            text = re.sub(r'\s+', ' ', text)
            text = text.replace(' .', '.')
            text = text.replace(' ,', ',')
            text = text.strip()
            
            if "SCOA" in row['symbol']:
                 text = "Diversified trading conglomerate that operates in automotive distribution, industrial equipment, and engineering infrastructure. Permissible core activity."
            elif "MULTITREX" in row['symbol']:
                 text = "Food and starch processing - permissible core activity. Note: This company is currently not trading on the NGX."
            elif "UACN" in row['symbol']:
                 text = "Diversified conglomerate - foods, real estate, logistics, paints; predominantly permissible business lines."
            elif "NREIT" in row['symbol']:
                 text = "Chapel Hill Denham Nigeria Real Estate Investment Trust - certified Shariah-compliant fund with a named Shariah Adviser Lotus Financial Services Limited. Offer documents explicitly commit proceeds to Shariah-compliant, income-producing commercial real estate. Management avoids heavy reliance on debt financing. Permissible core activity."
            elif "CHAMS" in row['symbol']:
                 text = "Identity management and payments-infrastructure group across Identity Management, Payments and Transactional Systems, and ICT Training. Permissible core activity."
            elif "CHELLARAM" in row['symbol']:
                 text = "Diversified conglomerate across Industrial Raw Materials and Consumer Products, plus real estate rental income. Predominantly permissible core business."
            elif "TIP" in row['symbol']:
                 text = "Environmental and waste management solutions company. Core activities: hazardous and non-hazardous waste treatment, asbestos handling, wastewater treatment, e-waste processing, thermal desorption, and industrial cleaning services. Permissible core activity."
            elif "NAHCO" in row['symbol']:
                 text = "Aviation ground, cargo, passenger handling and logistics lines are permissible. NAHCO Travel and Hospitality Limited operates Sapphire Hotel with an on-site restaurant and lounge. Predominantly permissible core business."
            elif "UPL" in row['symbol']:
                 text = "Book publisher, engaged in printing, publishing, sale and distribution of educational and general reading books and materials. Permissible core activity."
            elif "JOHNHOLT" in row['symbol']:
                 text = "Diversified conglomerate involved in trading, assembling, and leasing. Permissible core activity."
            elif "HONYFLOUR" in row['symbol']:
                 text = "Engaged in the manufacturing and marketing of wheat-based products. Permissible core activity."
            elif "JBERGER" in row['symbol']:
                 text = "Construction company offering civil works, building, and facility management services. Permissible core activity."
            elif "GEREGU" in row['symbol']:
                 text = "Power generation company. Permissible core activity."
                 
            # Default fallback for simple format 'X - permissible core activity.'
            # re-clean up
            text = re.sub(r' - permissible core activity.', ' - permissible core activity.', text)
            
            if original_text != text or text != reasoning['summary']:
                reasoning['summary'] = text
                new_json = json.dumps(reasoning)
                updates.append({
                    'symbol': row['symbol'],
                    'business_reasoning': new_json
                })
    except Exception as e:
        print(f"Error on {row['symbol']}: {e}")

# Save updates to apply
with open('/tmp/aaoifi_updates.json', 'w') as f:
    json.dump(updates, f, indent=2)

print(f"Generated updates for {len(updates)} companies.")
