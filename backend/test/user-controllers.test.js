const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Conversation = require('../models/Conversation');
const { updateProfile, deleteAccount } = require('../controllers/user-controllers');

const userId = '64b000000000000000000001';

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function mockUser(overrides = {}) {
  return {
    _id: userId,
    username: 'Mama',
    email: 'mama@example.com',
    password: 'hashed-password',
    role: 'user',
    saveCalls: 0,
    async isCorrectPassword(password) {
      return password === 'correct-current-password';
    },
    async save() {
      this.saveCalls += 1;
    },
    toObject() {
      return {
        _id: this._id,
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.role,
        showActiveStatus: this.showActiveStatus,
        allowDirectMessages: this.allowDirectMessages,
      };
    },
    ...overrides,
  };
}

test('profile update changes allowlisted fields without changing role or returning password', async () => {
  const user = mockUser();
  User.findById = async () => user;
  User.findOne = () => ({ select: async () => null });

  const res = responseRecorder();
  await updateProfile({
    user: { _id: userId },
    body: {
      username: '  New Mama  ',
      email: 'NEW@example.com',
      showActiveStatus: false,
      role: 'Veteran Mommy',
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(user.username, 'New Mama');
  assert.equal(user.email, 'new@example.com');
  assert.equal(user.showActiveStatus, false);
  assert.equal(user.role, 'user');
  assert.equal(user.saveCalls, 1);
  assert.equal(Object.hasOwn(res.body.user, 'password'), false);
});

test('profile update requires and verifies the current password before changing it', async () => {
  const user = mockUser();
  User.findById = async () => user;

  const missingPasswordResponse = responseRecorder();
  await updateProfile({
    user: { _id: userId },
    body: { password: 'new-password' },
  }, missingPasswordResponse);

  assert.equal(missingPasswordResponse.statusCode, 400);
  assert.equal(user.saveCalls, 0);

  const incorrectPasswordResponse = responseRecorder();
  await updateProfile({
    user: { _id: userId },
    body: { password: 'new-password', currentPassword: 'incorrect' },
  }, incorrectPasswordResponse);

  assert.equal(incorrectPasswordResponse.statusCode, 403);
  assert.equal(user.saveCalls, 0);

  const validPasswordResponse = responseRecorder();
  await updateProfile({
    user: { _id: userId },
    body: { password: 'new-password', currentPassword: 'correct-current-password' },
  }, validPasswordResponse);

  assert.equal(validPasswordResponse.statusCode, 200);
  assert.equal(user.password, 'new-password');
  assert.equal(user.saveCalls, 1);
});

test('profile update rejects invalid preferences without saving', async () => {
  const user = mockUser();
  User.findById = async () => user;

  const res = responseRecorder();
  await updateProfile({
    user: { _id: userId },
    body: { showActiveStatus: 'false' },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(user.saveCalls, 0);
});

test('account deletion cleans related content and removes the user', async () => {
  const calls = [];
  User.findById = () => ({ select: async () => ({ _id: userId }) });
  User.deleteOne = async (filter) => calls.push(['user', filter]);
  Post.find = () => ({ select: async () => [{ _id: '64b000000000000000000010' }] });
  Post.deleteMany = async (filter) => calls.push(['posts', filter]);
  Comment.deleteMany = async (filter) => calls.push(['comments', filter]);
  Conversation.deleteMany = async (filter) => calls.push(['conversations-delete', filter]);
  Conversation.updateMany = async (filter, update) => calls.push(['conversations-update', filter, update]);

  const res = responseRecorder();
  await deleteAccount({ user: { _id: userId } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 6);
  assert.deepEqual(calls[0], [
    'comments',
    {
      $or: [
        { author: userId },
        { post: { $in: ['64b000000000000000000010'] } },
      ],
    },
  ]);
  assert.deepEqual(calls[1], ['posts', { userId }]);
  assert.deepEqual(calls[2], ['conversations-delete', { type: 'direct', participants: userId }]);
  assert.deepEqual(calls[3][2], {
    $pull: {
      participants: userId,
      messages: { sender: userId },
    },
  });
  assert.deepEqual(calls[4], [
    'conversations-delete',
    { type: 'group', $expr: { $lt: [{ $size: '$participants' }, 3] } },
  ]);
  assert.deepEqual(calls[5], ['user', { _id: userId }]);
});
