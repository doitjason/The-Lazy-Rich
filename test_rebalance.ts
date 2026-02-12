
function testRebalance(period: string, years: number) {
    const months = years * 12;
    const intervalMap: Record<string, number> = {
        "monthly": 1,
        "semi-annually": 6,
        "annually": 12
    };
    const targetInterval = intervalMap[period] || 0;

    // Simulate month keys from 0 to months
    const startKey = 24288; // e.g. 2024-01-01
    let lastRebalanceKey = startKey;
    let rebalanceCount = 0;

    console.log(`Testing Period: ${period} over ${years} years (${months} months)`);

    for (let i = 0; i < months; i++) {
        const currentKey = startKey + i;

        // Skip first month (start)
        if (i === 0) continue;

        if (targetInterval > 0) {
            const diff = currentKey - lastRebalanceKey;

            // Logic check
            if (diff >= targetInterval) {
                rebalanceCount++;
                lastRebalanceKey = currentKey;
                // console.log(`  Rebalance triggered at month ${i} (diff=${diff})`);
            }
        }
    }
    console.log(`  Total Rebalances: ${rebalanceCount}`);
}

testRebalance("monthly", 20); // Expected ~239
testRebalance("semi-annually", 20); // Expected ~39
testRebalance("annually", 20); // Expected ~19
