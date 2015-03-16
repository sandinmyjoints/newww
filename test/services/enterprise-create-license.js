var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    it = lab.test,
    expect = Code.expect;

var Hapi = require('hapi'),
    moment = require('moment'),
    npme = require('../../services/npme'),
    nock = require('nock'),
    _ = require('lodash'),
    config = require('../../config');

var fixtures = require('../fixtures').enterprise;

config.license.api = 'https://billing.website.com';
config.npme.product_id = 'some-product-id';

var dataIn = {
  billingEmail: 'exists@boom.com',
  seats: 5,
  stripeId: 'cust_12345',
  begins: moment(Date.now()).format(),
  ends: moment(Date.now()).add(1,'years').format()
};

var licenseData = _.extend({}, dataIn, {
  product_id: 'some-product-id',
  customer_id: 12345,
  stripe_subscription_id: 'cust_12345'
});

delete licenseData.stripeId;
delete licenseData.billingEmail;

var server;

before(function (done) {
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '9131' });

  server.register(npme, function () {
    server.start(done);
  });
});

describe('creating a license in hubspot', function () {
  it('returns a license when hubspot creates it', function (done) {
    var mock = nock('https://billing.website.com')
        .get('/customer/' + dataIn.billingEmail)
        .reply(200, fixtures.existingUser)
        .put('/license', licenseData)
        .reply(200, fixtures.goodLicense);

    server.methods.npme.createLicense(dataIn, function (err, license) {
      mock.done();
      expect(err).to.not.exist();
      expect(license).to.deep.equal(fixtures.goodLicense);
      done();
    });
  });

  it('returns an error when hubspot is not successful', function (done) {
    var mock = nock('https://billing.website.com')
        .get('/customer/' + dataIn.billingEmail)
        .reply(200, fixtures.existingUser)
        .put('/license', licenseData)
        .reply(400);

    server.methods.npme.createLicense(dataIn, function (err, license) {
      mock.done();
      expect(err).to.exist();
      expect(err.message).to.equal('unexpected status code from license API: 400');
      expect(license).to.not.exist();
      done();
    });
  });

  it('returns an error when a customer is not found', function (done) {
    var mock = nock('https://billing.website.com')
        .get('/customer/' + dataIn.billingEmail)
        .reply(400);

    server.methods.npme.createLicense(dataIn, function (err, license) {
      mock.done();
      expect(err).to.exist();
      expect(err.message).to.equal('could not create license for unknown customer with email ' + dataIn.billingEmail);
      expect(license).to.not.exist();
      done();
    });
  });

});
