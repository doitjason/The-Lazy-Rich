import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawTicker = searchParams.get("ticker");

    if (!rawTicker) {
        return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const ticker = rawTicker.trim().toUpperCase();

    try {
        // 1. Manual Mapping for major ETFs (Provider based)
        const etfProviders: Record<string, string> = {
            // Vanguard
            "EDV": "vanguard.com", "VWO": "vanguard.com", "VEA": "vanguard.com",
            "VTI": "vanguard.com", "VOO": "vanguard.com", "BND": "vanguard.com",
            "VIG": "vanguard.com", "VYM": "vanguard.com", "VUG": "vanguard.com",
            "BSV": "vanguard.com", "VNQ": "vanguard.com", "VGT": "vanguard.com",
            // iShares (Blackrock)
            "IAU": "ishares.com", "IVV": "ishares.com", "AGG": "ishares.com",
            "TLT": "ishares.com", "IEFA": "ishares.com", "IEMG": "ishares.com",
            "IJR": "ishares.com", "IJH": "ishares.com", "IWF": "ishares.com",
            "IWD": "ishares.com", "LQD": "ishares.com", "HYG": "ishares.com",
            "SLV": "ishares.com", "SOXX": "ishares.com",
            // Invesco
            "PDBC": "invesco.com", "QQQ": "invesco.com", "QQQM": "invesco.com",
            "RSP": "invesco.com", "SPLV": "invesco.com",
            // SPDR (State Street)
            "SPY": "ssga.com", "GLD": "ssga.com", "XLE": "ssga.com",
            "XLF": "ssga.com", "XLK": "ssga.com", "XLV": "ssga.com",
            "DIA": "ssga.com", "MDY": "ssga.com",
            // PIMCO
            "LTPZ": "pimco.com", "ZROZ": "pimco.com",
            // Schwab
            "SCHD": "schwab.com", "SCHX": "schwab.com",
            // ProShares
            "TQQQ": "proshares.com", "SQQQ": "proshares.com", "QLD": "proshares.com"
        };

        const headers = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (etfProviders[ticker]) {
            // Google Favicon API is very reliable for major domains
            const domain = etfProviders[ticker];
            return NextResponse.redirect(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, { headers });
        }

        // 2. Financial Modeling Prep
        // Using image-stock endpoint which is generally free/open
        const fmpUrl = `https://financialmodelingprep.com/image-stock/${ticker}.png`;
        const fmpCheck = await fetch(fmpUrl, { method: 'HEAD' });

        if (fmpCheck.ok && fmpCheck.headers.get('content-type')?.includes('image')) {
            return NextResponse.redirect(fmpUrl, { headers });
        }

        // 3. Clearbit (Company Domain Guessing)
        // Only try if FMP fails (FMP is usually better for direct stock tickers)
        const clearbitUrl = `https://logo.clearbit.com/${ticker}.com`;
        const clearbitCheck = await fetch(clearbitUrl, { method: 'HEAD' }); // HEAD check is faster
        if (clearbitCheck.ok) {
            return NextResponse.redirect(clearbitUrl, { headers });
        }

        // 4. Fallback for Crypto
        if (ticker.includes("-USD")) {
            const coin = ticker.split("-")[0].toLowerCase();
            return NextResponse.redirect(`https://cryptologos.cc/logos/${coin}-${coin}-logo.png`, { headers });
        }

        // Final fallback: Let client handle 404 (show initial)
        return NextResponse.json({ error: "Logo not found" }, { status: 404, headers });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logo" }, { status: 500 });
    }
}
