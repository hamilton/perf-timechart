function sample(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor(i * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

var CPU = 2;
var TIME = 0;
var DURATION = 1;

function brushed(){
  // get exstent
  var extents = BRUSH.extent();
  var x1 = x_scale.invert(extents[0]);
  var x2 = x_scale.invert(extents[1]);
  if (BRUSH.empty()) {
      smaller_x.domain([x_scale.domain()[0], x_scale.domain()[1]]);
  }
  else if (x1 >= 0 & x2 >= 0){

    smaller_x.domain([x1, x2]);
  } else {
    smaller_x.domain([x_scale.domain()[0], x_scale.domain()[1]])
  }
  // lines_io, lines_samples, lines_cpu
  svg.selectAll('rect.lines_io').transition(4000)
    .attr('x', function(d){return smaller_x(d[TIME])})
    .attr('width', function(d){
      return smaller_x(d[TIME] + d[DURATION]) - smaller_x(d[TIME])});

  svg.selectAll('rect.lines_samples').transition(4000)
    .attr('x', function(d){return smaller_x(d[TIME])});

  svg.selectAll('rect.lines_cpu').transition(4000)
    .attr('x', function(d){return smaller_x(d[TIME])});


  svg.selectAll('.xax_line').transition().attr('opacity', 0).remove();
  svg.selectAll('.xax_ticks').transition().attr('opacity', 0).remove();
  svg.selectAll('.xax_text').transition().attr('opacity', 0).remove();

  x_axis(smaller_x);

  // console.log(x_ticks);
  // svg.select('.xax_line')//.transition()
  //   .attr('x1', smaller_x(_.first(x_ticks)))
  //   .attr('x2', smaller_x(_.last(x_ticks)));

  // var ticks = svg.selectAll('.xax_ticks').data(x_ticks);
  // ticks.enter().append('svg:line')//.transition()
  //   .attr('x1', smaller_x)
  //   .attr('x2', smaller_x)
  //   .attr('class', 'xax_ticks')
  //   .attr('y1', HEIGHT-BOTTOM+15)
  //   .attr('y2', HEIGHT-BOTTOM+20)
  //   .attr('stroke', 'black');

  // ticks.exit().remove();

  // var labels = svg.selectAll('.xax_text').data(x_ticks);

  // labels.enter().append('svg:text')//.transition()
  //   .attr('class', 'xax_text')
  //   .attr('x', smaller_x)
  //   .attr('y', HEIGHT-BOTTOM+40)
  //   .text(function(d){return d})
  //   .attr('font-size', 15)
  //   .attr('fill', 'black')
  //   .attr('text-anchor', 'middle');;

  // labels.exit().remove();
}










var svg;

var BRUSH;

var smaller_x, x_scale;

var SAMPLE_SIZE = .1;

var EVENT_OPACITY = .4;

var PADDING    = 10;
var BAR_HEIGHT = 12;

var TOP = 80;
var BOTTOM = 50;
var LEFT = 130;
var RIGHT = 50;
var TICKS = 10;

var HEIGHT;
var WIDTH = 1400;

function main(data){
  var processes = _.pluck(data, 'name');
  var max_cpu=0;

  data = _.sortBy(data, function(d){
    var mcpu = parseInt(d3.max(_.keys(d['cpu_events_by_core'])));
    if (mcpu > max_cpu) {
      max_cpu = mcpu;
    }
    // max_cpu = _.max(_.map(d['samples'], function(d){ return  Math.max(max_cpu, d[CPU])} ));
    return - d3.sum(_.map(d['all_cpu_events'], function(d){return d[1]})); //-d3.sum(_.map(d['samples'], function(d){ return d[CPU] + 10}));
  });
  HEIGHT = (BAR_HEIGHT + PADDING) * processes.length + TOP + BOTTOM;

  var y_scale = d3.scale.ordinal().domain(_.keys(processes)).rangePoints([TOP, HEIGHT-BOTTOM]);
  // calculate the x.
  var x_min = 0;
  
  var x_max = Math.max(
      d3.max(_.map(_.pluck(data, 'all_cpu_events'), function(d){
        return d3.max(_.map(d, function(di) {return di[TIME]}));
      })),
      d3.max(_.map(_.pluck(data, 'io'), function(d){
        return d3.max(_.map(d, function(di) {return di[TIME] + di[DURATION]}));
      }))
  );

  // get the largest count in the cpu

  var biggest_count = 0;
  _.each(_.pluck(data, 'all_cpu_events'), function(d){
      var m = _.max(d,function(d){return d[1]})[1];
      if (m > biggest_count){
        biggest_count = m;
      }
  })

  var lane_y_scale = d3.scale.linear().domain([0, biggest_count]).range([BAR_HEIGHT, 0]);

  //console.log(x_max);
  x_scale = d3.scale.linear().domain([x_min, x_max]).range([LEFT, WIDTH-RIGHT]);
  smaller_x = d3.scale.linear().domain([x_min, x_max]).range([LEFT, WIDTH-RIGHT]);

  //var brushed = brusher(x_scale);

  BRUSH = d3.svg.brush()
    .x(d3.scale.identity().domain([LEFT, WIDTH-RIGHT]))
    .on("brushend", brushed);

  //////////////////////////////////////////////////
  //////////////////////////////////////////////////

  svg = d3.select('div#vis')
    .append('svg:svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT);



  

  //////////////////////////////////////////////////
  //////////////////////////////////////////////////
  //////////////////////////////////////////////////





  // x_axis.


  svg.append('svg:text')
      .attr('x', LEFT-10)
      .attr('text-anchor', 'end')
      .attr('y',0 + BAR_HEIGHT*1.5)
      .attr('dy', '.35em')
      .attr('font-size', 15)
      .text("Overall CPU")
      .attr('font-weight', '800')
      .attr('fill', 'black');

  ///////////
  
  var this_process, this_pid, this_time, these_samples, these_io, these_cpu;
  _.each(data, function(process, i){
    // try sampling 20%.
    
    these_io      =     process.io; // _.filter(process.samples, function(d){return d[CPU] == -1});
    these_samples =     process.all_cpu_events; 
    //these_samples =      _.filter(process.samples, function(d){return d[CPU] >=  0}); 
    //these_cpu     =      _.filter(process.samples, function(d){return d[CPU] == -2});

    //these_io = sample(these_io, Math.floor(these_io.length * .1));
    //these_samples = sample(these_samples, Math.floor(these_samples.length * SAMPLE_SIZE));
    //these_cpu     = sample(these_cpu,     Math.floor(these_cpu.length     * SAMPLE_SIZE/2));
    this_pid = process.id;
    this_process = i;

    function special_y(d){
      if (d == 0){
        return lane_y_scale(-100)
      } else {
        return lane_y_scale(d);
      }
    }

    var line = d3.svg.area()
      .x(function(d) {return x_scale(d[0])})
      .y0(function(d){return special_y(0) + y_scale(this_process)})
      .y1(function(d){return special_y(d[1]) + y_scale(this_process)});

    svg.append("path")
        .attr('stroke', 'black')
        .attr('opacity', .5)
        .attr("d", line(these_samples));
    // cover up the ugly below-the-ocean view.
    svg.append('svg:rect')
        .attr('x', LEFT)
        .attr('y', y_scale(this_process) + BAR_HEIGHT)
        .attr('width', WIDTH - RIGHT)
        .attr('height', 20)
        .attr('fill', 'white')
        .attr('opacity', 1)
        // .on('mouseover', io_over(this_pid, i, svg, x_scale, y_scale))
        // .on('mouseout', io_out(this_pid, i, svg, x_scale, y_scale));
      
    svg.selectAll('.io')
      .data(these_io).enter().append('svg:rect')
        .attr('class', 'lines_io')
        .attr('x', function(d){return x_scale(d[TIME])})
        .attr('y', y_scale(i))//-BAR_HEIGHT/2)
        .attr('width', function(d){return  x_scale(d[DURATION]) - LEFT})
        //.attr('width', 100)
        .attr('height', BAR_HEIGHT)
        .attr('fill', 'red')
        .attr('opacity', 1);
    //
    svg.selectAll('.io')
      .data(these_io).enter().append('svg:circle')
        .attr('class', 'dots_io')
        .attr('cx', function(d){return x_scale(d[TIME])})
        .attr('cy', y_scale(i) + BAR_HEIGHT + 5)
        //.attr('width', function(d){return  x_scale(d[DURATION]) - LEFT})
        .attr('r', 2)
        .attr('height', BAR_HEIGHT)
        .attr('fill', 'red')
        .attr('opacity', .5);



    // svg.selectAll('.samples')
    //   .data(these_samples).enter().append('svg:rect')
    //     .attr('class', 'lines_samples')
    //     .attr('x', function(d){return x_scale(d[TIME])})
    //     .attr('y', y_scale(i))
    //     .attr('width', 1)
    //     //.attr('width', function(d){return x_scale(d[0]) - x_scale(d[1])})
    //     .attr('height', BAR_HEIGHT/2)
    //     .attr('fill', 'black')
    //     .attr('opacity', EVENT_OPACITY);

    // svg.selectAll('.cpu')
    //   .data(these_cpu).enter().append('svg:rect')
    //     .attr('class', 'lines_cpu')
    //     .attr('x', function(d){return x_scale(d[TIME])})
    //     .attr('y', y_scale(i)-BAR_HEIGHT/2)
    //     .attr('width', 1)
    //     .attr('height', BAR_HEIGHT/2)
    //     .attr('fill', 'orange')
    //     .attr('opacity', EVENT_OPACITY);

    // THIS IS FOR THE TOP CPU BAR

    // svg.selectAll('.samples')
    //   .data(these_samples).enter().append('svg:rect')
    //     .attr('x', function(d){return x_scale(d[TIME])})
    //     .attr('y', function(d){return 0 + d[CPU] * BAR_HEIGHT * 3/(max_cpu+1)})
    //     .attr('width', 1)
    //     //.attr('width', function(d){return x_scale(d[0]) - x_scale(d[1])})
    //     .attr('height', BAR_HEIGHT*3/(max_cpu+1))
    //     .attr('fill', 'black')
    //     .attr('opacity', .05);

      //
      // svg.selectAll('.io')
      // .data(these_io).enter().append('svg:circle')
      //   .attr('cx', function(d){return x_scale(d[TIME])})
      //   .attr('cy', BAR_HEIGHT*3)
      //   .attr('r', 1)
      //   .attr('fill', 'red')
      //   .attr('opacity', .5);
  })
  



  svg.append('svg:rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', LEFT)
    .attr('height', HEIGHT)
    .attr('opacity', .9)
    .attr('fill', 'white');

    svg.selectAll('.y_labels')
    .data(_.keys(processes)).enter().append('svg:text')
      .attr('x', LEFT-10)
      .attr('text-anchor', 'end')
      .attr('y', y_scale)
      .attr('dy', '.35em')
      .attr('font-size', 12)
      .text(function(d){return processes[d]})
      .attr('fill', 'black');

    //
  var x_ticks = x_scale.ticks(TICKS);
  //console.log(x_scale(_.first(x_ticks)), x_scale(_.last(x_ticks )) );
  ////////////////////////////////
  x_axis(x_scale);

  var gBrush = svg.append("g")
    .attr("class", "brush")
    .call(BRUSH)
    .call(BRUSH.event);


  gBrush.selectAll("rect")
    .attr('y', 0)
    .attr("height", BAR_HEIGHT*3);
  // big axis on top
  
  var x_ticks = x_scale.ticks(TICKS);

  // svg.append('svg:line')
  //   .attr('x1', x_scale(_.first(x_ticks)))
  //   .attr('x2', x_scale(_.last(x_ticks)))
  //   .attr('y1', BAR_HEIGHT * 3 + 4)
  //   .attr('y2', BAR_HEIGHT * 3 + 4)
  //   .attr('opacity', .5)
  //   .attr('stroke', 'black');

  svg.selectAll('.xax').data(x_ticks).enter().append('svg:line')
    .attr('x1', x_scale)
    .attr('x2', x_scale)
    .attr('y1', BAR_HEIGHT * 3 + 4)
    .attr('y2', BAR_HEIGHT * 3 + 4 + 5)
        .attr('opacity', .5)

    .attr('stroke', 'black');

  svg.selectAll('.xax_t').data(x_ticks).enter().append('svg:text')
    .attr('x', x_scale)
    .attr('y', BAR_HEIGHT * 3 + 4 + 15)
    .text(function(d){return d})
    .attr('font-size', 11)
    .attr('fill', 'black')
    .attr('opacity', .5)
    .attr('text-anchor', 'middle');

  //
  svg.selectAll('.y_hatch')
    .data(_.keys(processes)).enter().append('svg:line')
    .attr('x1', LEFT)
    .attr('x2', WIDTH-RIGHT)
    .attr('y1', function(d){ return y_scale(d) + BAR_HEIGHT} )
    .attr('y2', function(d){ return y_scale(d) + BAR_HEIGHT} )
    .attr('stroke', 'black')
    .attr('opacity', .05);
}




function x_axis(axis){
  var x_ticks = axis.ticks(TICKS);
  svg.append('svg:line')
    .attr('class', 'xax_line')
    .attr('x1', axis(_.first(x_ticks)))
    .attr('x2', axis(_.last(x_ticks)))
    .attr('y1', HEIGHT-BOTTOM+15)
    .attr('y2', HEIGHT-BOTTOM+15)
    .attr('opacity', .5)
    .attr('stroke', 'black');

  svg.selectAll('.xax').data(x_ticks).enter().append('svg:line')
    .attr('class', 'xax_ticks')
    .attr('x1', axis)
    .attr('x2', axis)
    .attr('y1', HEIGHT-BOTTOM+15)
    .attr('y2', HEIGHT-BOTTOM+20)
    .attr('stroke', 'black');

  svg.selectAll('.xax_t').data(x_ticks).enter().append('svg:text')
    .attr('class', 'xax_text')
    .attr('x', axis)
    .attr('y', HEIGHT-BOTTOM+40)
    .text(function(d){return d})
    .attr('font-size', 15)
    .attr('fill', 'black')
    .attr('text-anchor', 'middle');
}
















function io_over(pid, _i, svg, x_scale, y_scale){
  return function(d,i){
    // start
    var start = d[TIME];
    var duration = d[DURATION];
    var end = d[TIME] + d[DURATION];
    // console.log('start: ', start);
    // console.log('duration: ', d[DURATION]);
    // console.log('end: ', end);

    svg.append('svg:text')
      .attr('class', 'io_rollover')
      .attr('x', x_scale(start)-3)
      .attr('text-anchor', 'end')
      .attr('y', y_scale(_i) + 3)
      .attr('font-size', 11)
      .text(start +'ms')
      .attr('fill', 'black').attr('opacity', 0).transition().attr('opacity', 1);

    // svg.append('svg:text')
    //   .attr('class', 'io_rollover')
    //   .attr('x', x_scale(start) + (x_scale(end) - x_scale(start))/2 )
    //   .attr('y', y_scale(_i) + 3)
    //   .attr('text-anchor', 'middle')
    //   .attr('fill', 'white')
    //   .attr('font-size', 11)
    //   .text(duration + 'ms total')
    //   .attr('opacity', 0).transition().attr('opacity', 1);;

    svg.append('svg:text')
      .attr('class', 'io_rollover')
      .attr('x', x_scale(end) + 5)
      .attr('text-anchor', 'start')
      .attr('y', y_scale(_i) + 3)
      .attr('font-size', 11)
      .text(end +'ms')
      .attr('fill', 'black').attr('opacity', 0).transition().attr('opacity', 1);

    svg.selectAll('.io_' + pid).filter(function(dd,ii){
      return ii != i;
    })
      .transition().attr('opacity', EVENT_OPACITY)
  }


}

function io_out(pid, _i, svg, x_scale, y_scale){
  return function(d,i){
    svg.selectAll('.io_' + pid).transition().attr('opacity', 1);
    svg.selectAll('.io_rollover')
      .transition().attr('opacity', 0)
        .remove();
  }
}


// $.ajax({url: "data_10min_converted2.json", dataType:"json"}).done(main).fail(function(jqXHR, textStatus, errorThrown) {
//             alert([textStatus, errorThrown]);
//     });

// $.ajax({url: "timechart_smaller.json", dataType:"json"}).done(main).fail(function(jqXHR, textStatus, errorThrown) {
//     alert([textStatus, errorThrown]);
// });

$.ajax({url: "area_data.json", dataType:"json"}).done(main).fail(function(jqXHR, textStatus, errorThrown) {
    alert([textStatus, errorThrown]);
});

// $.ajax({url: "output.30m_aws.converted.json", dataType:"json"}).done(main).fail(function(jqXHR, textStatus, errorThrown) {
//             alert([textStatus, errorThrown]);
//     });

