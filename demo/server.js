import * as path from 'path';
import * as url from 'url';

import express from 'express';

const app = express();

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(express.static(path.resolve(dirname, '../')));
app.listen(3000, () => console.log('Listening on port 3000'));
