
const clientId = "UPM8VP4nujEJjR37rcCv";
const clientSecret = "7urQuD8t6Q";
const query = "9791168343443"; // 돈의 심리학 ISBN

async function test() {
    try {
        const res = await fetch(`https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=1`, {
            headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret,
            }
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
