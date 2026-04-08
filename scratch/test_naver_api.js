
const clientId = 'UPM8VP4nujEJjR37rcCv';
const clientSecret = '7urQuD8t6Q';
const query = '9791168343443'; // Psychology of Money ISBN

fetch(`https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=1`, {
    headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
    }
})
.then(res => res.json())
.then(data => {
    console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
