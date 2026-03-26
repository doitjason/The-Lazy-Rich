const fs = require('fs');
fetch("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2FjMGI3NzkwOWFmOTQ3MTFhMDE2YzhmMTIwMmZmZTIxEgsSBxCy9ICy-h4YAZIBIwoKcHJvamVjdF9pZBIVQhM5NzY1MzYxMzc1Mjk1MTc4MDcz&filename=&opi=96797242")
    .then(r => r.text())
    .then(t => fs.writeFileSync('temp_stitch_download.html', t));
