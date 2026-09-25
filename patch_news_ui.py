import re

content = open('web/src/components/portfolio/UpdatesNews.jsx').read()

# Fix News Item Card (first one)
card1_old = "onClick={() => item.symbol ? navigate(`/market/${item.symbol}/aaoifi`) : (onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null)}"
card1_new = "onClick={() => onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null}"
content = content.replace(card1_old, card1_new, 1)

logo_old = "<CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={40} />"
logo_new = "<div onClick={(e) => { e.stopPropagation(); if (item.symbol) navigate(`/market/${item.symbol}/aaoifi`); }}><CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={40} /></div>"
content = content.replace(logo_old, logo_new, 1)

# Fix Market Intelligence Card (second one)
card2_old = "onClick={() => item.symbol ? navigate(`/market/${item.symbol}/aaoifi`) : (onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null)}"
card2_new = "onClick={() => onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null}"
content = content.replace(card2_old, card2_new, 1)

# Make cursor pointer for all cards that have a URL
content = content.replace("cursor: 'pointer' }}", "cursor: item.source_url ? 'pointer' : 'default' }}", 1)
content = content.replace("cursor: item.symbol ? 'pointer' : 'default' }}", "cursor: item.source_url ? 'pointer' : 'default' }}", 1)

with open('web/src/components/portfolio/UpdatesNews.jsx', 'w') as f:
    f.write(content)
print("done")
