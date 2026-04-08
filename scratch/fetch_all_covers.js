
const clientId = 'UPM8VP4nujEJjR37rcCv';
const clientSecret = '7urQuD8t6Q';

const books = [
    { title: "돈의 심리학", query: "9791168343443" },
    { title: "현명한 투자자", query: "현명한 투자자" },
    { title: "원칙", query: "원칙 레이 달리오" },
    { title: "모든 주식을 소유하라", query: "모든 주식을 소유하라" },
    { title: "투자에 대한 생각", query: "투자에 대한 생각 하워드 막스" },
    { title: "피터 린치의 이기는 투자", query: "피터 린치의 이기는 투자" },
    { title: "주식에 장기투자하라", query: "주식에 장기투자하라" },
    { title: "돈, 뜨겁게 사랑하고 차갑게 다루어라", query: "9791192519883" },
    { title: "투자의 네 기둥", query: "투자의 네 기둥" },
    { title: "현명한 자산배분 투자자", query: "현명한 자산배분 투자자" },
    { title: "행운에 속지 마라", query: "행운에 속지 마라" },
    { title: "불변의 법칙", query: "불변의 법칙 모건 하우절" },
    { title: "워런 버핏 바이블", query: "워런 버핏 바이블" },
    { title: "주식시장을 이기는 작은 책", query: "주식시장을 이기는 작은 책" },
    { title: "이웃집 백만장자", query: "이웃집 백만장자" },
    { title: "위대한 기업에 투자하라", query: "위대한 기업에 투자하라" },
    { title: "가치투자의 비밀", query: "가치투자의 비밀" },
    { title: "랜덤워크 투자수업", query: "랜덤워크 투자수업" },
    { title: "부자 아빠 가난한 아빠", query: "부자 아빠 가난한 아빠" },
    { title: "전설로 떠나는 월가의 영웅", query: "전설로 떠나는 월가의 영웅" },
    { title: "마법의 돈굴리기", query: "마법의 돈굴리기" }
];

async function fetchAll() {
    const results = {};
    for (const book of books) {
        console.log(`Fetching: ${book.title}...`);
        try {
            const res = await fetch(`https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(book.query)}&display=1`, {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret,
                }
            });
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                results[book.title] = data.items[0].image;
            } else {
                results[book.title] = null;
            }
        } catch (e) {
            console.error(e);
            results[book.title] = null;
        }
        await new Promise(r => setTimeout(r, 200)); // Respect rate limit
    }
    console.log("--- RESULTS ---");
    console.log(JSON.stringify(results, null, 2));
}

fetchAll();
