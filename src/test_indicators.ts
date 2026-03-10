
import { getMentorMarketContext } from "./lib/market-data";

async function test() {
    console.log("=== Testing Guru Chat Indicators ===");

    // 1. Common Indicators & Sage (Value)
    console.log("\n--- Sage (Value) Context ---");
    const sageContext = await getMentorMarketContext("sage", ["KO"]);
    console.log(sageContext);

    // 2. Hero (Growth)
    console.log("\n--- Hero (Growth) Context ---");
    const heroContext = await getMentorMarketContext("hero", ["NVDA"]);
    console.log(heroContext);

    // 3. Speculator (Momentum)
    console.log("\n--- Speculator (Momentum) Context ---");
    const specContext = await getMentorMarketContext("speculator", ["TSLA"]);
    console.log(specContext);

    // 4. Father (Index)
    console.log("\n--- Father (Index) Context ---");
    const fatherContext = await getMentorMarketContext("father", ["SPY"]); // User ticker doesn't matter much for Father, but passing one
    console.log(fatherContext);
}

test().catch(console.error);
