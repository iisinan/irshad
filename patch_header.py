import os

filepath = 'mobile/lib/features/stocks/ui/stock_detail_screen.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """              // Row 1: Ticker Symbol & Trading Board
              SizedBox(
                width: double.infinity,
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 10,
                  runSpacing: 8,
                  children: [
                    Text(
                      _currentStock['symbol'] ?? '',
                      style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: context.textDark,
                        letterSpacing: -1.0,
                        height: 1.0,
                      ),
                    ),
                    Builder(builder: (context) {"""

new_block = """              // Row 1: Ticker Symbol & Trading Board
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _currentStock['symbol'] ?? '',
                        style: TextStyle(
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                          color: context.textDark,
                          letterSpacing: -1.0,
                          height: 1.0,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Builder(builder: (context) {"""

content = content.replace(old_block, new_block)

# Fix the closing brackets for Row 1
old_close = """                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 8),"""

new_close = """                      );
                    }),
                ],
              ),
              const SizedBox(height: 8),"""

content = content.replace(old_close, new_close)

with open(filepath, 'w') as f:
    f.write(content)
