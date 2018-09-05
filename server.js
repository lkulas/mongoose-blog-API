
"use strict";

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const { Author, BlogPost } = require('./models');

const app = express();

app.use(express.json());
app.use(morgan('common'));

app.get('/authors', (req, res) => {
	Author
		.find()
		.then(authors => {
			res.json(authors.map(author => author.serialize()));
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.get('/blogs', (req, res) => {
	BlogPost
		.find()
		.then(blogs => {
			res.json(blogs.map(blog => blog.serialize()));
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});


app.get('/blogs/:id', (req, res) => {
	BlogPost
		.findById(req.params.id)
		.then(blog => res.status(200).json(blog.serialize()))
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.post('/authors', (req, res) => {
	const requiredFields = ['firstName', 'lastName', 'userName'];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
	Author
		.findOne({ userName: req.body.userName })
		.then(author => {
			if (author) {
				const message = "Author already exists";
				console.error(message);
				return res.status(400).send(message);
			} else {
				Author
					.create({
						firstName: req.body.firstName,
						lastName: req.body.lastName,
						userName: req.body.userName
					})
					.then(author => res.status(201).json(author.serialize()))
					.catch(err => {
						console.error(err);
						res.status(500).json({ message: "Internal server error" });
					});
			};
		});
});

app.post('/blogs', (req, res) => {
	const requiredFields = ['title', 'content', 'author_id'];
	requiredFields.forEach(field => {
		if (!(field in req.body)) {
			const message = `Missing ${field} in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	});
	Author
		.findById(req.body.author_id)
		.then(author => {
			if (author) {
				BlogPost
					.create({
						title: req.body.title,
						content: req.body.content,
						author: req.body.author_id
					})
					.then(blog => res.status(201).json(blog.serialize()))
					.catch(err => {
						console.error(err);
						res.status(500).json({ message: "Internal server error" });
					});
			} else {
				const message = "Author does not exist";
				console.error(message);
				return res.status(400).send(message);
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.delete('/blogs/:id', (req, res) => {
	BlogPost
		.findOneAndDelete(req.params.id)
		.then(() => {
			res.status(204).json({ message: "Successfully deleted" });
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.delete('/authors/:id', (req, res) => {
	BlogPost
		.remove({ author: req.params.id })
		.then(() => {
			Author
				.findOneAndDelete(req.params.id)
				.then(() => {
					console.log(`Deleted author with id ${req.params.id} and blog posts by author`);
					res.status(204).json({ message: "Successfully deleted" });
				});
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		});
});

app.put('/authors/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		res.status(400).json({ error: "Request path id and request body id must match"});
	}
	const toUpdate = {};
	const updateableFields = ['firstName', 'lastName', 'userName'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	Author
		.findOne({ userName: toUpdate.userName})
		.then(author => {
			if (author) {
				const message = "Username already in use";
				console.error(message);
				return res.status(400).send(message);
			} else {
				Author
					.findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true })
					.then(updatedAuthor => res.status(200).json(updatedAuthor.serialize()))
					.catch(err => res.status(500).json({ message: "Internal server error" }));
			}
		});
});

app.put('/blogs/:id', (req, res) => {
	if (!(req.params.id && req.body.id === req.body.id)) {
		res.status(400).json({
			error: "Request path id and request body id must match"
		});
	}
	const toUpdate = {};
	const updateableFields = ['title', 'content'];
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});
	BlogPost
		.findByIdAndUpdate(req.params.id, { $set: toUpdate }, { new: true })
		.then(updatedPost => res.status(200).json(updatedPost.serialize()))
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
