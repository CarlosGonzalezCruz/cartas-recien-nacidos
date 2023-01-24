import express from 'express'

const APP = express();
const PORT = 3000;

APP.get("/", (request, result) => {
    result.send("Hello world");
});

APP.listen(PORT, () => {
    console.log("Listening...");
})