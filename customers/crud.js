// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const images = require('../lib/images');
const db = require('./firestore');

const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({extended: false}));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

/**
 * GET /customers
 *
 * Display a page of customers (up to ten at a time).
 */
router.get('/', async (req, res) => {
  let {customers, nextPageToken} = await db.list(10, req.query.pageToken);
  res.render('customers/list.pug', {
    customers,
    nextPageToken,
  });
});

/**
 * GET /costumers/add
 *
 * Display a form for creating a customer.
 */
router.get('/add', (req, res) => {
  res.render('customers/form.pug', {
    customer: {},
    action: 'Add',
  });
});

/**
 * POST /customers/add
 *
 * Create a customer.
 */
// [START add]
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  async (req, res) => {
    let data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    const savedData = await db.create(data);
    res.redirect(`${req.baseUrl}/${savedData.id}`);
  }
);
// [END add]

/**
 * GET /customers/:id/edit
 *
 * Display a customer for editing.
 */
router.get('/:customer/edit', async (req, res) => {
  const customer = await db.read(req.params.customer);
  res.render('customers/form.pug', {
    customer,
    action: 'Edit',
  });
});

/**
 * POST /customers/:id/edit
 *
 * Update a customer.
 */
router.post(
  '/:customer/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  async (req, res) => {
    let data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    const savedData = await db.update(req.params.customer, data);
    res.redirect(`${req.baseUrl}/${savedData.id}`);
  }
);

/**
 * GET /customers/:id
 *
 * Display a customer.
 */
router.get('/:customer', async (req, res) => {
  const customer = await db.read(req.params.customer);
  res.render('customers/view.pug', {
    customer,
  });
});

/**
 * GET /customers/:id/delete
 *
 * Delete a customer.
 */
router.get('/:customer/delete', async (req, res) => {
  await db.delete(req.params.customer);
  res.redirect(req.baseUrl);
});

module.exports = router;
