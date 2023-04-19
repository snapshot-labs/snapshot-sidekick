import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ maxAge: 86400 }));

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
