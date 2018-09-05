
"use strict";

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
	firstName: 'string',
	lastName: 'string',
	userName: {
		type: 'string',
		unique: true
	}
});

const commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
  title: 'string',
  content: 'string',
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  comments: [commentSchema],
  created: { type: Date, default: Date.now }
});

blogPostSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.pre('findOne', function(next) {
	this.populate('author');
	next();
});

blogPostSchema.pre('find', function(next) {
	this.populate('author');
	next();
});

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    comments: this.comments,
    created: this.created
  };
};

authorSchema.methods.serialize = function() {
	return {
		id: this._id,
		firstName: this.firstName,
		lastName: this.lastName,
		userName: this.userName
	};
};

const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = { Author, BlogPost };