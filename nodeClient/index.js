const os = require('os');

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

performanceData().then(allPerformanceData => {
  console.log(allPerformanceData);
});
