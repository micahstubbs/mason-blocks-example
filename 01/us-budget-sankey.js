// set the dimensions and margins of the graph
var margin = { top: 40, right: 10, bottom: 100, left: 10 },
    width = container.offsetWidth - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom

var fontScale = d3.scaleLinear().range([14, 22])

// format variables
var formatNumber = d3.format('.1f'), // zero decimal places
    format = function(d) {
        return formatNumber(d)
    },
    color = d3.scaleOrdinal(d3.schemeCategory20)

// append the svg object to the body of the page
var svg = d3
    .select('#container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('background', '#e8e8e8')
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

//transition time
transition = 1000

//starting year
thisYear = 1968

// Set the sankey diagram properties
var sankey = d3.sankey().nodeWidth(60).nodePadding(20).size([width, height])

var path = sankey.link()

// load the data
d3.csv('us-budget-sankey-years-col.csv', function(error, csv) {
    if (error) throw error

    // load deficit data
    d3.csv('us-budget-sankey-deficit.csv', function(error, deficit) {
        if (error) throw error

        newData(csv, deficit, thisYear)
        drawSankey()
        drawDeficit()
        drawNotes()
        drawSlider()
    })
})

function newData(csv, deficit, thisYear) {
    thisYearCsv = csv.filter(function(d) {
        if (d['year'] == thisYear) {
            return d
        }
    })

    thisYearDeficit = deficit.filter(function(d) {
        if (d['year'] == thisYear) {
            return d
        }
    })
    //console.log(thisYearDeficit)

    // create an array to push all sources and targets, before making them unique
    arr = []
    thisYearCsv.forEach(function(d) {
        arr.push(d.source)
        arr.push(d.target)
    }) //console.log(arr)

    // create nodes array
    nodes = arr.filter(onlyUnique).map(function(d, i) {
        return {
            node: i,
            name: d
        }
    })
    //console.log(nodes)
    // create links array
    links = thisYearCsv.map(function(thisYearCsv_row) {
        return {
            source: getNode('source'),
            target: getNode('target'),
            value: +thisYearCsv_row.value
        }

        function getNode(type) {
            return nodes.filter(function(node_object) {
                return node_object.name == thisYearCsv_row[type]
            })[0].node
        }
    })
    //console.log(links)
}

function drawSankey() {
    d3.selectAll('.node').remove()
    d3.selectAll('.link').remove()
    d3.selectAll('.deficitLabel').remove()

    sankey.nodes(nodes).links(links).layout(1000)

    fontScale.domain(
        d3.extent(nodes, function(d) {
            return d.value
        })
    )

    // add in the links
    link = svg
        .append('g')
        .selectAll('.link')
        .data(links, function(d) {
            return d.id
        })
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', path)
        .style('stroke', function(d) {
            return color(d.source.name.replace(/ .*/, ''))
        })
        .style('stroke-width', function(d) {
            return Math.max(1, d.dy)
        })

    // add in the nodes
    var node = svg
        .append('g')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')'
        })

    // add the rectangles for the nodes
    node
        .append('rect')
        .attr('height', function(d) {
            return d.dy < 0 ? 0.1 : d.dy
        })
        .attr('width', sankey.nodeWidth())
        .attr('class', function(d) {
            return d.name
        })
        .attr('value', function(d) {
            return d.value
        })
        .style('fill', 'lightgrey')
        .style('opacity', 0.4)
        .style('stroke', function(d) {
            return d3.rgb(d.color).darker(2)
        })

    // title for the nodes
    node
        .append('text')
        .attr('x', -6)
        .attr('y', function(d) {
            return d.dy / 2
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .attr('transform', null)
        .style('font-size', function(d) {
            return Math.floor(fontScale(d.value)) + 'px'
        })
        .text(function(d) {
            return d.name
        })
        .filter(function(d) {
            return d.x < width / 2
        })
        .attr('x', 6 + sankey.nodeWidth())
        .attr('text-anchor', 'start')
        .attr('class', 'nodeLabel')

    // % for the nodes
    node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', 30)
        .attr('y', function(d) {
            return d.dy / 2
        })
        .style('font-size', 18)
        .attr('dy', '.35em')
        .filter(function(d) {
            return d.value > 1
        })
        .text(function(d) {
            return format(d.value) + '%'
        })
        .attr('class', 'nodePercent')
}

function drawDeficit() {
    //highlight deficit
    barHeight = d3.select('.Spending').attr('height')
    barVal = d3.select('.Spending').attr('value')
    deficitVal = thisYearDeficit[0].deficit

    //get deficit bar size with ratio of spending value to bar height
    deficitBarRatio = barHeight * deficitVal / barVal
    //console.log(deficitBarRatio)

    deficitBar = d3
        .select('.Spending')
        .select(function() {
            return this.parentNode
        })
        .append('rect')
        .attr('height', function() {
            if (deficitBarRatio < 0) {
                return -deficitBarRatio
            } else {
                return deficitBarRatio
            }
        })
        .attr('width', sankey.nodeWidth())
        .attr('y', function(d) {
            if (deficitBarRatio < 0) {
                return d.dy + deficitBarRatio
            } else {
                return d.dy - deficitBarRatio
            }
        })
        .style('fill', function() {
            if (deficitBarRatio < 0) {
                return 'red'
            } else {
                return 'blue'
            }
        })
        .style('opacity', 0.8)
        .attr('class', 'deficit')

    function deficitType() {
        if (thisYearDeficit[0].deficit < 0) {
            return 'Deficit'
        } else {
            return 'Surplus'
        }
    }

    svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height * 0.92)
        .style('font-size', 25)
        .style('font-weight', 'bold')
        .attr('class', 'deficitLabel')
        .text(function() {
            if (thisYearDeficit[0].deficit < 0) {
                return format(-thisYearDeficit[0].deficit) + '% ' + 'Deficit'
            } else {
                return format(thisYearDeficit[0].deficit) + '% ' + 'Surplus'
            }
        })
        .style('fill', function() {
            if (deficitBarRatio < 0) {
                return 'red'
            } else {
                return 'blue'
            }
        })
}

