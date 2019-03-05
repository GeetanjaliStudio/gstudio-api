import Topic from '../models/topic.model';
import Post from '../models/post.model';
import User from '../models/user.model';

const { ObjectId } = require('mongodb');

/**
 * @swagger
 * tags:
 * - name: topic
 *   description: Topics info and lists
 */

/**
 * @swagger
 * parameters:
 *   topicId:
 *     name: topicId
 *     in: path
 *     description: Mongo ObjectId of topic
 *     required: true
 *     type: string
 */

function create(req, res, next) {
  const topic = new Topic();
  topic.name = req.body.name;

  try {
    if (req.body.post_id) {
      Post.findByIdAndUpdate(req.body.post_id, { $push: { topics: topic._id } }, async (err) => {
        if (err) {
          throw err;
        }
      });
    }
  } catch (e) {
    throw e;
  }
  topic
    .save()
    .then((topicSaved) => {
      res.status(201).json(topicSaved);
    })
    .catch(err => next(err));
}

async function index(req, res) {
  if (req.query.user_id) {
    const user = await User.findById(req.query.user_id);

    Topic.find({ _id: { $in: user.topics } })
      .then((topics) => {
        res.send(topics);
      }).catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving topics.'
        });
      });
  } else {
    Topic.find()
      .then((topics) => {
        res.send(topics);
      }).catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving topics.'
        });
      });
  }
}

function show(req, res) {
  Topic.findById(req.params.id, async (err, topic) => {
    if (err) return;

    const posts = await Post.find({ topics: { $in: [ObjectId(req.params.id)] } });

    const body = {
      topic,
      posts
    };
    res.send(body);
  });
}

function update(req, res) {
  Topic.findByIdAndUpdate(req.params.id, { $set: req.body }, (err) => {
    if (err) return;
    res.send('Topic udpated.');
  });
}

async function deleteTopic(req, res) {
  const { user } = req.body;
  const userById = await User.findOne({ _id: [user.id] });

  if (userById && userById.isAdmin) {
    Topic.findByIdAndUpdate(req.params.id, { $set: { status: 'deleted' } }, (err) => {
      if (err) return;
      res.send('Topic deleted.');
    });
  } else {
    res.send('Only admin can delete topic.');
  }
}

async function addTopicToUser(req, res) {
  const { user } = req.body;
  const { topic } = req.body;

  try {
    if (user) {
      const userById = await User.findById(user.id);
      if (userById.topics.includes(topic.id)) {
        res.send('Topic already added.');
      } else {
        User.findByIdAndUpdate(user.id, { $push: { topics: topic.id } }, (err) => {
          if (err) return;
          res.send('Topic added.');
        });
      }
    }
  } catch (e) {
    res.status(400).send('error');
  }
}

/**
  * @swagger
  * /topics:
  *   post:
  *     summary: Create new topic
  *     description: Create new topic by current user.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   get:
  *     summary: Get topics index
  *     description: Get list of topics. If user_id exist in query params return topics by user_id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  * /topics/addTopicToUser:
  *   post:
  *     summary: Add topic to user
  *     description: Adds topic to topics array at user document.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  * /topics/{topicId}:
  *   get:
  *     summary: Get topic
  *     description: Get topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   update:
  *     summary: Update topic
  *     description: Update topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   delete:
  *     summary: Delete topic
  *     description: Delete topic by id. Need user.id in req.body to check if the user is an admin.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  */

export default {
  create,
  index,
  show,
  update,
  deleteTopic,
  addTopicToUser
};
