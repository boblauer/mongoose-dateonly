var assert  = require('assert')
  , mongoose = require('mongoose')
  , Mod      = require('../')
  , DateOnly
  , MongooseDateOnly
  ;

describe('MongooseDateOnly - mongoose version ' + mongoose.version, function() {
  before(function() {
    DateOnly = Mod(mongoose);
    MongooseDateOnly = mongoose.Types.DateOnly;
  });

  it('has a version', function() {
    assert.equal(require('../package').version, Mod.version);
  });

  it('has a function', function() {
    assert.equal('function', typeof DateOnly);
  });

  it('extend mongoose.Schema.types', function() {
    assert.ok(mongoose.Schema.Types.DateOnly);
  });

  it('extends mongoose.Types', function() {
    assert.ok(mongoose.Types.DateOnly);
  });

  it('can be used in schemas', function() {
    var s1 = new mongoose.Schema({ d: DateOnly });
    var d1 = s1.path('d');

    assert.ok(d1 instanceof mongoose.SchemaType);

    var s2 = new mongoose.Schema({ d: 'DateOnly' });
    var d2 = s2.path('d');

    assert.ok(d2 instanceof mongoose.SchemaType);

    var s3 = new mongoose.Schema({ d: DateOnly });
    var d3 = s3.path('d');

    assert.ok(d3 instanceof mongoose.SchemaType);
  });

  describe('integration', function() {
    var db, schema, Record, id;

    before(function(done) {
      db = mongoose.createConnection('mongodb://localhost:27017/mongoose_dateonly', { useNewUrlParser: true });
      db.once('open', function() {
        schema = new mongoose.Schema({
          d: DateOnly,
          docs: [{ d: DateOnly }]
        });
        Record = db.model('MDateOnly', schema);
        done();
      });
    });

    afterEach(function(done) {
      Record.remove({}, done);
    });

    after(function(done) {
      db.db.dropDatabase(function() {
        db.close(done);
      });
    });

    describe('casts', function() {
      it('dateonly', function() {
        var now = new Date('1/1/2000');
        var d = new DateOnly(now);
        var s = new Record({ d: d });
        assert.equal(s.d.constructor.name, 'DateOnly');
        assert.equal(s.d.valueOf(), '20000001');
      });

      it('dates', function() {
        var now = new DateOnly('1/1/2000');
        var s = new Record({ d: now });
        assert.equal(s.d.constructor.name, 'DateOnly');
        assert.equal(s.d.valueOf(), '20000001');
      });

      it('numbers', function() {
        var now = new Date('1/1/2000');
        var s = new Record({ d: now.valueOf() });
        assert.equal(s.d.constructor.name, 'DateOnly');
        assert.equal(s.d.valueOf(), '20000001');
      });

      it('null', function() {
        var s = new Record({ d: null });
        assert.equal(s.d, null);
      });

      it('undefined', function() {
        var s = new Record({ d: undefined });
        assert.equal(s.d, undefined);
      });

      it('non-castable', function() {
        var s = new Record({ d: 'bad value' });
        assert.equal(s.d, undefined);
      });

      it('non-castables produce _saveErrors', function(done) {
        var schema = new mongoose.Schema({ d: DateOnly }, { strict: 'throw' });
        var Record = db.model('throws', schema);
        var doc = new Record({ d: 'invalid value' });
        doc.save(function(err) {
          assert.ok(err);
          done();
        });
      });

      describe('with db', function() {
        it('save', function(done) {
          var r = new Record({ d: new DateOnly() });
          r.save(function(err) {
            assert.ifError(err);
            done();
          });
        });

        it('save with null', function(done) {
          var r = new Record({ d: null });
          r.save(function(err) {
            assert.ifError(err);
            assert.equal(r.d, null);
            done();
          });
        });

        it('save with undefined', function(done) {
          var r = new Record({ d: undefined });
          r.save(function(err) {
            assert.ifError(err);
            assert.equal(r.d, undefined);
            done();
          });
        });

        it('update', function(done) {
          var r = new Record({ d: new DateOnly('1/1/2000') });
          r.save(function(err) {
            assert.ifError(err);
            assert.equal(r.d.valueOf(), 20000001);

            r.d = new DateOnly('1/1/3000');
            r.save(function(err) {
              assert.ifError(err);
              assert.equal(r.d.valueOf(), 30000001);
              done();
            });
          });
        });

        it('update with null', function(done) {
          var r = new Record({ d: new DateOnly('1/1/2000') });
          r.save(function(err) {
            assert.ifError(err);
            assert.equal(r.d.valueOf(), 20000001);
            r.update({ d: null }, function(err) {
              assert.ifError(err);
              Record.findById(r.id, function(err, r2) {
                assert.ifError(err);
                assert.equal(r2.d, null);
                done();
              });
            });
          });
        });

        it('update with undefined', function(done) {
          var r = new Record({ d: new DateOnly('1/1/2000') });
          r.save(function(err) {
            assert.ifError(err);
            assert.equal(r.d.valueOf(), 20000001);
            r.update({ d: undefined }, function(err) {
              assert.ifError(err);
              Record.findById(r.id, function(err, r2) {
                assert.ifError(err);
                assert.equal(r2.d, undefined);
                done();
              });
            });
          });
        });

        describe('queries', function() {
          it('findById', function(done) {
            var r = new Record({ d: new DateOnly() });
            r.save(function(err) {
              assert.ifError(err);
              Record.findById(r.id, function(err, r2) {
                assert.ok(r2);
                done();
              });
            });
          });

          it('queries with null properly', function(done) {
            Record.create({ d: null }, { d: new Date() }, function(err) {
              assert.ifError(err);
              Record.findOne({ d: null }, function(err, doc) {
                assert.ifError(err);
                assert.strictEqual(null, doc.d);
                done();
              });
            });
          });

          it('queries by DateOnly properly', function(done) {
            var date = new DateOnly('1/1/2000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: date }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('queries by Date properly', function(done) {
            var date = new DateOnly('1/1/2000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: new Date('1/1/2000') }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('queries by String properly', function(done) {
            var date = new DateOnly('1/1/2000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: '1/1/2000' }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('equal', function(done) {
            var date = new DateOnly('1/1/2000');
            var otherDate = new DateOnly('1/1/2000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $eq: otherDate } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('less than', function(done) {
            var date = new DateOnly('1/1/2000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $lt: Date.now() } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('less than or equal', function(done) {
            Record.create({ d: new DateOnly('1/1/2000') }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $lte: Date.now() } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 2);
                done();
              });
            });
          });

          it('greater than', function(done) {
            var date = new DateOnly('1/1/3000');
            Record.create({ d: date }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $gt: Date.now() } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), date.valueOf());
                done();
              });
            });
          });

          it('greater than or equal', function(done) {
            Record.create({ d: new DateOnly('1/1/3000') }, { d: new DateOnly() }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $gte: Date.now() } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 2);
                done();
              });
            });
          });

          it('in array', function(done) {
            Record.create({ d: new DateOnly('1/1/2000') }, { d: new DateOnly('1/1/3000') }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $in: ['1/1/2000', '1/1/2050'] } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), 20000001);
                done();
              });
            });
          });

          it('not in array', function(done) {
            Record.create({ d: new DateOnly('1/1/2000') }, { d: new DateOnly('1/1/3000') }, function(err) {
              assert.ifError(err);
              Record.find({ d: { $nin: ['1/1/2000', '1/1/2050'] } }, function(err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), 30000001);
                done();
              });
            });
          });

          it('exists == true', function (done) {
            Record.create({ d: new DateOnly('1/1/2000') }, { d: undefined }, function (err) {
              assert.ifError(err);
              Record.find({ d: { $exists: true } }, function (err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d.valueOf(), 20000001);
                done();
              });
            });
          });

          it('exists == false', function (done) {
            Record.create({ d: new DateOnly('1/1/2000') }, { d: undefined }, function (err) {
              assert.ifError(err);
              Record.find({ d: { $exists: false } }, function (err, records) {
                assert.ifError(err);
                assert.ok(records);
                assert.equal(records.length, 1);
                assert.equal(records[0].d, undefined);
                done();
              });
            });
          });
        });
      });

      it('can be required', function(done) {
        var schema = new mongoose.Schema({ d: { type: DateOnly, required: true } });
        var Record = db.model('MDateOnlyReq', schema);
        var doc = new Record();

        doc.save(function(err) {
          assert.ok(err);
          doc.d = new Date();
          doc.validate(function(err) {
            assert.ifError(err);
            done();
          });
        });
      });
    });
  });
});
