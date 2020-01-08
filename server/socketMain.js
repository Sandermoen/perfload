const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/perfData', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Machine = require('./models/Machine');

function socketMain(io, socket) {
  let macA;
  socket.on('clientAuth', key => {
    if (key === 'gjui9341n489182jgkl') {
      // valid node client
      socket.join('clients');
    } else if (key === 'knjf23i9gm19339') {
      // valid ui client has joined
      socket.join('ui');
    } else {
      // an invalid client has joined goodbye
      socket.disconnect(true);
    }
  });
  // a machine has connected check to see if its new if it's new add it
  socket.on('initPerfData', async data => {
    macA = data.macA;
    const mongooseResponese = await checkAndAdd(data);
    console.log(mongooseResponese);
  });

  socket.on('perfData', data => {
    console.log(data);
  });
}

function checkAndAdd(data) {
  return new Promise((resolve, reject) => {
    Machine.findOne({ macA: data.macA }, (err, doc) => {
      if (err) {
        throw err;
        reject(err);
      } else if (!doc) {
        let newMachine = new Machine(data);
        newMachine.save();
        resolve('added');
      } else {
        resolve('found');
      }
    });
  });
}

module.exports = socketMain;
