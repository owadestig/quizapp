const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3030;

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:8080'
}));

const quizzes = [
    {
        id: 1,
        question: "What is the capital of France?",
        options: ["Paris", "London", "Berlin", "Madrid"],
        answer: "Paris"
    },
    {
        id: 2,
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: "4"
    }
];

const lobbies = {};

app.get('/quizzes', (req, res) => {
    res.json(quizzes);
});

app.post('/submit', (req, res) => {
    const { id, answer } = req.body;
    const quiz = quizzes.find(q => q.id === id);
    if (quiz && quiz.answer === answer) {
        res.json({ correct: true });
    } else {
        res.json({ correct: false });
    }
});

app.post('/create-lobby', (req, res) => {
    const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    lobbies[lobbyCode] = { users: [], quiz: [], started: false, readyUsers: [], currentQuestion: 0, scores: {} };
    res.json({ lobbyCode });
});

app.post('/join-lobby', (req, res) => {
    const { lobbyCode, userName } = req.body;
    if (lobbies[lobbyCode]) {
        lobbies[lobbyCode].users.push(userName);
        lobbies[lobbyCode].scores[userName] = 0;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Lobby not found' });
    }
});

app.post('/create-quiz', (req, res) => {
    const { lobbyCode, question, options, answer } = req.body;
    if (lobbies[lobbyCode]) {
        lobbies[lobbyCode].quiz.push({ question, options, answer });
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Lobby not found' });
    }
});

app.get('/quiz/:lobbyCode', (req, res) => {
    const { lobbyCode } = req.params;
    if (lobbies[lobbyCode]) {
        res.json(lobbies[lobbyCode].quiz);
    } else {
        res.status(404).json({ message: 'Lobby not found' });
    }
});

app.get('/lobby/:lobbyCode', (req, res) => {
    const { lobbyCode } = req.params;
    if (lobbies[lobbyCode]) {
        res.json(lobbies[lobbyCode]);
    } else {
        res.status(404).json({ message: 'Lobby not found' });
    }
});

app.post('/start-quiz', (req, res) => {
    const { lobbyCode } = req.body;
    if (lobbies[lobbyCode]) {
        lobbies[lobbyCode].started = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Lobby not found' });
    }
});

app.post('/user-ready', (req, res) => {
    const { lobbyCode, userName, correct } = req.body;
    if (lobbies[lobbyCode]) {
        if (correct) {
            lobbies[lobbyCode].scores[userName]++;
        }
        if (!lobbies[lobbyCode].readyUsers.includes(userName)) {
            lobbies[lobbyCode].readyUsers.push(userName);
        }
        if (lobbies[lobbyCode].readyUsers.length === lobbies[lobbyCode].users.length) {
            lobbies[lobbyCode].currentQuestion++;
            lobbies[lobbyCode].readyUsers = [];
        }
        res.json({ success: true, currentQuestion: lobbies[lobbyCode].currentQuestion });
    } else {
        res.json({ success: false, message: 'Lobby not found' });
    }
});

app.get('/finish/:lobbyCode', (req, res) => {
    const { lobbyCode } = req.params;
    if (lobbies[lobbyCode]) {
        const scores = lobbies[lobbyCode].scores;
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        res.json({ success: true, scores: sortedScores });
    } else {
        res.status(404).json({ message: 'Lobby not found' });
    }
});

app.listen(port, () => {
    console.log(`Quiz server running at http://localhost:${port}`);
});