//animated update is WIP, labels arent repositioning correctly
// function updateSankey() {
//     sankey.nodes(nodes)
//         .links(links)
//         .layout(1000);

//     //sankey.relayout(); PURPOSE???
//     fontScale.domain(d3.extent(nodes, function(d) { return d.value }));

//     // add in the links
//     svg.selectAll(".link")
//         .data(links)
//         .transition()
//         .duration(transition)
//         .attr("d", path)
//         .style("stroke-width", function(d) { return Math.max(1, d.dy); });

//     // add in the nodes
//     svg.selectAll(".node")
//         .data(nodes)
//         .transition()
//         .duration(transition)
//         .attr("transform", function(d) {
//             return "translate(" + d.x + "," + d.y + ")"
//         });

//     // add the rectangles for the nodes
//     svg.selectAll(".node rect")
//         .data(nodes)
//         .transition()
//         .duration(transition)
//         .attr("height", function(d) {
//             return d.dy < 0 ? .1 : d.dy;
//         });

//     //     // title for the nodes
//     //     svg.selectAll(".nodeLabel")
//     //         .data(nodes)
//     //         .transition()
//     //         .duration(transition)
//     //         .style("font-size", function(d) {
//     //             return Math.floor(fontScale(d.value)) + "px";
//     //         });

//     //     // % for the nodes
//     //     svg.selectAll(".nodePercent")
//     //         .data(nodes)
//     //         .text(function(d) { return format(d.value) + "%" });
// }

function drawSlider() {
    //Slider
    var slider = d3
        .sliderHorizontal()
        .min(1968)
        .max(2017)
        .step(1)
        .width(container.offsetWidth - 75)
        .tickFormat(d3.format('.4'))
        .on('end', val => {
            //use end instead of onchange, is when user releases mouse
            thisYear = val

            d3.csv('us-budget-sankey-years-col.csv', function(error, csv) {
                if (error) throw error

                d3.csv('us-budget-sankey-deficit.csv', function(
                    error,
                    deficit
                ) {
                    if (error) throw error
                    newData(csv, deficit, thisYear)
                    drawSankey()
                    drawDeficit()
                })
            })
        })

    var g = d3
        .select('div#slider')
        .append('svg')
        .attr('width', container.offsetWidth)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')

    g.call(slider)
    d3.selectAll('#slider').style('font-size', 20)
}

function drawNotes() {
    //PERCENT OF GDP
    svg
        .append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('dy', '0em')
        .text('Percent of GDP (May not add up due to rounding)')
        .attr('font-size', 25)
        .attr('font-weight', 'bold')
        .attr('class', 'percent')

    //Source and * and ** notes
    svg
        .append('text')
        .attr('x', width * 0.65)
        .attr('y', height + 50)
        .attr('dy', '0em')
        .text(
            '* Originally in the spending side of the data as a negative value'
        )
        .attr('class', 'legend')
        .attr('font-size', 16)

    svg
        .append('text')
        .attr('x', width * 0.65)
        .attr('y', height + 70)
        .attr('dy', '0em')
        .text('** Called "Programmatic" in the dataset')
        .attr('class', 'legend')
        .attr('font-size', 16)

    svg
        .append('text')
        .attr('x', width * 0.65)
        .attr('y', height + 90)
        .attr('dy', '0em')
        .text('Source: OMB')
        .attr('class', 'legend')
        .attr('font-size', 16)
}

// unique values of an array
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index
}
