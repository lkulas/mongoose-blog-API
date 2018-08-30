
"use strict";

const mongoose = require('mongoose');
const uuid = require('uuid');

const blogSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { 
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  }
  publishDate: { type: Date, default: Date.now }
});

blogSchema.virtual('authorString').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorString,
    publishDate: this.publishDate
  };
};

const BlogPosts = mongoose.model('BlogPosts', blogSchema);

module.exports = { BlogPosts };