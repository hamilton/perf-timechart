/*
g = new Dygraph(
  document.getElementById("div_g"),
  [], {
    rollPeriod: 7,
    errorBars: true
  }
);*/

const IO_WAIT = -1
const START = 0;
const DURATION = 1;
const WAIT_KIND = 2;

function convert(cpu) {
  var dest = [];
  for (var y =0;y<cpu.samples.length;y+=3) {
    var s = cpu.samples;
    var cpu_num = s[y+0]
    //convert negative states into error bars...ignore cpu #
    var wait_kind = cpu_num;
    var out = [s[y+1], s[y+2], wait_kind]
    //if (wait_kind == -1)
      dest.push(out)
  }
  function compare(a, b) {
    return a[0] - b[0];
  }
  var dedup = []
  //TODO: should be able to reverse instead
  dest.sort(compare)
  var last_io;
  for (var i = 0;i < dest.length;i++) {
    var current = dest[i];
    //if (dedup.length && last_by_type[current[2]]) {
      if (dedup.length) {
      var last = dedup[dedup.length-1];

      //last_by_type[current[2]] = last;
      var skip = false;
      if (last[0] == current[0]) {
        last[1] = Math.max(last[1], current[1]);
        skip = true
        // merge adjacent entries
      } else if (last[0] + last[1] >= current[0]) {
        last[1] += current[0] + current[1] - (last[0] + last[1])
        skip = true
      }
      if (skip) {
        if (current[2] == IO_WAIT)
          last[2] = IO_WAIT
        continue
      }
    }
    dedup.push(current);
    //last_by_type[current[2]] = current;
  }
  return dedup;
}

var fs = require('fs');

var data = fs.readFileSync("data.json", "utf8");
var lines = data.split("\n");
var converted = []
for (var i=0;i<lines.length;i++) {
  var l = lines[i]
  if (!l.length) continue;
  var o = JSON.parse(l)
  if (o.process && o.samples.length) {
    var c = convert(o, i)
    var n = {y:converted.length, id:converted.length, name:(o.process + "/" + o.pid), samples:c, i:0}
    if (!c.length)
      continue
  
    converted.push(n)
  }
}
console.log(JSON.stringify(converted));
