const os = require('os');
const io = require('socket.io-client');
const socket = io('http://127.0.0.1:8181');

socket.on('connect', () => {
  console.log('I connected to the socket server hooray');
  const nI = os.networkInterfaces();
  let macA;
  for (let key in nI) {
    if (!nI[key].internal) {
      macA = nI[key][0].mac;
      break;
    }
  }

  performanceData().then(allPerformanceData => {
    allPerformanceData.macA = macA;
    socket.emit('initPerfData', allPerformanceData);
  });

  // client auth with single key value
  socket.emit('clientAuth', 'gjui9341n489182jgkl');
  // start sending over data on interval
  let perfDataInterval = setInterval(() => {
    performanceData().then(allPerformanceData => {
      socket.emit('perfData', allPerformanceData);
    });
  }, 1000);
  socket.on('disconnect', () => {
    clearInterval(perfDataInterval);
  });
});

function performanceData() {
  return new Promise(async (resolve, reject) => {
    const cpus = os.cpus();

    const osType = os.type() == 'Darwin' ? 'Mac' : os.type();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.floor((usedMem / totalMem) * 100) / 100;
    const uptime = os.uptime();

    const cpuModel = cpus[0].model;
    const cpuSpeed = cpus[0].speed;
    const numCores = cpus.length;
    const cpuLoad = await getCpuLoad();
    resolve({
      freeMem,
      totalMem,
      usedMem,
      osType,
      uptime,
      cpuModel,
      numCores,
      cpuSpeed,
      cpuLoad
    });
  });
}

// cpus is all cores, we need the average of all the cores which will give us the cpu average
function cpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach(aCore => {
    for (type in aCore.times) {
      totalMs += aCore.times[type];
    }
    idleMs += aCore.times.idle;
  });
  return {
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length
  };
}

// because the times property is time since boot we will get now times and 100ms from now times. Compare them that will give us current load
function getCpuLoad() {
  return new Promise((resolve, reject) => {
    const start = cpuAverage();
    setTimeout(() => {
      const end = cpuAverage();
      const idleDifference = end.idle - start.idle;
      const totalDifference = end.total - start.total;

      const percentageCpu =
        100 - Math.floor((100 * idleDifference) / totalDifference);
      resolve(percentageCpu);
    }, 100);
  });
}
