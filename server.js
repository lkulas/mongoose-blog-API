
"use strict";

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { BlogPost } = require('./models');

const app = express();

app.use(express.json());
app.use(morgan('common'));

app.get('/blog-posts', (req, res) => {
	BlogPost
		.find()
		.then(blogs => {
			res.status(200).json(blogs.map(blog => blog.serialize()));
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.get('/blog-posts/:id', (req, res) => {
	BlogPost
		.findById(req.params.id)
		.then(blog => res.json(blog.serialize()))
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.post('/blog-posts', (req, res) => {
	const requiredFields = ['title', 'content', 'author'];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
	BlogPost
	.create({
		title: req.body.title,
		content: req.body.content,
		author: req.body.author,
		created: req.body.created
	})
		.then(blog => res.status(201).json(blogPost.serialize()))
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.delete('/blog-posts/:id', (req, res) => {
	BlogPost
		.findByIdAndRemove(req.params.id)
		.then(() => {
			res.status(204).json({ message: 'Successfully deleted' });
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.put('/blog-posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		res.status(400).json({
			error: "Request path id and request body id must match"
		});
	}
	const toUpdate = {};
	const updateableFields = ['title', 'content', 'author'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	BlogPost
		.findByIdAndUpdate(req.params.id, { $set: toUpdate })
		.then(blog => res.status(204).end())
		.catch(err => res.status(500).json({ message: "Internal server error" }));
});

let server;

function runServer(databaseUrl, port = PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl,err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port}`);
				resolve();
			})
				.on('error', err => {
					mongoose.disconnect();
					reject(err);
				});
		});
	});
};

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
			server.close(err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
};

if (require.main === module) {
	runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
