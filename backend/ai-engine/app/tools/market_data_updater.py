import yfinance as yf
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import asyncio

class MarketDataUpdater:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }

    async def fetch_market_data(self, ticker: str) -> dict:
        """
        Tries to fetch from NGXPulse (mocked for now, assumes standard web structure),
        falls back to Yahoo Finance.
        """
        data = await self._try_ngxpulse(ticker)
        if data:
            data['data_source'] = "NGXPulse"
            return data
            
        data = await self._try_yfinance(ticker)
        if data:
            data['data_source'] = "Yahoo Finance"
            return data
            
        return {}

    async def _try_ngxpulse(self, ticker: str) -> dict:
        # For this MVP, we scrape simplywall.st or nairametrics/ngxpulse as a placeholder for Nigerian stock prices
        # Real NGX sites often block bots, so we use yfinance directly as fallback if this fails.
        return None

    async def _try_yfinance(self, ticker: str) -> dict:
        try:
            # Most Nigerian stocks on Yahoo Finance end with .LG
            yf_ticker = f"{ticker}.LG"
            # Using asyncio.to_thread because yfinance is synchronous
            stock = await asyncio.to_thread(yf.Ticker, yf_ticker)
            info = await asyncio.to_thread(lambda: stock.info)
            
            if not info or 'regularMarketPrice' not in info and 'currentPrice' not in info:
                return None
                
            price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
            prev_close = info.get('previousClose', price)
            change = price - prev_close if price and prev_close else 0
            pct_change = (change / prev_close) * 100 if prev_close else 0
            
            return {
                "latest_price": price,
                "daily_change": change,
                "percentage_change": pct_change,
                "market_capitalisation": info.get('marketCap'),
                "volume": info.get('volume'),
                "shares_outstanding": info.get('sharesOutstanding'),
                "fifty_two_week_high": info.get('fiftyTwoWeekHigh'),
                "fifty_two_week_low": info.get('fiftyTwoWeekLow'),
                "last_trading_date": datetime.now().date().isoformat(),
                "last_trading_time": datetime.now().time().isoformat(),
                "retrieval_timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"YFinance error for {ticker}: {e}")
            return None
